import { useCallback, useContext, useEffect, useState } from "react";
import { useAuth, useToast } from '@contexts';
import { fetchWithTimeout } from "@utils";
import NotificationsContext from "./context";
import { admin } from "better-auth/plugins";

export const NotificationsProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const [ notifications, setNotifications ] = useState([]);
    const [ isInboxOpen, setIsInboxOpen ] = useState(false);
    const [ unreadCount, setUnreadCount ] = useState(0);
    const [ sseConnected, setSseConnected ] = useState(false);

    const [ notificationPreferences, setNotificationPreferences ] = useState({
        cart_updates: true,
        wishlist_updates: true,
        order_updates: true,
        account_security: true,
        admin_new_orders: true,
        admin_customer_messages: true,
        admin_low_stock_alerts: true,
        email_order_updates: true,
        email_account_security: true
    });
    const [ hasNotificationChanges, setHasNotificationChanges ] = useState(false);
    const [ loadingNotifications, setLoadingNotifications ] = useState(false);

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

    const fetchNotificationPreferences = useCallback(async () => {

        if (!user) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/preferences/${ user.id }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch notification preferences!");

            const data = await response.json();

            if (data.preferences) {
                setNotificationPreferences(data.preferences);
            }

        } catch (err) {

            console.error("Notifications context fetchNotificationPreferences function error: ", err);
            
        }

    }, [ user ]);

    const updateNotificationPreferences = async (preferences) => {

        if (!user) return;

        setLoadingNotifications(true);

        try {

            const response = await fetchWithTimeout(`/api/notifications/preferences/${ user.id }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });

            if (!response.ok)
                throw new Error("Failed to update notification preferences!");

            showToast('Notification preferences updated!', 'success');
            setHasNotificationChanges(false);
            
            // Refresh preferences from server
            await fetchNotificationPreferences();

        } catch (err) {

            console.error("Notifications context updateNotificationPreferences function error: ", err);
            showToast('Failed to update notification preferences!', 'error');

        } finally {
            setLoadingNotifications(false);
        }

    };

    const handleNotificationToggle = (preference) => {
        setNotificationPreferences(prev => ({
            ...prev,
            [preference]: !prev[preference]
        }));
        setHasNotificationChanges(true);
    };

    const handleSaveNotifications = async () => {
        await updateNotificationPreferences(notificationPreferences);
    };

    const handleResetNotifications = async () => {
        await fetchNotificationPreferences();
        setHasNotificationChanges(false);
    };

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

        if (!user && !data.admin_id) return;

        try {

            const response = await fetchWithTimeout(`/api/notifications/${ user.id ?? data.admin_id }`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: data.type,
                    action: data.action,
                    title: data.title,
                    message: data.message,
                    metadata: data.metadata || null
                })
            });

            if (!response.ok)
                throw new Error("Failed to create notification!");

            await fetchNotifications();

        } catch (err) {

            console.error("Notifications context setNotification function error: ", err);
            
        }

    }, [ user, fetchNotifications ]);

    const notifyCartAction = useCallback(async ({ action, productName }) => { // * DONE
        if (!notificationPreferences.cart_updates) return;

        const actions = {
            add_to_cart: {
                title: 'Item Added to Cart',
                message: `${productName} has been added to your cart.`
            },
            remove_from_cart: {
                title: 'Item Removed from Cart',
                message: `${productName} has been removed from your cart.`
            }
        };

        await setNotification({
            type: 'cart',
            action: action,
            title: actions[action].title,
            message: actions[action].message,
            metadata: { product_name: productName }
        });
    }, [notificationPreferences.cart_updates, setNotification]);

    const notifyWishlistAction = useCallback(async ({ action, productName }) => { // * DONE
        if (!notificationPreferences.wishlist_updates) return;

        const actions = {
            add_to_wishlist: {
                title: 'Item Added to Wishlist',
                message: `${productName} has been added to your wishlist.`
            },
            remove_from_wishlist: {
                title: 'Item Removed from Wishlist',
                message: `${productName} has been removed from your wishlist.`
            }
        };

        await setNotification({
            type: 'wishlist',
            action: action,
            title: actions[action].title,
            message: actions[action].message,
            metadata: { product_name: productName }
        });
    }, [notificationPreferences.wishlist_updates, setNotification]);

    const notifyOrderUpdate = useCallback(async ({ action, orderNumber, additionalDetails = {} }) => {

        if (!notificationPreferences.order_updates) {
            return;
        }

        const actions = {
            order_pending: {
                title: 'Order Received',
                message: `Your order #${ orderNumber } has been received and is pending confirmation.`
            },
            order_processing: {
                title: 'Order Processing',
                message: `Your order #${ orderNumber } is now being processed.`
            },
            order_shipped: {
                title: 'Order Shipped',
                message: `Your order #${ orderNumber } has been shipped and is on its way!`
            },
            order_delivered: {
                title: 'Order Delivered',
                message: `Your order #${ orderNumber } has been delivered successfully.`
            },
            order_cancelled: {
                title: 'Order Cancelled',
                message: `Your order #${ orderNumber } has been cancelled.`
            },
            order_returned: {
                title: 'Order Returned',
                message: `Your order #${ orderNumber } has been marked as returned.`
            },
            order_refunded: {
                title: 'Order Refunded',
                message: `Your order #${ orderNumber } has been refunded.`
            }
        };

        try {

            await setNotification({
                type: 'orders',
                action: action,
                title: actions[action].title,
                message: actions[action].message,
                metadata: { order_number: orderNumber }
            });

            if (notificationPreferences.email_order_updates) {
                try {
                    await fetchWithTimeout('/api/orders/notify-order-update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: action.split('_')[1],
                            email: user?.email,
                            name: user?.first_name + ' ' + user?.last_name,
                            order_number: orderNumber,
                            additional_details: additionalDetails
                        })
                    });

                } catch (emailErr) {
                    console.error('Failed to send order update email notification:', emailErr);
                }
            }
        } catch (err) {
            console.error('notifyOrderUpdate error:', err);
        }
    }, [notificationPreferences.order_updates, notificationPreferences.email_order_updates, setNotification]);

    const notifyAccountChange = useCallback(async (action, additionalData = {}) => {
    
        if (!notificationPreferences.account_security) return;

        const actions = {
            email_changed: {
                title: 'Email Address Changed',
                message: 'Your email address has been successfully updated.',
            },
            password_changed: {
                title: 'Password Changed',
                message: 'Your password has been successfully updated.'
            }
        };

        await setNotification({
            type: 'account',
            action: action,
            title: actions[action].title,
            message: actions[action].message
        });

        try {
            if (action === 'password_changed' && additionalData.name && additionalData.email) {
                await fetchWithTimeout('/api/accounts/notify-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: additionalData.name,
                        email: additionalData.email
                    })
                });
            }

            if (action === 'email_changed' && additionalData.name && additionalData.oldEmail && additionalData.newEmail) {
                await fetchWithTimeout('/api/accounts/notify-email-change', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: additionalData.name,
                        oldEmail: additionalData.oldEmail,
                        newEmail: additionalData.newEmail
                    })
                });
            }
        } catch (err) {
            console.error('Failed to send account change email notification:', err);
        }

    }, [notificationPreferences.account_security, setNotification]);

    const notifyAdminNewOrder = useCallback(async ({ orderNumber, additionalDetails }) => {

        try {

            await setNotification({
                admin_id: additionalDetails.admin_id,
                type: 'admin_orders',
                action: 'new_order',
                title: 'New Order Received',
                message: `New order #${ orderNumber } from ${ additionalDetails.customer_name } (₱${ additionalDetails.total_amount })`,
                metadata: { order_number: orderNumber, customer_name: additionalDetails.customer_name, total_amount: additionalDetails.total_amount }
            });

        } catch (err) {
            console.error('Notifications context notifyAdminNewOrder function error: ', err);
        }

    }, [ notificationPreferences.admin_new_orders, setNotification ]);

    const notifyAdminLowStock = useCallback(async (productName, currentStock, threshold) => {
        // Get all admin users
        try {
            const response = await fetchWithTimeout('/api/accounts/admins', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) return;

            const admins = await response.json();

            // Create notification for each admin
            for (const admin of admins) {
                await fetchWithTimeout(`/api/notifications/${admin.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'admin_inventory',
                        action: 'low_stock',
                        title: 'Low Stock Alert',
                        message: `${productName} is running low (${currentStock}/${threshold} remaining)`,
                        metadata: { product_name: productName, current_stock: currentStock, threshold: threshold }
                    })
                });
            }

        } catch (err) {
            console.error('Notify admin low stock error:', err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchNotificationPreferences();
        }
    }, [ user, fetchNotifications, fetchNotificationPreferences ]);

    useEffect(() => {
        fetchUnreadCount()
    }, [ notifications, fetchUnreadCount ]);

    useEffect(() => {

        if (!user) return;

        const eventSource = new EventSource(`/api/sse/${ user.id }`);

        eventSource.onopen = () => setSseConnected(true);

        eventSource.onmessage = (event) => {

            const data = JSON.parse(event.data);
            const status = data?.type;

            if (!status || status === 'connected') return;

            if (data.type === 'order_update') {
                notifyOrderUpdate({
                    action: data.action,
                    orderNumber: data.order_number,
                    additionalDetails: data.additional_details
                });
            }

            if (data.type === 'new_order' && user.role === 'admin') {
                notifyAdminNewOrder({
                    orderNumber: data.order_number,
                    additionalDetails: data.additional_details
                });
            }

            if (data.type === 'low_stock' && user.role === 'admin') {
                fetchNotifications();
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

    }, [ user, notifyOrderUpdate ]);

    return (
        <NotificationsContext.Provider value={{
            
        // * Data
            notifications,
            isInboxOpen,
            unreadCount,
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
            { children }
        </NotificationsContext.Provider>
    );

};

export const useNotifications = () => useContext(NotificationsContext);
