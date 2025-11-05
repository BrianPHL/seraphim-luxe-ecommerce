import { useContext, useState, useCallback, useEffect } from "react";
import { useAuth, useProducts, useCart, useWishlist, useOrders, usePromotions, useAuditTrail, useCategories, useCheckout, useToast } from '@contexts';
import GeminiAIContext from "./context";
import { fetchWithTimeout } from "@utils";

export const GeminiAIProvider = ({ children }) => {

    const { showToast } = useToast();
    const { user, fetchUsers } = useAuth();
    const { products, refreshProducts } = useProducts();
    const { cartItems, refreshCart } = useCart();
    const { wishlistItems, fetchWishlistItems } = useWishlist();
    const { orders, fetchOrders } = useCheckout();
    const { allOrders, fetchAllOrders } = useOrders();
    const { promotions, fetchPromotions } = usePromotions();
    const { auditLogs, fetchAuditLogs } = useAuditTrail();
    const { categories, fetchCategories, fetchHierarchy } = useCategories();

    const [ isLoading, setIsLoading ] = useState(false);
    const [ chatHistory, setChatHistory ] = useState([]);
    const [ predefinedQuestions, setPredefinedQuestions ] = useState([]);

    const WEBSITE_KNOWLEDGE = {
        navigation: {
            'check order status': '/orders - You can check your order status by going to the Orders page in your profile menu',
            'view cart': '/cart - Your shopping cart is accessible from the cart icon in the header or by visiting /cart',
            'wishlist': '/wishlist - Access your saved items at /wishlist or click the heart icon in the header',
            'profile settings': '/profile - Manage your account settings, addresses, and preferences at /profile',
            'collections': '/collections - Browse all products at /collections',
            'contact us': '/contact-us - Reach out to our support team at /contact-us',
            'about us': '/about-us - Learn more about Seraphim Luxe at /about-us',
            'faqs': '/faqs - Find answers to common questions at /faqs',
            'privacy policy': '/privacy-policy - Read our privacy policy at /privacy-policy'
        },
        orderTracking: {
            steps: [
                '1. Go to your Profile by clicking your avatar in the header',
                '2. Navigate to the Orders section',
                '3. View all your orders with their current status',
                '4. Click on an order to see detailed tracking information',
                '5. Order statuses include: Pending, Processing, Shipped, Delivered, Cancelled'
            ],
            statusMeanings: {
                'pending': 'Your order has been received and is awaiting processing',
                'processing': 'Your order is being prepared for shipment',
                'shipped': 'Your order has been shipped and is on its way',
                'delivered': 'Your order has been successfully delivered',
                'cancelled': 'Your order has been cancelled',
                'returned': 'Your order has been returned',
                'refunded': 'Your order has been refunded'
            }
        },
        paymentMethods: ['Cash on Delivery', 'PayPal', 'Bank Transfer', 'Credit Card'],
        shippingInfo: 'We ship within the Philippines. Shipping costs and delivery times vary by location.',
        returnPolicy: 'Items can be returned within 30 days of delivery in original condition.',
        supportContact: 'For urgent matters, contact us at support@seraphimluxe.com or visit /contact-us'
    };

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
            showToast('Failed to fetch chatbot chat history!', 'error')
            
        }

    }, [ user ]);

    const selectWeightedRandomQuestions = (questions, count = 3) => {

        if (!questions || questions.length === 0) return [];
        if (questions.length <= count) return questions;

        const weightMap = {
            1: 5,
            2: 3,
            3: 1
        };

        const weightedPool = [];
        questions.forEach(question => {
            const weight = weightMap[question.priority_level] || 1;
            for (let i = 0; i < weight; i++) {
                weightedPool.push(question);
            }
        });

        const selected = [];
        const selectedIds = new Set();

        while (selected.length < count && selected.length < questions.length) {
            const randomIndex = Math.floor(Math.random() * weightedPool.length);
            const candidate = weightedPool[randomIndex];

            if (!selectedIds.has(candidate.id)) {
                selected.push(candidate);
                selectedIds.add(candidate.id);
            }
        }

        return selected.sort((a, b) => a.priority_level - b.priority_level);
    };

    const fetchPredefinedQuestions = useCallback(async () => {

        if (!user) return;

        try {

            const scope = user.role === 'admin' ? 'admin' : 'customer';

            const response = await fetchWithTimeout(`/api/gemini-ai/predefined-questions?scope=${scope}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch predefined questions");

            const result = await response.json();
            const selectedQuestions = selectWeightedRandomQuestions(result.data || [], 3);

            setPredefinedQuestions(selectedQuestions);

        } catch (err) {

            console.error("GeminiAI context fetchPredefinedQuestions function error: ", err);
            setPredefinedQuestions([]);

        }

    }, [ user ]);

    const aggregateCustomerContext = useCallback(async () => {
        try {
            setIsLoading(true);
        
            const [productsResult, cartResult, wishlistResult, ordersResult, promotionsResult, categoriesResult] = await Promise.all([
                refreshProducts(),
                refreshCart(),
                fetchWishlistItems(),
                fetchOrders(),
                fetchPromotions(),
                fetchCategories()
            ]);
        
            const freshProducts = productsResult || products;
            const freshCart = cartResult || cartItems;
            const freshWishlist = wishlistResult || wishlistItems;
            const freshOrders = ordersResult || orders;
            const freshPromotions = promotionsResult || promotions;
            const freshCategories = categoriesResult || categories;
        
            const inStockProducts = freshProducts?.filter(p => p.stock_quantity > 0) || [];
            const featuredProducts = inStockProducts.filter(p => p.is_featured);
            const lowStockProducts = freshProducts?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.stock_threshold) || [];
        
            const compactProductList = inStockProducts.map(p => 
                `${p.label}|₱${p.price}|stock:${p.stock_quantity}|cat:${p.category_name || 'N/A'}`
            ).join(';;');
        
            const detailedFeatured = featuredProducts.slice(0, 8).map(p => 
                `${p.label}(₱${p.price}, stock:${p.stock_quantity}, ${p.description?.substring(0, 50) || ''})`
            ).join(' | ');
        
            const orderSummary = freshOrders?.map(o => 
                `#${o.order_number}|₱${o.total_amount}|${o.status}|${new Date(o.created_at).toLocaleDateString()}`
            ).join(';;') || 'None';
        
            const contextBlob = [
                `USER: ${user?.name || 'Guest'}(${user?.email || 'N/A'}) | ${user?.role || 'customer'}`,
                `CART: ${freshCart?.length || 0} items - ${freshCart?.map(i => `${i.label}(x${i.quantity})`).join(', ') || 'Empty'}`,
                `WISHLIST: ${freshWishlist?.length || 0} items - ${freshWishlist?.map(i => i.label).join(', ') || 'Empty'}`,
                `ORDERS: ${orderSummary}`,
                `FEATURED: ${detailedFeatured}`,
                `ALL_IN_STOCK_PRODUCTS: ${compactProductList}`, // ALL products but compact
                `LOW_STOCK: ${lowStockProducts.slice(0, 10).map(p => `${p.label}(${p.stock_quantity} left)`).join(' | ')}`,
                `CATEGORIES: ${freshCategories?.filter(c => c.is_active)?.map(c => c.name).join(', ')}`,
                `PROMOTIONS: ${freshPromotions?.filter(p => p.is_active)?.map(p => `${p.title}(${p.discount}% off)`).join(' | ')}`,
                `NAVIGATION: ${Object.entries(WEBSITE_KNOWLEDGE.navigation).map(([k, v]) => `${k}: ${v.split(' - ')[1]}`).join(' | ')}`,
                `ORDER_TRACKING: ${WEBSITE_KNOWLEDGE.orderTracking.steps.join(' → ')}`,
                `STATUS_INFO: ${Object.entries(WEBSITE_KNOWLEDGE.orderTracking.statusMeanings).map(([k, v]) => `${k}: ${v}`).join(' | ')}`,
                `PAYMENT: ${WEBSITE_KNOWLEDGE.paymentMethods.join(', ')}`,
                `SHIPPING: ${WEBSITE_KNOWLEDGE.shippingInfo}`,
                `RETURNS: ${WEBSITE_KNOWLEDGE.returnPolicy}`,
                `SUPPORT: ${WEBSITE_KNOWLEDGE.supportContact}`
            ].join(' || ');
        
            return {
                contextBlob,
                timestamp: new Date().toISOString(),
                userType: 'customer'
            };
        
        } catch (err) {
            console.error('Aggregate customer context error:', err);
            return {
                contextBlob: `ERROR: Context load failed | USER: ${user?.name}`,
                timestamp: new Date().toISOString(),
                userType: 'customer'
            };
        } finally {
            setIsLoading(false);
        }
    }, [user, products, cartItems, wishlistItems, orders, categories, promotions, WEBSITE_KNOWLEDGE]);

    const sendGeminiAICustomerChat = async (message) => {
        try {
            const context = await aggregateCustomerContext();
            if (!context) {
                throw new Error('Failed to load context');
            }

            const response = await fetchWithTimeout(`/api/gemini-ai/${user.id}/customer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: context,
                    message: message,
                    session_id: Date.now()
                }),
                timeout: 35000
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || errorData.message || 'Failed to send message');
            }

            const data = await response.json();
            return data;

        } catch (err) {
            console.error('Send customer chat error:', err);

            if (err.message.includes('high demand') || err.message.includes('quota')) {
                showToast('AI assistant is busy. Please wait a moment and try again.', 'warning');
            } else if (err.message.includes('timeout')) {
                showToast('Request timed out. Please try a shorter question.', 'error');
            } else {
                showToast('Unable to reach AI assistant. Please try again.', 'error');
            }

            throw err;

        } finally {
            setIsLoading(false);
        }
    };

    const aggregateAdminContext = useCallback(async () => {
        try {
            setIsLoading(true);

            const [productsResult, ordersResult, promotionsResult, categoriesResult, hierarchyResult, auditLogsResult] = await Promise.all([
                refreshProducts(),
                fetchAllOrders(),
                fetchPromotions(),
                fetchCategories(),
                fetchHierarchy(),
                fetchAuditLogs({ limit: 100 })
            ]);

            const freshProducts = productsResult || products;
            const freshOrders = ordersResult || allOrders;
            const freshPromotions = promotionsResult || promotions;
            const freshCategories = categoriesResult || categories;
            const freshAuditLogs = auditLogsResult?.logs || [];

            const pendingOrders = freshOrders?.filter(o => o.status === 'pending') || [];
            const processingOrders = freshOrders?.filter(o => o.status === 'processing') || [];
            const shippedOrders = freshOrders?.filter(o => o.status === 'shipped') || [];
            const deliveredOrders = freshOrders?.filter(o => o.status === 'delivered') || [];
            const cancelledOrders = freshOrders?.filter(o => o.status === 'cancelled') || [];

            const compactAllOrders = freshOrders?.map(o => 
                `#${o.order_number}|₱${o.total_amount}|${o.status}|${o.payment_method}|${new Date(o.created_at).toLocaleDateString()}`
            ).join(';;') || 'None';

            const recentOrdersDetailed = freshOrders?.slice(0, 20).map(o => 
                `Order#${o.order_number}(₱${o.total_amount}, ${o.status}, ${o.payment_method}, ${new Date(o.created_at).toLocaleDateString()})`
            ).join(' | ') || 'None';

            const compactProductList = freshProducts?.map(p => 
                `${p.label}|₱${p.price}|stock:${p.stock_quantity}|sold:${p.orders_count || 0}|rev:₱${parseFloat(p.total_revenue || 0).toFixed(2)}`
            ).join(';;') || 'None';

            const topProducts = freshProducts?.sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0))?.slice(0, 15) || [];
            const topProductsDetailed = topProducts.map(p => 
                `${p.label}(sold:${p.orders_count || 0}, revenue:₱${parseFloat(p.total_revenue || 0).toFixed(2)}, stock:${p.stock_quantity})`
            ).join(' | ');

            const lowStockItems = freshProducts?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.stock_threshold) || [];
            const outOfStock = freshProducts?.filter(p => p.stock_quantity === 0) || [];
            const needsRestocking = freshProducts?.filter(p => p.stock_quantity <= (p.stock_threshold * 0.5)) || [];

            const totalRevenue = freshProducts?.reduce((sum, p) => sum + (parseFloat(p.total_revenue) || 0), 0) || 0;
            const todaysOrders = freshOrders?.filter(o => 
                new Date(o.created_at).toDateString() === new Date().toDateString()
            ) || [];
            const todaysRevenue = todaysOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
            const topRevenueProducts = freshProducts?.sort((a, b) => 
                (parseFloat(b.total_revenue) || 0) - (parseFloat(a.total_revenue) || 0)
            ).slice(0, 10);

            const categoryPerformance = freshCategories?.map(cat => {
                const catProducts = freshProducts?.filter(p => p.category_id === cat.id) || [];
                const revenue = catProducts.reduce((sum, p) => sum + parseFloat(p.total_revenue || 0), 0);
                const totalSold = catProducts.reduce((sum, p) => sum + (p.orders_count || 0), 0);
                return `${cat.name}|products:${catProducts.length}|sold:${totalSold}|rev:₱${revenue.toFixed(2)}|${cat.is_active ? 'active' : 'inactive'}`;
            }).join(';;') || 'None';

            const compactAuditLogs = freshAuditLogs?.slice(0, 50).map(log => 
                `${log.user_id || 'System'}|${log.action_type}|${log.resource_type || 'N/A'}|${new Date(log.created_at).toLocaleDateString()}`
            ).join(';;') || 'None';

            const adminActivity = freshAuditLogs?.filter(log => 
                log.action_type?.includes('admin_') || log.action_type?.includes('update_') || log.action_type?.includes('create_')
            ).slice(0, 30).map(log => 
                `${log.action_type}: ${log.details?.substring(0, 40) || 'N/A'}`
            ).join(' | ') || 'No admin activity';

            const contextBlob = [
                `ALL_ORDERS_COMPACT: ${compactAllOrders}`,
                `RECENT_ORDERS_DETAILED: ${recentOrdersDetailed}`,
                `PENDING_ORDERS: ${pendingOrders.slice(0, 15).map(o => `#${o.order_number}(₱${o.total_amount}, ${o.payment_method})`).join(' | ') || 'None'}`,
                `PROCESSING_ORDERS: ${processingOrders.slice(0, 15).map(o => `#${o.order_number}(₱${o.total_amount})`).join(' | ') || 'None'}`,
                `ORDER_STATUS_COUNT: Pending:${pendingOrders.length} | Processing:${processingOrders.length} | Shipped:${shippedOrders.length} | Delivered:${deliveredOrders.length} | Cancelled:${cancelledOrders.length}`,
                `ALL_PRODUCTS_COMPACT: ${compactProductList}`,
                `TOP_PRODUCTS_DETAILED: ${topProductsDetailed}`,
                `LOW_STOCK_ALERTS: ${lowStockItems.map(p => `${p.label}(${p.stock_quantity}/${p.stock_threshold})`).join(' | ') || 'None'}`,
                `OUT_OF_STOCK: ${outOfStock.map(p => p.label).join(', ') || 'None'}`,
                `NEEDS_RESTOCKING: ${needsRestocking.map(p => `${p.label}(${p.stock_quantity} left, threshold:${p.stock_threshold})`).join(' | ') || 'None'}`,
                `CATEGORY_PERFORMANCE: ${categoryPerformance}`,
                `CATEGORIES: ${freshCategories?.map(c => `${c.name}(${c.is_active ? 'active' : 'inactive'})`).join(', ') || 'None'}`,
                `ACTIVE_PROMOTIONS: ${freshPromotions?.filter(p => p.is_active)?.map(p => `${p.title}(${p.discount}% off, products:${p.products?.length || 0})`).join(' | ') || 'None'}`,
                `REVENUE_TOTAL: ₱${totalRevenue.toFixed(2)}`,
                `TOP_REVENUE_PRODUCTS: ${topRevenueProducts.map(p => `${p.label}:₱${parseFloat(p.total_revenue || 0).toFixed(2)}`).join(', ')}`,
                `TODAYS_METRICS: Orders:${todaysOrders.length} | Revenue:₱${todaysRevenue.toFixed(2)}`,
                `ADMIN_ACTIVITY: ${adminActivity}`,
                `USER_ACTIVITY_COMPACT: ${compactAuditLogs}`
            ].join(' || ');

            return {
                contextBlob,
                timestamp: new Date().toISOString(),
                userType: 'admin'
            };

        } catch (err) {
            console.error('Aggregate admin context error:', err);
            return {
                contextBlob: `ERROR: Unable to aggregate admin context | TIMESTAMP: ${new Date().toISOString()}`,
                timestamp: new Date().toISOString(),
                userType: 'admin'
            };
        } finally {
            setIsLoading(false);
        }
    }, [products, allOrders, auditLogs, promotions, categories]);

    const sendGeminiAIAdminChat = async (message) => {
        try {
            const context = await aggregateAdminContext();
            if (!context) {
                throw new Error('Failed to load context');
            }

            const response = await fetchWithTimeout(`/api/gemini-ai/${user.id}/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: context,
                    message: message,
                    session_id: Date.now()
                }),
                timeout: 35000
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || errorData.message || 'Failed to send message');
            }

            const data = await response.json();
            return data;

        } catch (err) {
            console.error('Send admin chat error:', err);

            if (err.message.includes('high demand') || err.message.includes('quota')) {
                showToast('AI assistant is busy. Please wait a moment and try again.', 'warning');
            } else if (err.message.includes('timeout')) {
                showToast('Request timed out. Please try a shorter question.', 'error');
            } else {
                showToast('Unable to reach AI assistant. Please try again.', 'error');
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChatHistory();
        fetchPredefinedQuestions();
    }, [ user ]);

    return (
        <GeminiAIContext.Provider value={{
            isLoading,
            chatHistory,
            predefinedQuestions,
            fetchPredefinedQuestions,
            fetchChatHistory,
            sendGeminiAICustomerChat,
            sendGeminiAIAdminChat
        }}>
            { children }
        </GeminiAIContext.Provider>
    );

};

export const useGeminiAI = () => useContext(GeminiAIContext);
