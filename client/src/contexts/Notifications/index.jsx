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
            unreadCount,
        // * Exposed functions
            fetchNotifications,
            setIsInboxOpen

        }}>
            { children }
        </NotificationsContext.Provider>
    );

};

export const useNotifications = () => useContext(NotificationsContext);
