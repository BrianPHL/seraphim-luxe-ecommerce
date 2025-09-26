import { useCallback, useContext, useEffect, useState } from "react";
import { useAuth, useToast } from '@contexts';
import { fetchWithTimeout } from "@utils";
import NotificationsContext from "./context";

export const NotificationsProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const [ notifications, setNotifications ] = useState([]);
    const [ isInboxOpen, setIsInboxOpen ] = useState(false);
    const [ unreadCount, setUnreadCount ] = useState(0);
    const [ sseConnected, setSseConnected ] = useState(false);

    const fetchNotifications = useCallback(async () => {

        if (!user) return;

        try {
            
            const response = await fetchWithTimeout(`/api/notifications/${ user.id }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch notifications!");

            const data = await response.json();

            setNotifications(data || []);

        } catch (err) {

            console.error("Notifications context fetchNotifications function error: ", err);
            showToast('Failed to retrieve notifications!', 'error')
            
        }
    }, [ user ]);

    const fetchUnreadCount = useCallback(() => {

        const unreadCount = notifications.filter(notification => notification.is_read === 0).length;

        setUnreadCount(unreadCount);

    }, [ notifications ])

    const readAllNotifications = async () => {

        if (!user) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/mark-all-as-read/${ user.id }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to mark all notifications as read!");

            await fetchNotifications();
            
        } catch (err) {

            console.error("Notifications context readAllNotifications function error: ", err);
            showToast('Failed to mark all notifications as read!', 'error')
            
        }

    };

    const readSpecificNotification = async (notificationId) => {
        
        if (!user) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/mark-as-read/${ notificationId }/${ user.id }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to mark the notification as read!");

            await fetchNotifications();

        } catch (err) {

            console.error("Notifications context readSpecificNotification function error: ", err);
            showToast('Failed to mark the notification as read!', 'error')

        }

    };

    const clearAllNotifications = async () => {

        if (!user) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/clear-all/${ user.id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to clear all notifications!");

            await fetchNotifications();
            
        } catch (err) {

            console.error("Notifications context clearAllNotifications function error: ", err);
            showToast('Failed to clear all notifications!', 'error')
            
        }

    };

    const clearSpecificNotification = async (notificationId) => {

        if (!user) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/clear/${ notificationId }/${ user.id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to clear the notification!");

            await fetchNotifications();
            
        } catch (err) {

            console.error("Notifications context clearSpecificNotification function error: ", err);
            showToast('Failed to clear the notification!', 'error')
            
        }

    };

    const setNotification = useCallback(async (data) => {

        if (!user) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/${ user.id }`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: data.type,
                    title: data.title,
                    message: data.message
                })
            });

            if (!response.ok)
                throw new Error("Failed to set new notification!");

            await fetchNotifications();

        } catch (err) {

            console.error("Notifications context setNotification function error: ", err);
            showToast('Failed to set new notification!', 'error')
            
        }

    }, [ user ]);

    useEffect(() => {
        fetchNotifications()
    }, [ user ]);

    useEffect(() => {
        fetchUnreadCount()
    }, [ notifications ]);

    useEffect(() => {

        if (!user) return;

        const eventSource = new EventSource(`/api/sse/${ user.id }`);

        eventSource.onopen = () => setSseConnected(true);

        eventSource.onmessage = (event) => {

            const data = JSON.parse(event.data);
            const status = data?.type;
            const orderNumber = data?.order_number;

            if (!status || status === 'connected') return;

            switch (status) {
                case 'processing':
                    setNotification({
                        type: 'orders',
                        title: 'Order Processing',
                        message: `Your order ${ data.order_number } is now processing.`
                    });
                    break;

                case 'shipped':
                    setNotification({
                        type: 'orders',
                        title: 'Order Shipped',
                        message: `Your order ${ data.order_number } is now shipped.`
                    });
                    break;

                case 'delivered':
                    setNotification({
                        type: 'orders',
                        title: 'Order Delivered',
                        message: `Your order ${ data.order_number } is now delivered.`
                    });
                    break;

                case 'cancelled':
                    setNotification({
                        type: 'orders',
                        title: 'Order Cancelled',
                        message: `Your order ${ data.order_number } is now cancelled.`
                    });
                    break;

                case 'returned':
                    setNotification({
                        type: 'orders',
                        title: 'Order Returned',
                        message: `Your order ${ data.order_number } is now returned.`
                    });
                    break;
                    
                case 'refunded':
                    setNotification({
                        type: 'orders',
                        title: 'Order Refunded',
                        message: `Your order ${ data.order_number } is now refunded.`
                    });
                    break;
                    
                default:
                    console.error('Invalid status value passed from server!');
            }

        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            setSseConnected(false);
        };
        
        return () => {
            eventSource.close();
            setSseConnected(false); 
        };

    }, [ user ]);

    return (
        <NotificationsContext.Provider value={{
            
        // * Data
            notifications,
            isInboxOpen,
            unreadCount,
            sseConnected,

        // * Exposed functions
            fetchNotifications,
            readAllNotifications,
            readSpecificNotification,
            clearAllNotifications,
            clearSpecificNotification,
            setNotification,
            setIsInboxOpen

        }}>
            { children }
        </NotificationsContext.Provider>
    );

};

export const useNotifications = () => useContext(NotificationsContext);
