import { useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth, useToast, useSSE } from '@contexts';
import { fetchWithTimeout } from "@utils";
import LiveChatContext from "./context";

export const LiveChatProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const { subscribe, isConnected } = useSSE();
    
    const [ rooms, setRooms ] = useState([]);
    const [ selectedRoom, setSelectedRoom ] = useState(null);
    const [ messages, setMessages ] = useState([]);
    const [ customers, setCustomers ] = useState({});
    const [ isLoading, setIsLoading ] = useState(false);
    const [ lastFetchTime, setLastFetchTime ] = useState(Date.now());

    const selectedRoomIdRef = useRef(null);
    const lastFetchTimeRef = useRef(Date.now());

    // Fetch customer details
    const fetchCustomerDetails = useCallback(async (customerIds) => {
        if (!customerIds || customerIds.length === 0) return;
        
        try {
            const promises = customerIds.map(id => 
                fetchWithTimeout(`/api/accounts/${id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }).then(res => res.json())
                .catch(err => {
                    console.error(`[LiveChat] Failed to fetch customer ${id}:`, err);
                    return null;
                })
            );

            const results = await Promise.all(promises);
            const customerMap = {};
            
            results.forEach(result => {
                if (result && result.success && result.data) {
                    customerMap[result.data.id] = result.data;
                }
            });

            setCustomers(prev => ({ ...prev, ...customerMap }));

        } catch (err) {
            console.error('[LiveChat] fetchCustomerDetails error:', err);
        }
    }, []);

    // Fetch rooms - removed customers dependency
    const fetchRooms = useCallback(async (silent = false) => {
        if (!user) return [];

        try {
            const response = await fetchWithTimeout('/api/live-chat/rooms', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch rooms');

            const result = await response.json();
            
            if (!silent) {
                console.log('[LiveChat] Fetched rooms:', result.data?.length || 0);
            }
            
            setRooms(result.data || []);

            // Fetch customer details for new customers
            const roomCustomerIds = (result.data || []).map(room => room.customer_id);
            setCustomers(prevCustomers => {
                const existingCustomerIds = Object.keys(prevCustomers).map(Number);
                const newCustomerIds = [...new Set(roomCustomerIds.filter(id => !existingCustomerIds.includes(id)))];
                
                if (newCustomerIds.length > 0) {
                    fetchCustomerDetails(newCustomerIds);
                }
                
                return prevCustomers;
            });

            return result.data || [];

        } catch (err) {
            console.error('[LiveChat] fetchRooms error:', err);
            if (!silent) {
                showToast('Failed to load chat rooms', 'error');
            }
            return [];
        }
    }, [user, showToast, fetchCustomerDetails]);

    const fetchMessages = async (roomId) => {
        try {
            const room = [...activeRooms, ...waitingRooms, ...closedRooms].find(r => r.id === roomId);
            const customerId = room?.customer_id;
        
            if (!customerId) {
                throw new Error('Customer ID not found');
            }
        
            const response = await fetch(`/api/live-chat/room/${roomId}/unified-messages?user_id=${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
        
            if (!response.ok) throw new Error('Failed to fetch messages');
        
            const result = await response.json();
            
            const aiMsgs = result.data.aiMessages || [];
            const liveMsgs = result.data.liveMessages || [];
            
            const allMessages = [
                ...aiMsgs.map(msg => ({
                    ...msg,
                    source: 'ai',
                    timestamp: new Date(msg.created_at).getTime()
                })),
                ...liveMsgs.map(msg => ({
                    ...msg,
                    source: 'live',
                    sender_name: msg.sender_name, // Include sender name
                    timestamp: new Date(msg.created_at).getTime()
                }))
            ].sort((a, b) => a.timestamp - b.timestamp);
        
            setMessages(allMessages);
        
        } catch (error) {
            console.error('Fetch messages error:', error);
            showToast('Failed to load messages', 'error');
        }
    };

    const claimRoom = async (roomId) => {
        if (!user) return { success: false, message: 'User not authenticated' };

        try {
            const response = await fetchWithTimeout(`/api/live-chat/room/${roomId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: user.id })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to claim room');
            }

            showToast('Chat claimed successfully', 'success');
            
            // Optimistically update room status
            setRooms(prevRooms => 
                prevRooms.map(room => 
                    room.id === roomId 
                        ? { ...room, status: 'active', agent_id: user.id }
                        : room
                )
            );
            
            // Fetch updated data
            await fetchRooms(true);
            
            // Set as selected room and load messages
            setTimeout(async () => {
                const updatedRooms = await fetchRooms(true);
                const claimedRoom = updatedRooms.find(r => r.id === roomId);
                if (claimedRoom) {
                    setSelectedRoom(claimedRoom);
                    await fetchMessages(roomId);
                }
            }, 100);

            return { success: true };

        } catch (err) {
            console.error('[LiveChat] claimRoom error:', err);
            showToast(err.message || 'Failed to claim chat', 'error');
            return { success: false, message: err.message };
        }
    };

    const sendMessage = async (roomId, messageText) => {
        if (!user || !roomId || !messageText.trim()) {
            return { success: false, message: 'Invalid parameters' };
        }

        try {
            setIsLoading(true);

            const response = await fetchWithTimeout(`/api/live-chat/room/${roomId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: user.id,
                    sender_type: 'agent',
                    message: messageText.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message');
            }

            const result = await response.json();
            
            console.log('[LiveChat] Message sent:', result.data);
            
            if (selectedRoom?.id === roomId) {
                setMessages(prev => {
                    const exists = prev.find(msg => msg.id === result.data.id);
                    if (exists) return prev;
                    return [...prev, result.data];
                });
            }

            return { success: true, data: result.data };

        } catch (err) {
            console.error('[LiveChat] sendMessage error:', err);
            showToast(err.message || 'Failed to send message', 'error');
            return { success: false, message: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    const closeRoom = async (roomId) => {
        if (!user || !roomId) return { success: false, message: 'Invalid parameters' };

        try {
            const response = await fetchWithTimeout(`/api/live-chat/room/${roomId}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });

            if (!response.ok) throw new Error('Failed to close chat');

            showToast('Chat concluded successfully', 'success');

            if (selectedRoom?.id === roomId) {
                setSelectedRoom(null);
                setMessages([]);
            }

            // Remove the optimistic update - let SSE handle it
            // The room_returned_to_waiting event will update the status in real-time

            // Keep fetchRooms as a backup but make it silent
            // Add a small delay to let SSE event arrive first
            setTimeout(() => {
                fetchRooms(true);
            }, 1000);

            return { success: true };

        } catch (err) {
            console.error('[LiveChat] closeRoom error:', err);
            showToast('Failed to conclude chat', 'error');
            return { success: false, message: err.message };
        }
    };

    // Auto-clear selected room if it's no longer valid (status changed)
    useEffect(() => {
        if (selectedRoom) {
            const currentRoom = rooms.find(r => r.id === selectedRoom.id);
            
            // If room no longer exists or status changed from what was selected
            if (!currentRoom || currentRoom.status !== selectedRoom.status) {
                console.log('[LiveChat] Selected room status changed or removed, clearing selection');
                setSelectedRoom(null);
                setMessages([]);
            }
        }
    }, [rooms, selectedRoom]);

    useEffect(() => {
        if (isConnected && user?.role === 'admin') {
            console.log('[LiveChat] SSE reconnected, fetching rooms');
            fetchRooms();
        }
    }, [isConnected, user?.role, fetchRooms]);

    // Update ref whenever selectedRoom changes
    useEffect(() => {
        selectedRoomIdRef.current = selectedRoom?.id || null;
    }, [selectedRoom]);

    // SSE subscription with stable dependencies
    useEffect(() => {
        if (!user?.id || user?.role !== 'admin') {
            console.log('[LiveChat] Not an admin, skipping SSE subscription');
            return;
        }
    
        console.log('[LiveChat] Subscribing to SSE livechat events');
        
        // Initial fetch when SSE connects
        fetchRooms();
    
        const unsubscribe = subscribe('livechat', (data) => {
            console.log('[LiveChat] Received SSE event:', data.type, data);
            lastFetchTimeRef.current = Date.now();
        
            if (data.type === 'new_chat_room' || data.type === 'room_reactivated') {
                console.log(`[LiveChat] ${data.type}: Room ${data.room_id}`);
                
                if (data.customer_id) {
                    setCustomers(prev => {
                        if (!prev[data.customer_id]) {
                            fetchCustomerDetails([data.customer_id]);
                        }
                        return prev;
                    });
                }
                
                if (data.type === 'room_reactivated') {
                    // Update existing room
                    setRooms(prevRooms => {
                        const existingRoom = prevRooms.find(r => r.id === data.room_id);
                        if (existingRoom) {
                            return prevRooms.map(room => 
                                room.id === parseInt(data.room_id)
                                    ? { ...room, status: 'waiting', agent_id: null, modified_at: new Date().toISOString() }
                                    : room
                            );
                        }
                        return prevRooms;
                    });
                } else if (data.type === 'new_chat_room') {
                    // Add new room to state
                    const newRoom = {
                        id: data.room_id,
                        customer_id: parseInt(data.customer_id),
                        agent_id: null,
                        status: data.status || 'waiting',
                        priority: data.priority || 'low',
                        created_at: new Date().toISOString(),
                        modified_at: new Date().toISOString()
                    };
                    
                    setRooms(prevRooms => {
                        // Check if room already exists
                        const exists = prevRooms.some(r => r.id === data.room_id);
                        if (exists) return prevRooms;
                        return [...prevRooms, newRoom];
                    });
                }
            
                showToast(data.type === 'new_chat_room' ? 'New chat request received' : 'Chat room reactivated', 'info');
            } else if (data.type === 'new_message') {
                console.log('[LiveChat] New message received');
                
                // Use ref instead of closure variable
                if (selectedRoomIdRef.current && data.data.room_id === selectedRoomIdRef.current) {
                    setMessages(prev => {
                        const exists = prev.find(msg => msg.id === data.data.id);
                        if (exists) {
                            console.log('[LiveChat] Message already exists');
                            return prev;
                        }
                        console.log('[LiveChat] Adding new message to selected room');
                        return [...prev, data.data];
                    });
                }

                setRooms(prevRooms => 
                    prevRooms.map(room => 
                        room.id === data.data.room_id
                            ? { ...room, modified_at: new Date().toISOString() }
                            : room
                    )
                );

            } else if (data.type === 'room_returned_to_waiting') {
                console.log('[LiveChat] ✅ Room returned to waiting queue:', data.room_id);
                console.log('[LiveChat] Current rooms before update:', rooms.length);

                setRooms(prevRooms => {
                    const updated = prevRooms.map(room => 
                        room.id === parseInt(data.room_id)
                            ? { ...room, status: 'waiting', agent_id: null }
                            : room
                    );
                    console.log('[LiveChat] Rooms after SSE update:', updated.length);
                    return updated;
                });
                
            } else if (data.type === 'agent_concluded') {
                console.log('[LiveChat] Agent concluded chat, room back to waiting');

                setRooms(prevRooms => 
                    prevRooms.map(room => 
                        room.id === parseInt(data.room_id)
                            ? { ...room, status: 'waiting', agent_id: null }
                            : room
                    )
                );

                if (selectedRoomIdRef.current && data.room_id === selectedRoomIdRef.current) {
                    showToast('Chat session concluded', 'info');
                    setSelectedRoom(null);
                    setMessages([]);
                }
                
            } else if (data.type === 'customer_disconnected') {
                console.log('[LiveChat] Customer disconnected from room:', data.room_id);
            
                setRooms(prevRooms => 
                    prevRooms.map(room => 
                        room.id === parseInt(data.room_id)
                            ? { ...room, status: 'concluded' }
                            : room
                    )
                );

                if (selectedRoomIdRef.current && data.room_id === selectedRoomIdRef.current) {
                    showToast('Customer has disconnected', 'info');
                    setSelectedRoom(null);
                    setMessages([]);
                }

            }
        });
        
        // Polling fallback
        const pollingInterval = setInterval(() => {
            const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
            if (timeSinceLastFetch > 10000) {
                console.log('[LiveChat] Polling fallback - fetching rooms');
                fetchRooms(true);
                lastFetchTimeRef.current = Date.now();
            }
        }, 10000);
        
        return () => {
            console.log('[LiveChat] Unsubscribing from SSE livechat events');
            clearInterval(pollingInterval);
            unsubscribe();
        };
    }, [user?.id, user?.role]);
    // Room categorization
    const { activeRooms, waitingRooms, closedRooms } = useMemo(() => {
        if (!user) return { activeRooms: [], waitingRooms: [], closedRooms: [] };

        const active = rooms.filter(room => 
            room.status === 'active' && Number(room.agent_id) === Number(user.id)
        );

        const waiting = rooms.filter(room => room.status === 'waiting');

        const closed = rooms.filter(room => 
            room.status === 'concluded' && 
            (room.agent_id === null || Number(room.agent_id) === Number(user.id))
        );

        console.log('[LiveChat] Room categorization:', {
            total: rooms.length,
            active: active.length,
            waiting: waiting.length,
            concluded: closed.length
        });

        return { activeRooms: active, waitingRooms: waiting, closedRooms: closed };
    }, [rooms, user]);

    // Initial fetch
    useEffect(() => {
        if (user?.id && user?.role === 'admin') {
            fetchRooms();
        }
    }, [user?.id, user?.role, fetchRooms]);

    return (
        <LiveChatContext.Provider value={{
            rooms,
            activeRooms,
            waitingRooms,
            closedRooms,
            selectedRoom,
            messages,
            customers,
            isLoading,
            fetchRooms,
            fetchMessages,
            claimRoom,
            sendMessage,
            closeRoom,
            setSelectedRoom,
            setMessages
        }}>
            {children}
        </LiveChatContext.Provider>
    );
};

export const useLiveChat = () => useContext(LiveChatContext);
