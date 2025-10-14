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

    const fetchAuditLogs = async (options = {}) => {
        try {
            setLoading(true);
            
            const queryParams = new URLSearchParams();
            
            queryParams.append('page', options.page || 1);
            queryParams.append('limit', options.limit || 10000);
            if (options.search) queryParams.append('search', options.search);
            
            if (filters.action_type) queryParams.append('action_type', filters.action_type);
            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);
            if (filters.user_id) queryParams.append('user_id', filters.user_id);
            if (filters.user_role) queryParams.append('user_role', filters.user_role); 

            const response = await fetch(`/api/audit-trail?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            
            const data = await response.json();
            
            if (options.page === 1 || !options.page) {
                setAuditLogs(data.logs || data);
            } else {
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

    const addLogEntry = (logData) => {
        const newLog = {
            id: Date.now(),
            ...logData,
            created_at: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            user_id: logData.user_id || user?.id,
            first_name: logData.first_name || user?.first_name || 'Unknown',
            last_name: logData.last_name || user?.last_name || 'User',
            email: logData.email || user?.email || 'unknown@email.com',
            role: logData.role || user?.role || 'user',
            ip_address: 'Real-time',
            user_agent: navigator.userAgent || 'Unknown'
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    const logAction = async (logData) => {
        try {
            const auditData = {
                user_id: logData.user_id || user?.id,
                first_name: logData.first_name || user?.first_name || 'Unknown',
                last_name: logData.last_name || user?.last_name || 'User', 
                email: logData.email || user?.email || 'unknown@email.com',
                role: logData.role || user?.role || 'user',
                action_type: logData.action_type,
                resource_type: logData.resource_type || null,
                resource_id: logData.resource_id || null,
                details: logData.details || '',
                old_values: logData.old_values || null,
                new_values: logData.new_values || null
            };

            addLogEntry(auditData);

            const response = await fetch('/api/audit-trail/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(auditData)
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
        const safeUserData = {
            email: userData?.email || userInfo?.email || 'unknown@email.com',
            first_name: userData?.first_name || userInfo?.first_name || 'Unknown',
            last_name: userData?.last_name || userInfo?.last_name || 'User',
            role: userData?.role || userInfo?.role || 'customer',
            ...userData
        };

        return logAction({
            action_type: 'customer_account_remove',
            resource_type: 'account',
            resource_id: userId,
            old_values: safeUserData,
            details: `Customer deleted their own account (${safeUserData.email})`,
            user_id: userId,
            first_name: safeUserData.first_name,
            last_name: safeUserData.last_name,
            email: safeUserData.email,
            role: safeUserData.role
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

    const logOrderUpdate = (orderId, oldValues, newValues, userInfo = {}) => {
        return logAction({
            action_type: 'order_update',
            resource_type: 'order',
            resource_id: orderId,
            old_values: oldValues,
            new_values: newValues,
            details: `Order #${oldValues.order_number || orderId} status updated from ${oldValues.status} to ${newValues.status}`,
            ...userInfo
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

    const logAdminProductCreate = (productId, productData, userInfo = {}) => {
        return logAction({
            action_type: 'admin_product_create',
            resource_type: 'product',
            resource_id: productId,
            new_values: productData,
            details: `Product ${productData.label || productId} created`,
            ...userInfo
        });
    };

    const logAdminProductUpdate = (productId, oldValues, newValues, userInfo = {}) => {
        return logAction({
            action_type: 'admin_product_update',
            resource_type: 'product',
            resource_id: productId,
            old_values: oldValues,
            new_values: newValues,
            details: 'Product updated by admin',
            ...userInfo
        });
    };

    const logAdminProductDelete = (productId, productData, userInfo = {}) => {
        return logAction({
            action_type: 'admin_product_delete',
            resource_type: 'product',
            resource_id: productId,
            old_values: productData,
            details: `Product ${productData.label || productId} deleted`,
            ...userInfo
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
        const safeUserData = {
            email: userData?.email || 'unknown@email.com',
            first_name: userData?.first_name || 'Unknown',
            last_name: userData?.last_name || 'User', 
            role: userData?.role || 'customer',
            phone_number: userData?.phone_number,
            ...userData
        };

        return logAction({
            action_type: 'admin_account_remove',
            resource_type: 'account',
            resource_id: targetUserId,
            old_values: {
                ...safeUserData,
                deleted_user_name: `${safeUserData.first_name} ${safeUserData.last_name}`,
                deleted_user_email: safeUserData.email,
                deleted_user_role: safeUserData.role
            },
            details: `Account deleted for ${safeUserData.email} (${safeUserData.first_name} ${safeUserData.last_name})`,
            user_id: userInfo.user_id || user?.id,
            first_name: userInfo.first_name || user?.first_name,
            last_name: userInfo.last_name || user?.last_name,
            email: userInfo.email || user?.email,
            role: userInfo.role || user?.role
        });
    };

    // Stock Logs
    const logAdminStockUpdate = (productId, productName, oldStock, newStock, quantityChange, notes, userInfo = {}) => {
        return logAction({
            action_type: 'admin_stock_update',
            resource_type: 'product',
            resource_id: productId,
            old_values: { 
                stock_quantity: oldStock,
                product_name: productName
            },
            new_values: { 
                stock_quantity: newStock,
                quantity_change: quantityChange,
                product_name: productName,
                notes: notes || null
            },
            details: `Stock updated for ${productName}: ${oldStock} → ${newStock} (${quantityChange > 0 ? '+' : ''}${quantityChange})${notes ? ` - ${notes}` : ''}`,
            ...userInfo
        });
    };

    // Invoice logs
    const logInvoicePrint = (orderId, orderData, userInfo = {}) => {
        return logAction({
            action_type: 'order_invoice_print',
            resource_type: 'order',
            resource_id: orderId,
            new_values: orderData,
            details: `Invoice printed for order #${orderData.order_number || orderId} (Customer: ${orderData.customer_name})`,
            ...userInfo
        });
    };

    const logInvoiceReportPrint = (reportData, userInfo = {}) => {
        return logAction({
            action_type: 'order_invoice_report_print',
            resource_type: 'order',
            new_values: reportData,
            details: `Invoice report printed for ${reportData.order_count} orders (${reportData.date_range}) - Total Revenue: ₱${reportData.total_revenue}`,
            ...userInfo
        });
    };

    // Category Logs
    const logAdminCategoryCreate = (categoryId, categoryData, userInfo = {}) => {
        const email = userInfo.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_category_create',
            resource_type: 'category',
            resource_id: categoryId,
            new_values: categoryData,
            details: categoryData.type === 'subcategory'
                ? `Subcategory "${categoryData.name}" created by ${email}`
                : `Category "${categoryData.name}" created by ${email}`,
            ...userInfo
        });
    };

    const logAdminCategoryUpdate = (categoryId, oldValues, newValues, userInfo = {}) => {
        const email = userInfo.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_category_update',
            resource_type: 'category',
            resource_id: categoryId,
            old_values: oldValues,
            new_values: newValues,
            details: newValues.type === 'subcategory'
                ? `Subcategory "${newValues.name}" updated by ${email}`
                : `Category "${newValues.name}" updated by ${email}`,
            ...userInfo
        });
    };

    const logAdminCategoryDelete = (categoryId, categoryData, userInfo = {}) => {
        const email = userInfo.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_category_delete',
            resource_type: 'category',
            resource_id: categoryId,
            old_values: categoryData,
            details: categoryData.type === 'subcategory'
                ? `Subcategory "${categoryData.name}" deleted by ${email}`
                : `Category "${categoryData.name}" deleted by ${email}`,
            ...userInfo
        });
    };

    // Promotion Logs
    const logAdminPromotionCreate = (promotionId, promotionData, userInfo = {}) => {
        const email = userInfo.email || user?.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_promotion_create',
            resource_type: 'promotion',
            resource_id: promotionId,
            new_values: promotionData,
            details: `Promotion "${promotionData.name || promotionData.title || promotionData.code}" created by ${email}`,
            ...userInfo
        });
    };

    const logAdminPromotionUpdate = (promotionId, oldValues, newValues, userInfo = {}) => {
        const email = userInfo.email || user?.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_promotion_update',
            resource_type: 'promotion',
            resource_id: promotionId,
            old_values: oldValues,
            new_values: newValues,
            details: `Promotion "${newValues.name || newValues.title || newValues.code}" updated by ${email}`,
            ...userInfo
        });
    };

    const logAdminPromotionDelete = (promotionId, promotionData, userInfo = {}) => {
        const email = userInfo.email || user?.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_promotion_delete',
            resource_type: 'promotion',
            resource_id: promotionId,
            old_values: promotionData,
            details: `Promotion "${promotionData.name || promotionData.title || promotionData.code}" deleted by ${email}`,
            ...userInfo
        });
    };

    const logAdminPromotionToggle = (promotionId, promotionName, newState, userInfo = {}) => {
        const email = userInfo.email || user?.email || 'unknown@email.com';
        const status = newState === 1 ? 'activated' : 'deactivated';
        return logAction({
            action_type: 'admin_promotion_toggle',
            resource_type: 'promotion',
            resource_id: promotionId,
            new_values: { availability: newState, name: promotionName },
            details: `Promotion "${promotionName}" ${status} by ${email}`,
            ...userInfo
        });
    };

    // CMS Logs
    const logAdminCMSPageUpdate = (pageSlug, oldContent, newContent, pageTitle, userInfo = {}) => {
        const email = userInfo.email || user?.email || 'unknown@email.com';
        return logAction({
            action_type: 'admin_cms_page_update',
            resource_type: 'cms_page',
            resource_id: pageSlug,
            old_values: { content: oldContent, title: pageTitle },
            new_values: { content: newContent, title: pageTitle },
            details: `CMS page "${pageTitle || pageSlug}" updated by ${email}`,
            ...userInfo
        });
    };

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

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchStats();
            
            const interval = setInterval(() => {
                fetchStats();
            }, 500);

            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <AuditTrailContext.Provider value={{
            auditLogs,
            loading,
            stats,
            filters,

            fetchAuditLogs,
            fetchStats,
            updateFilters,
            clearFilters,
            addLogEntry,

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

            logAdminProductCreate,
            logAdminProductUpdate,
            logAdminProductDelete,
            logAdminAccountCreate,
            logAdminAccountUpdate,
            logAdminAccountDelete,
            logAdminStockUpdate,
            logInvoicePrint,
            logInvoiceReportPrint,
            logAdminCategoryCreate,
            logAdminCategoryUpdate,
            logAdminCategoryDelete,

            logAdminPromotionCreate,
            logAdminPromotionUpdate,
            logAdminPromotionDelete,
            logAdminPromotionToggle,
        
            logAdminCMSPageUpdate
        }}>
            { children }
        </AuditTrailContext.Provider>
    );
};

export const useAuditTrail = () => useContext(AuditTrailContext);
