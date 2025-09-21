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


    useEffect(() => {
        fetchNotifications()
    }, [ user ]);

    useEffect(() => {
        fetchUnreadCount()
    }, [ notifications ])

    return (
        <NotificationsContext.Provider value={{
            
        // * Data
            notifications,
            isInboxOpen,
            unreadCount,

        // * Exposed functions
            fetchNotifications,
            readAllNotifications,
            setIsInboxOpen

        }}>
            { children }
        </NotificationsContext.Provider>
    );

};

export const useNotifications = () => useContext(NotificationsContext);
