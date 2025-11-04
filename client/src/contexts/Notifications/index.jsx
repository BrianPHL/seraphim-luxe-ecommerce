import { useContext, useState, useEffect } from 'react';
import { useAuth, useToast, useSSE } from '@contexts';
import NotificationsContext from './context';

export const NotificationsProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const { subscribe } = useSSE();

    const [ notifications, setNotifications ] = useState([]);
    const [ unreadCount, setUnreadCount ] = useState(0);

    const fetchNotifications = async () => {
        if (!user) return;
        
        try {
            const response = await fetch('/api/notifications', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch notifications');

            const result = await response.json();
            setNotifications(result.data || []);

        } catch (err) {
            console.error('[Notifications] fetchNotifications error:', err);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user) return;
        
        try {
            const response = await fetch('/api/notifications/unread-count', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch unread count');

            const result = await response.json();
            setUnreadCount(result.data?.unread_count || 0);

        } catch (err) {
            console.error('[Notifications] fetchUnreadCount error:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');

            await fetchNotifications();
            await fetchUnreadCount();

        } catch (err) {
            console.error('[Notifications] markAsRead error:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to mark all notifications as read');

            await fetchNotifications();
            await fetchUnreadCount();

        } catch (err) {
            console.error('[Notifications] markAllAsRead error:', err);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to delete notification');

            await fetchNotifications();
            await fetchUnreadCount();

        } catch (err) {
            console.error('[Notifications] deleteNotification error:', err);
        }
    };

    useEffect(() => {
        if (!user) return;

        console.log('[Notifications] Subscribing to SSE notification events');

        const unsubscribe = subscribe('notifications', (data) => {
            console.log('[Notifications] Received SSE event:', data.type);

            let notificationMessage = '';

            switch (data.type) {
                case 'processing':
                    notificationMessage = `Your order ${data.order_number} is now processing.`;
                    break;
                
                case 'shipped':
                    notificationMessage = `Your order ${data.order_number} has been shipped.`;
                    break;
                
                case 'delivered':
                    notificationMessage = `Your order ${data.order_number} has been delivered.`;
                    break;
                
                case 'cancelled':
                    notificationMessage = `Your order ${data.order_number} has been cancelled.`;
                    break;
                
                default:
                    console.warn('[Notifications] Unknown notification type:', data.type);
                    return;
            }

            if (notificationMessage) {
                showToast(notificationMessage, 'info');
                fetchNotifications();
                fetchUnreadCount();
            }
        });

        return () => {
            console.log('[Notifications] Unsubscribing from SSE notification events');
            unsubscribe();
        };
    }, [user, subscribe, showToast]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [user]);

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            sseConnected,
            
            // Notification preferences
            notificationPreferences,
            hasNotificationChanges,
            loadingNotifications,

        // * Exposed functions
            fetchNotifications,
            readAllNotifications,
            readSpecificNotification,
            clearAllNotifications,
            clearSpecificNotification,
            setNotification,
            setIsInboxOpen,
            
            // Notification preferences functions
            fetchNotificationPreferences,
            updateNotificationPreferences,
            handleNotificationToggle,
            handleSaveNotifications,
            handleResetNotifications,

            // Customer notification helpers
            notifyCartAction,
            notifyWishlistAction,
            notifyOrderUpdate,
            notifyAccountChange,

            // Admin notification helpers
            notifyAdminNewOrder,
            notifyAdminLowStock

        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationsContext);
