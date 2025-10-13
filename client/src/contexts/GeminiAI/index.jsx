import { useContext, useState, useCallback, useEffect } from "react";
import { useAuth, useProducts, useCart, useWishlist, useOrders, usePromotions, useAuditTrail, useCategories } from '@contexts';
import GeminiAIContext from "./context";
import { fetchWithTimeout } from "@utils";

export const GeminiAIProvider = ({ children }) => {

    const { user } = useAuth();
    const { products } = useProducts();
    const { cartItems } = useCart();
    const { wishlistItems } = useWishlist();
    const { orders, orderStats } = useOrders();
    const { promotions } = usePromotions();
    const { auditLogs } = useAuditTrail();
    const { categories } = useCategories();

    const [ isLoading, setIsLoading ] = useState(false);
    const [ chatHistory, setChatHistory ] = useState([]);

    const fetchChatHistory = useCallback(async () => {

        if (!user) return;

        try {
            
            const response = await fetchWithTimeout(`/api/gemini-ai/history/${ user.id }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch chatbot chat history");

            const result = await response.json();

            setChatHistory(result.data || []);

        } catch (err) {

            console.error("Notifications context fetchNotifications function error: ", err);
            showToast('Failed to retrieve notifications!', 'error')
            
        }

    }, [ user ]);

    const aggregateCustomerContext = useCallback(() => {
        try {

            const contextBlob = [
                `USER_INFORMATION: ${user?.name || 'Guest'} (${user?.email || 'N/A'}) | Role: ${user?.role || 'customer'} | Currency: ${user?.currency || 'PHP'}`,
                `CART: ${cartItems?.length || 0} items - ${cartItems?.slice(0, 5)?.map(item => `${item.label}(qty:${item.quantity})`).join(', ') || 'Empty'}`,
                `WISHLIST: ${wishlistItems?.length || 0} items - ${wishlistItems?.slice(0, 10)?.map(item => item.label).join(', ') || 'Empty'}`,
                `RECENT_ORDERS: ${orders?.slice(0, 3)?.map(order => `Order#${order.order_number}(₱${order.total_amount},${order.status})`).join(' | ') || 'None'}`,
                `FEATURED_PRODUCTS: ${products?.filter(p => p.is_featured)?.slice(0, 8)?.map(p => `${p.label}(₱${p.price},stock:${p.stock_quantity})`).join(' | ') || 'None'}`,
                `CATEGORIES: ${categories?.filter(c => c.is_active)?.map(c => c.name).join(', ') || 'None'}`,
                `ACTIVE_PROMOTIONS: ${promotions?.filter(p => p.is_active)?.map(p => `${p.title}(${p.discount}% off)`).join(' | ') || 'None'}`,
                `RECENT_ACTIVITY: ${auditLogs?.filter(log => log.user_id === user?.id)?.slice(0, 15)?.map(log => `${log.action_type}:${log.details?.substring(0, 30) || ''}`).join(' | ') || 'No activity'}`,
                `ALL_PRODUCTS: ${products?.map(p => `${p.label}(₱${p.price},stock:${p.stock_quantity},sold:${p.orders_count || 0})`).join(' | ') || 'None'}`,
                `LOW_STOCK: ${products?.filter(p => p.stock_quantity <= p.stock_threshold)?.slice(0, 5)?.map(p => `${p.label}(${p.stock_quantity} left)`).join(' | ') || 'None'}`

            ].join(' || ');

            return {
                contextBlob,
                timestamp: new Date().toISOString(),
                userType: 'customer'
            };

        } catch (err) {
            console.error('GeminiAI context aggregateCustomerContext function error: ', err);
            return {
                contextBlob: `ERROR: Unable to aggregate context | USER: ${user?.name || 'Unknown'} | TIMESTAMP: ${new Date().toISOString()}`,
                timestamp: new Date().toISOString(),
                userType: 'customer'
            };
        }
    }, [user, cartItems, wishlistItems, orders, products, categories, promotions, auditLogs]);

    const sendGeminiAICustomerChat = async (message) => {

        try {

            const context = await aggregateCustomerContext();
            
            if (!context) {
                throw new Error('Failed to aggregate customer context');
            }

            const response = await fetch(`/api/gemini-ai/${ user.id }/customer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: context,
                    message: message,
                    session_id: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send customer chat message');
            }

            const data = await response.json();
            return data;

        } catch (err) {

            console.error('GeminiAI context sendGeminiAICustomerChat function error: ', err);

        } finally { setIsLoading(false) }

    };

    const aggregateAdminContext = useCallback(() => {
        try {
            const contextBlob = [
                
                `ORDER_STATS: Pending:${orderStats?.pending || 0} | Processing:${orderStats?.processing || 0} | Shipped:${orderStats?.shipped || 0} | Delivered:${orderStats?.delivered || 0} | Cancelled:${orderStats?.cancelled || 0}`,
                `RECENT_ORDERS: ${orders?.slice(0, 15)?.map(order => `Order#${order.order_number}(₱${order.total_amount},${order.status},${order.payment_method})`).join(' | ') || 'None'}`,
                `TOP_PRODUCTS: ${products?.sort((a, b) => b.orders_count - a.orders_count)?.slice(0, 10)?.map(p => `${p.label}(sold:${p.orders_count || 0},₱${p.total_revenue || 0})`).join(' | ') || 'None'}`,
                `LOW_STOCK_ALERTS: ${products?.filter(p => p.stock_status === 'low_stock' || p.stock_quantity <= p.stock_threshold)?.map(p => `${p.label}(${p.stock_quantity}/${p.stock_threshold})`).join(' | ') || 'None'}`,
                `ALL_PRODUCTS: ${products?.map(p => `${p.label}(₱${p.price},stock:${p.stock_quantity},sold:${p.orders_count || 0},views:${p.views_count || 0})`).join(' | ') || 'None'}`,
                `RECENT_ADMIN_ACTIVITY: ${auditLogs?.filter(log => log.action_type?.includes('admin_'))?.slice(0, 20)?.map(log => `${log.action_type}:${log.details?.substring(0, 40) || ''}`).join(' | ') || 'No admin activity'}`,
                `USER_ACTIVITY: ${auditLogs?.slice(0, 30)?.map(log => `${log.user_id || 'Guest'}:${log.action_type}:${log.resource_type || ''}`).join(' | ') || 'No activity'}`,
                `ACTIVE_PROMOTIONS: ${promotions?.filter(p => p.is_active)?.map(p => `${p.title}(${p.discount}% off,products:${p.products?.length || 0})`).join(' | ') || 'None'}`,
                `CATEGORIES: ${categories?.map(c => `${c.name}(active:${c.is_active})`).join(', ') || 'None'}`,
                `REVENUE_DATA: Total:₱${products?.reduce((sum, p) => sum + (p.total_revenue || 0), 0) || 0} | Top Revenue:${products?.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))?.slice(0, 5)?.map(p => `${p.label}:₱${p.total_revenue || 0}`).join(',') || 'None'}`

            ].join(' || ');

            return {
                contextBlob,
                timestamp: new Date().toISOString(),
                userType: 'admin'
            };

        } catch (err) {
            console.error('GeminiAI context aggregateAdminContext function error: ', err);
            return {
                contextBlob: `ERROR: Unable to aggregate admin context | TIMESTAMP: ${new Date().toISOString()}`,
                timestamp: new Date().toISOString(),
                userType: 'admin'
            };
        }
    }, [orders, orderStats, products, auditLogs, promotions, categories]);

    const sendGeminiAIAdminChat = async (message) => {

        try {

            const context = await aggregateAdminContext();
            
            if (!context) {
                throw new Error('Failed to aggregate admin context');
            }

            const response = await fetch(`/api/gemini-ai/${ user.id }/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: context,
                    message: message,
                    session_id: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send admin chat message');
            }

            const data = await response.json();
            return data;

        } catch (err) {

            console.error('GeminiAI context sendGeminiAIAdminChat function error: ', err);

        } finally { setIsLoading(false) }

    };

    useEffect(() => {
        fetchChatHistory();
    }, [ user ])

    return (
        <GeminiAIContext.Provider value={{
            isLoading,
            chatHistory,
            fetchChatHistory,
            sendGeminiAICustomerChat,
            sendGeminiAIAdminChat
        }}>
            { children }
        </GeminiAIContext.Provider>
    );

};

export const useGeminiAI = () => useContext(GeminiAIContext);
