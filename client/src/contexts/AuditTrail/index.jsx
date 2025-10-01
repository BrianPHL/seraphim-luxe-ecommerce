import { useContext, useState, useEffect } from "react";
import { useToast, useAuth } from '@contexts';
import AuditTrailContext from "./context";

export const AuditTrailProvider = ({ children, user }) => {

    const { showToast } = useToast();

    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        action_type: '',
        start_date: '',
        end_date: '',
        user_id: '',
        user_role: ''
    });

    // Fetch audit logs from server
    const fetchAuditLogs = async (options = {}) => {
        try {
            setLoading(true);
            
            const queryParams = new URLSearchParams();
            
            // Add pagination and search options
            queryParams.append('page', options.page || 1);
            queryParams.append('limit', options.limit || 10000);
            if (options.search) queryParams.append('search', options.search);
            
            // Add existing filters only if they have values
            if (filters.action_type) queryParams.append('action_type', filters.action_type);
            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);
            if (filters.user_id) queryParams.append('user_id', filters.user_id);
            if (filters.user_role) queryParams.append('user_role', filters.user_role); // Add this

            const response = await fetch(`/api/audit-trail?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            
            const data = await response.json();
            
            if (options.page === 1 || !options.page) {
                setAuditLogs(data.logs || data);
            } else {
                // For pagination, append to existing logs
                setAuditLogs(prev => [...prev, ...(data.logs || data)]);
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            showToast('Failed to load audit logs', 'error');
            return { logs: [], pagination: {} };
        } finally {
            setLoading(false);
        }
    };

    // Fetch audit statistics
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/audit-trail/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            
            const data = await response.json();
            setStats(data);
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    };

    // Helper function to add log entry to UI immediately
    const addLogEntry = (logData) => {
        const newLog = {
            id: Date.now(),
            ...logData,
            created_at: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            first_name: logData.first_name || user?.first_name || 'Unknown',
            last_name: logData.last_name || user?.last_name || 'User',
            email: logData.email || user?.email || 'unknown@email.com',
            role: logData.role || user?.role || 'user',
            ip_address: 'Real-time',
            user_agent: navigator.userAgent || 'Unknown'
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    // Log different types of actions (client-side logging + server sync)
    const logAction = async (logData) => {
        try {
            // Immediately add to UI for real-time feedback
            addLogEntry({
                user_id: logData.user_id || user?.id,
                first_name: logData.first_name || user?.first_name || 'Unknown',
                last_name: logData.last_name || user?.last_name || 'User',
                email: logData.email || user?.email || 'unknown@email.com',
                role: logData.role || user?.role || 'user',
                action_type: logData.action_type,
                resource_type: logData.resource_type || null,
                resource_id: logData.resource_id || null,
                details: logData.details || '',
                old_values: logData.old_values ? JSON.stringify(logData.old_values) : null,
                new_values: logData.new_values ? JSON.stringify(logData.new_values) : null
            });

            // Send to server for persistence
            const response = await fetch('/api/audit-trail/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: logData.user_id || user?.id,
                    first_name: logData.first_name || user?.first_name,
                    last_name: logData.last_name || user?.last_name,
                    email: logData.email || user?.email,
                    role: logData.role || user?.role,
                    action_type: logData.action_type,
                    resource_type: logData.resource_type || null,
                    resource_id: logData.resource_id || null,
                    details: logData.details || '',
                    old_values: logData.old_values || null,
                    new_values: logData.new_values || null
                })
            });

            if (!response.ok) {
                console.warn('Failed to sync audit log to server');
            }

            return true;
        } catch (error) {
            console.error('Error logging action:', error);
            return false;
        }
    };

    // Specific logging methods
    const logSignUp = (details = 'User signed up ', userData, userInfo = {}) => {
        return logAction({
            action_type: 'auth_signup',
            resource_type: 'session',
            new_values: userData,
            details,
            ...userInfo
        });
    };

    const logSignIn = (details = 'User signed in', userData, userInfo = {}) => {
        return logAction({
            action_type: 'auth_signin',
            resource_type: 'session',
            old_values: userData,
            details,
            ...userInfo
        });
    };

    const logSignOut = (details = 'User signed out', userInfo = {}) => {
        return logAction({
            action_type: 'auth_signout',
            resource_type: 'session',
            old_values: userInfo,
            details,
            ...userInfo
        });
    };

    const logCustomerAccountDelete = (userId, userData, userInfo = {}) => {
        return logAction({
            action_type: 'customer_account_remove',
            resource_type: 'account',
            resource_id: userId,
            old_values: userData,
            details: `Customer deleted their own account (${userData.email})`,
            ...userInfo
        });
    };

    const logProfileUpdate = (oldValues, newValues, userInfo = {}) => {
        return logAction({
            action_type: 'profile_update',
            resource_type: 'user_profile',
            resource_id: user?.id,
            old_values: oldValues,
            new_values: newValues,
            details: 'User profile updated',
            ...userInfo
        });
    };

    const logProfilePreferences = (oldValues, newValues, userInfo = {}) => {
        return logAction({
            action_type: 'profile_preferences_update',
            resource_type: 'user_settings',
            resource_id: userInfo.user_id || user?.id,
            old_values: oldValues,
            new_values: newValues,
            details: userInfo.details || 'User preferences updated',
            ...userInfo
        });
    };

    const logPasswordChange = (userInfo = {}) => {
        return logAction({
            action_type: 'auth_password_change',
            resource_type: 'account',
            resource_id: user?.id,
            details: 'Password changed',
            ...userInfo
        });
    };

    const logProductView = (productId, productName) => {
        return logAction({
            action_type: 'product_view',
            resource_type: 'product',
            resource_id: productId,
            details: `Viewed product: ${productName}`
        });
    };

    const logCartAdd = (productId, quantity, productName, userInfo = {}) => {
        return logAction({
            action_type: 'cart_add',
            resource_type: 'cart',
            resource_id: productId,
            new_values: { quantity, product_name: productName },
            details: `Added ${quantity} ${productName} to cart`,
            ...userInfo
        });
    };

    const logCartUpdate = (productId, oldQuantity, newQuantity, productName, userInfo = {}) => {
        return logAction({
            action_type: 'cart_update',
            resource_type: 'cart',
            resource_id: productId,
            old_values: { quantity: oldQuantity },
            new_values: { quantity: newQuantity, product_name: productName },
            details: `Updated ${productName} quantity from ${oldQuantity} to ${newQuantity} in cart`,
            ...userInfo
        });
    };

    const logCartRemove = (productId, productName, userInfo = {}) => {
        return logAction({
            action_type: 'cart_remove',
            resource_type: 'cart',
            resource_id: productId,
            details: `Removed ${productName} from cart`,
            ...userInfo
        });
    };

    const logWishlistAdd = (productId, productName, userInfo = {}) => {
        return logAction({
            action_type: 'wishlist_add',
            resource_type: 'wishlist',
            resource_id: productId,
            details: `Added ${productName} to wishlist`,
            ...userInfo
        });
    };

    const logWishlistRemove = (productId, productName, userInfo = {}) => {
        return logAction({
            action_type: 'wishlist_remove',
            resource_type: 'wishlist',
            resource_id: productId,
            details: `Removed ${productName} from wishlist`,
            ...userInfo
        });
    };

    const logOrderCreate = (orderId, orderData, userInfo = {}) => {
        return logAction({
            action_type: 'order_create',
            resource_type: 'order',
            resource_id: orderId,
            new_values: orderData,
            details: userInfo.details || `Order created for: ${orderData.product_names}`,
            ...userInfo
        });
    };

    const logOrderUpdate = (orderId, oldValues, newValues) => {
        return logAction({
            action_type: 'order_update',
            resource_type: 'order',
            resource_id: orderId,
            old_values: oldValues,
            new_values: newValues,
            details: `Order #${orderId} updated`
        });
    };

    const logOrderCancel = (orderId) => {
        return logAction({
            action_type: 'order_cancel',
            resource_type: 'order',
            resource_id: orderId,
            details: `Order #${orderId} cancelled`
        });
    };

    // Admin actions
    const logAdminProductCreate = (productId, productData) => {
        return logAction({
            action_type: 'admin_product_create',
            resource_type: 'product',
            resource_id: productId,
            new_values: productData,
            details: `Product ${productData.label || productId} created`
        });
    };

    const logAdminProductUpdate = (productId, oldValues, newValues) => {
        return logAction({
            action_type: 'admin_product_update',
            resource_type: 'product',
            resource_id: productId,
            old_values: oldValues,
            new_values: newValues,
            details: 'Product updated by admin'
        });
    };

    const logAdminProductDelete = (productId, productData) => {
        return logAction({
            action_type: 'admin_product_delete',
            resource_type: 'product',
            resource_id: productId,
            old_values: productData,
            details: `Product ${productData.label || productId} deleted`
        });
    };

    const logAdminAccountCreate = (newUserId, userData, userInfo = {}) => {
        return logAction({
            action_type: 'admin_account_create',
            resource_type: 'account',
            resource_id: newUserId,
            new_values: userData,
            details: `Account created for ${userData.email}`,
            ...userInfo
        });
    };

    const logAdminAccountUpdate = (targetUserId, oldValues, newValues, userInfo = {}) => {
        return logAction({
            action_type: 'admin_account_update',
            resource_type: 'account',
            resource_id: targetUserId,
            old_values: oldValues,
            new_values: newValues,
            details: ``,
            ...userInfo
        });
    };

    const logAdminAccountDelete = (targetUserId, userData, userInfo = {}) => {
        return logAction({
            action_type: 'admin_account_remove',
            resource_type: 'account',
            resource_id: targetUserId,
            old_values: userData,
            details: `Account deleted for ${userData.email || 'unknown user'}`,
            ...userInfo
        });
    };

    const logInvoicePrint = (orderId, orderData) => {
        return logAction({
            action_type: 'order_invoice_print',
            resource_type: 'order',
            resource_id: orderId,
            new_values: orderData,
            details: `Invoice printed for order #${orderData.order_number || orderId}`
        });
    };

    const logInvoiceReportPrint = (reportData) => {
        return logAction({
            action_type: 'order_invoice_report_print',
            resource_type: 'order',
            new_values: reportData,
            details: `Invoice report printed for ${reportData.order_count} orders (${reportData.date_range}) - Total Revenue: ₱${reportData.total_revenue}`
        });
    };

    // Update filters
    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const clearFilters = () => {
        setFilters({
            action_type: '',
            start_date: '',
            end_date: '',
            user_id: '',
            user_role: ''
        });
    };

    // Auto-refresh logs periodically if user is admin
    useEffect(() => {
        if (user?.role === 'admin') {
            fetchStats();
            
            // Refresh every 30 seconds for admin
            const interval = setInterval(() => {
                fetchStats();
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <AuditTrailContext.Provider value={{
            // State
            auditLogs,
            loading,
            stats,
            filters,

            // Actions
            fetchAuditLogs,
            fetchStats,
            updateFilters,
            clearFilters,
            addLogEntry,

            // Logging methods
            logAction,
            logSignUp,
            logSignIn,
            logSignOut,
            logCustomerAccountDelete,
            logProfileUpdate,
            logProfilePreferences,
            logPasswordChange,
            logProductView,
            logCartAdd,
            logCartUpdate,
            logCartRemove,
            logWishlistAdd,
            logWishlistRemove,
            logOrderCreate,
            logOrderUpdate,
            logOrderCancel,

            // Admin logging methods
            logAdminProductCreate,
            logAdminProductUpdate,
            logAdminProductDelete,
            logAdminAccountCreate,
            logAdminAccountUpdate,
            logAdminAccountDelete,
            logInvoicePrint,
            logInvoiceReportPrint
        }}>
            { children }
        </AuditTrailContext.Provider>
    );
};

export const useAuditTrail = () => useContext(AuditTrailContext);
