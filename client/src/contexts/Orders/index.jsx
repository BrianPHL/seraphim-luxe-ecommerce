import { useContext, useState, useRef, useEffect } from "react";
import { useAuth, useToast, useProducts } from '@contexts';
import OrdersContext from "./context";

export const OrdersProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentOrders, setRecentOrders] = useState([]);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [orderStats, setOrderStats] = useState({
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
        refunded: 0
    });
    const { user } = useAuth();
    const { refreshProducts } = useProducts();
    const { showToast } = useToast();
    const orderCounter = useRef(1);

    const fetchOrders = async () => {
        if (!user) return;

        try {
            setLoading(true);
            
            const response = await fetch(`/api/orders/${user.account_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch orders!');
            }
            
            setOrders(data || []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
            showToast(`Failed to load your orders: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentOrders = async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/orders/recent', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch recent orders');
            }
            
            setRecentOrders(data);
            const pendingCount = data.filter(o => o.status === 'pending').length;
            setPendingOrdersCount(pendingCount);

            const stats = {
                pending: data.filter(o => o.status === 'pending').length,
                processing: data.filter(o => o.status === 'processing').length,
                shipped: data.filter(o => o.status === 'shipped').length,
                delivered: data.filter(o => o.status === 'delivered').length,
                cancelled: data.filter(o => o.status === 'cancelled').length,
                returned: data.filter(o => o.status === 'returned').length,
                refunded: data.filter(o => o.status === 'refunded').length
            };
            setOrderStats(stats);
            
            return data;
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            return [];
        }
    };

    const cancelOrder = async (order_id, reason = '') => {
        return await updateOrderStatus(order_id, 'cancelled', reason);
    };

    const deleteOrder = async (order_id) => {
        if (!user) return;

        try {
            setLoading(true);

            const response = await fetch(`/api/orders/${order_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete order!');
            }
            
            setOrders(prev => 
                prev.filter(order => order.order_id !== order_id)
            );

            if (recentOrders) {
                setRecentOrders(prev => 
                    prev.filter(order => order.order_id !== order_id)
                );
            }

            showToast("Order deleted successfully!", "success");

            return true;
            
        } catch (err) {
            console.error("Failed to delete order:", err);
            showToast(`Failed to delete order: ${err.message}`, "error");
            return false;
        } finally {
            await refreshProducts();
            setLoading(false);
        }
    };

    const processRefund = async (order_id, refundData) => {
        if (!user || user.role !== 'admin') return false;
        
        try {
            setLoading(true);
            
            const response = await fetch(`/api/orders/${order_id}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: refundData.amount,
                    reason: refundData.reason,
                    admin_id: user.id,
                    notes: refundData.notes
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to process refund!');
            }
            
            showToast('Refund processed successfully!', "success");
            return true;
        } catch (err) {
            console.error('Failed to process refund:', err);
            showToast(`Failed to process refund: ${err.message}`, "error");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getOrderById = async (order_id) => {
        try {
            const response = await fetch(`/api/orders/details/${order_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch order details!');
            }
            
            const orderData = await response.json();
            return orderData;
        } catch (err) {
            console.error("Failed to fetch order details:", err);
            showToast(`Failed to fetch order details: ${err.message}`, "error");
            return null;
        }
    };

    const getOrderItems = async (order_id) => {
        try {
            const response = await fetch(`/api/orders/${order_id}/items`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch order items!');
            }
            
            const itemsData = await response.json();
            return itemsData;
        } catch (err) {
            console.error("Failed to fetch order items:", err);
            showToast(`Failed to fetch order items: ${err.message}`, "error");
            return [];
        }
    };

    const trackOrder = async (order_id) => {
        try {
            const response = await fetch(`/api/orders/${order_id}/tracking`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch tracking info!');
            }
            
            const trackingData = await response.json();
            return trackingData;
        } catch (err) {
            console.error("Failed to fetch tracking info:", err);
            showToast(`Failed to fetch tracking info: ${err.message}`, "error");
            return null;
        }
    };

    useEffect(() => {
        if (user?.account_id) {
            fetchOrders();
        }
    }, [user]);

    return (
        <OrdersContext.Provider value={{ 
            orders,
            recentOrders,
            pendingOrdersCount,
            orderStats,
            loading,
            fetchRecentOrders,
            updateOrderStatus,
            cancelOrder,
            deleteOrder,
            processRefund,
            getOrderById,
            getOrderItems,
            trackOrder,
            refreshOrders: fetchOrders
        }}>
            { children }
        </OrdersContext.Provider>
    );
};

export const useOrders = () => useContext(OrdersContext);
