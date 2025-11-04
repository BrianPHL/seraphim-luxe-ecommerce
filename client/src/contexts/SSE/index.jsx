import { useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@contexts';
import SSEContext from './context';

export const SSEProvider = ({ children }) => {

    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    
    const eventSourceRef = useRef(null);
    const listenersRef = useRef({
        livechat: new Set(),
        notifications: new Set(),
        contacts: new Set(),
        general: new Set()
    });
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;

    const subscribe = (category, callback) => {
        if (!listenersRef.current[category]) {
            console.warn(`[SSE] Unknown category: ${category}`);
            return () => {};
        }

        console.log(`[SSE] Adding listener to category: ${category}`);
        listenersRef.current[category].add(callback);

        return () => {
            console.log(`[SSE] Removing listener from category: ${category}`);
            listenersRef.current[category].delete(callback);
        };
    };

    const broadcast = (category, data) => {
        const listeners = listenersRef.current[category];
        if (!listeners || listeners.size === 0) {
            console.log(`[SSE] No listeners for category: ${category}`);
            return;
        }

        console.log(`[SSE] Broadcasting to ${listeners.size} ${category} listeners`);
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (err) {
                console.error(`[SSE] Error in ${category} listener:`, err);
            }
        });
    };

    const routeEvent = (data) => {
        const eventType = data?.type;
    
        console.log(`[SSE] Routing event: ${eventType}`);
    
        if (['new_message', 'agent_joined', 'agent_concluded', 'chat_closed', 'new_chat_room', 'customer_disconnected', 'room_reactivated', 'room_returned_to_waiting'].includes(eventType)) {
            broadcast('livechat', data);
            return;
        }
    
        if (['processing', 'shipped', 'delivered', 'cancelled'].includes(eventType)) {
            broadcast('notifications', data);
            return;
        }
    
        if (['new_support_ticket', 'support_ticket_message', 'ticket_agent_assigned', 'ticket_status_updated'].includes(eventType)) {
            broadcast('contacts', data);
            return;
        }
    
        broadcast('general', data);
    };

    const connect = () => {
        if (!user?.id) {
            console.log('[SSE] No user, skipping connection');
            return;
        }

        if (eventSourceRef.current) {
            console.log('[SSE] Connection already exists');
            return;
        }

        console.log(`[SSE] Establishing connection for user ${user.id} (${user.role})`);

        const eventSource = new EventSource(`/api/sse/${user.id}`);

        eventSource.onopen = () => {
            console.log('[SSE] ✓ Connection established');
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const eventType = data?.type;

                if (eventType === 'connected') {
                    console.log('[SSE] Initial connection handshake received');
                    return;
                }

                if (!eventType) {
                    console.warn('[SSE] Received event without type:', data);
                    return;
                }

                console.log(`[SSE] ← Received: ${eventType}`, data);
                routeEvent(data);

            } catch (err) {
                console.error('[SSE] Error parsing event:', err);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[SSE] ✗ Connection error:', error);
            setIsConnected(false);
            
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttemptsRef.current++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
                
                console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
                
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, delay);
            } else {
                console.error('[SSE] Max reconnection attempts reached');
            }
        };

        eventSourceRef.current = eventSource;
    };

    const disconnect = () => {
        console.log('[SSE] Disconnecting...');
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsConnected(false);
    };

    useEffect(() => {
        if (user?.id) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [user?.id]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return (
        <SSEContext.Provider value={{
            isConnected,
            subscribe,
            connect,
            disconnect
        }}>
            {children}
        </SSEContext.Provider>
    );
};

export const useSSE = () => useContext(SSEContext);
