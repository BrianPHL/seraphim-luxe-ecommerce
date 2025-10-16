import { useContext, useState, useRef, useEffect } from "react";
import { useAuth, useToast, useProducts, useAuditTrail } from '@contexts';
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
    const { logOrderUpdate, logInvoicePrint, logInvoiceReportPrint } = useAuditTrail();

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

    const cancelOrder = async (orderId, reason = 'Cancelled by customer') => {
        if (!user) {
            showToast('Please log in to cancel orders', 'error');
            return false;
        }

        try {
            setLoading(true);

            let currentOrder = orders.find(order => order.id === orderId || order.order_id === orderId);

            if (!currentOrder) {
                currentOrder = await getOrderById(orderId);
                if (!currentOrder) {
                    throw new Error('Order not found');
                }
            }

            // Check if order can be cancelled (only pending/processing)
            if (!['pending', 'processing'].includes(currentOrder.status.toLowerCase())) {
                throw new Error(`Cannot cancel order with status: ${currentOrder.status}`);
            }

            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'cancelled',
                    notes: reason,
                    cancelled_by: 'customer',
                    cancellation_reason: reason,
                    account_id: user.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel order');
            }

            setOrders(prev => 
                prev.map(order => 
                    (order.id === orderId || order.order_id === orderId)
                        ? { ...order, status: 'cancelled' } 
                        : order
                )
            );

            if (logOrderUpdate) {
                await logOrderUpdate(
                    orderId,
                    {
                        status: currentOrder.status,
                        order_number: currentOrder.order_number,
                        customer_name: `${currentOrder.first_name || user.first_name} ${currentOrder.last_name || user.last_name}`,
                        customer_email: currentOrder.email || user.email
                    },
                    {
                        status: 'cancelled',
                        order_number: currentOrder.order_number,
                        customer_name: `${currentOrder.first_name || user.first_name} ${currentOrder.last_name || user.last_name}`,
                        customer_email: currentOrder.email || user.email,
                        cancellation_reason: reason,
                        cancelled_by: 'customer'
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
            }

            showToast('Order cancelled successfully', 'success');
            return true;

        } catch (error) {
            console.error('Error cancelling order:', error);
            showToast(error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus, notes = '') => {
        if (!user || user.role !== 'admin') {
            showToast('Unauthorized to update order status', 'error');
            return false;
        }

        try {
            setLoading(true);

            const currentOrder = recentOrders.find(order => order.id === orderId);
            if (!currentOrder) {
                throw new Error('Order not found');
            }

            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    notes,
                    admin_id: user.account_id || user.id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update order status');
            }

            if (logOrderUpdate) {
                await logOrderUpdate(
                    orderId,
                    {
                        status: currentOrder.status,
                        order_number: currentOrder.order_number,
                        customer_name: `${currentOrder.first_name} ${currentOrder.last_name}`,
                        customer_email: currentOrder.email
                    },
                    {
                        status: newStatus,
                        order_number: currentOrder.order_number,
                        customer_name: `${currentOrder.first_name} ${currentOrder.last_name}`,
                        customer_email: currentOrder.email,
                        admin_notes: notes
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
            }

            await fetchRecentOrders();
            showToast(`Order status updated to ${newStatus} successfully!`, 'success');
            return true;

        } catch (error) {
            console.error('Error updating order status:', error);
            showToast(error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const printInvoice = async (order) => {
        if (!user || user.role !== 'admin') {
            showToast('Unauthorized to print invoices', 'error');
            return false;
        }

        try {

            let orderWithItems = order;
            if (!order.items || order.items.length === 0) {
                const items = await getOrderItems(order.id);
                orderWithItems = { ...order, items: items || [] };
            }

            if (logInvoicePrint) {
                await logInvoicePrint(
                    order.id,
                    {
                        order_number: order.order_number || `ORD-${order.id}`,
                        customer_name: `${order.first_name} ${order.last_name}`,
                        customer_email: order.email,
                        total_amount: order.total_amount,
                        items_count: orderWithItems.items?.length || 0
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
            }

            return orderWithItems;

        } catch (error) {
            console.error('Error printing invoice:', error);
            showToast('Failed to print invoice', 'error');
            return false;
        }
    };

    const printInvoiceReport = async (startDate, endDate, ordersInRange) => {
        if (!user || user.role !== 'admin') {
            showToast('Unauthorized to print invoice reports', 'error');
            return false;
        }

        try {
            const dateRangeText = startDate && endDate 
                ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                : startDate 
                ? `From ${formatDate(startDate)}`
                : endDate 
                ? `Until ${formatDate(endDate)}`
                : 'All Orders';

            const totalRevenue = ordersInRange.reduce((sum, order) => 
                sum + parseFloat(order.total_amount || 0), 0
            );

            if (logInvoiceReportPrint) {
                await logInvoiceReportPrint(
                    {
                        order_count: ordersInRange.length,
                        date_range: dateRangeText,
                        total_revenue: totalRevenue.toFixed(2),
                        start_date: startDate,
                        end_date: endDate
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
            }

            return {
                ordersWithItems: ordersInRange,
                dateRangeText,
                totalRevenue
            };

        } catch (error) {
            console.error('Error printing invoice report:', error);
            showToast('Failed to print invoice report', 'error');
            return false;
        }
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-PH', options);
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'N/A';
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
            cancelOrder,
            pendingOrdersCount,
            orderStats,
            loading,
            fetchRecentOrders,
            deleteOrder,
            processRefund,
            getOrderById,
            getOrderItems,
            trackOrder,
            refreshOrders: fetchOrders,
            updateOrderStatus,
            printInvoice,
            printInvoiceReport,
            formatDate
        }}>
            { children }
        </OrdersContext.Provider>
    );
};

export const useOrders = () => useContext(OrdersContext);
