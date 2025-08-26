import { useContext, useState, useEffect } from "react";
import CheckoutContext from "./context";
import { useAuth, useToast, useCart } from "@contexts";

export const CheckoutProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [checkoutData, setCheckoutData] = useState({
        shippingAddress: null,
        paymentMethod: 'cash',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    
    const { user } = useAuth();
    const { showToast } = useToast();
    const { clearSelectedCartItems } = useCart();

    const generateOrderNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `ORD-${timestamp}-${random}`;
    };

    const fetchOrders = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/orders/${user.id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
            showToast("Failed to load orders", "error");
        } finally {
            setLoading(false);
        }
    };

    const createOrder = async (orderData) => {
        if (!user) {
            showToast("You must be logged in to place an order", "error");
            return { error: "Not authenticated" };
        }

        try {
            setLoading(true);

            const orderNumber = generateOrderNumber();
            const subtotal = parseFloat(orderData.subtotal) || 0;
            const shippingFee = parseFloat(orderData.shippingFee) || 0;
            const tax = parseFloat(orderData.tax) || 0;
            const discount = parseFloat(orderData.discount) || 0;
            const totalAmount = parseFloat(orderData.totalAmount) || subtotal + shippingFee + tax - discount;

            const orderPayload = {
                account_id: parseInt(user.id),
                order_number: orderNumber,
                status: 'pending',
                payment_method: orderData.paymentMethod || 'cash',
                subtotal: subtotal,
                shipping_fee: shippingFee,
                tax: tax,
                discount: discount,
                total_amount: totalAmount,
                notes: orderData.notes || '',
                shipping_address: orderData.shippingAddress || '',
                billing_address: null,
                items: orderData.items || []
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            await clearSelectedCartItems();
            
            setCurrentOrder(data);
            showToast(`Order ${orderNumber} placed successfully!`, 'success');
            
            return { success: true, order: data };
        } catch (err) {
            console.error("Checkout context createOrder function error: ", err);
            showToast(`Failed to place order: ${err.message}`, "error");
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateCheckoutData = (updates) => {
        setCheckoutData(prev => ({ ...prev, ...updates }));
    };

    const cancelOrder = async (orderId) => {
        if (!user) return;

        try {
            setLoading(true);
            
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_id: user.id })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to cancel order');
            }

            setOrders(prev => 
                prev.map(order => 
                    order.order_id === orderId 
                    ? { ...order, status: 'cancelled' } 
                    : order
                )
            );

            showToast('Order cancelled successfully', 'success');
            return true;
        } catch (err) {
            console.error("Failed to cancel order:", err);
            showToast(`Failed to cancel order: ${err.message}`, "error");
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchOrders();
        }
    }, [user]);

    return (
        <CheckoutContext.Provider value={{ 
            orders, 
            currentOrder, 
            checkoutData, 
            loading, 
            fetchOrders, 
            createOrder, 
            updateCheckoutData, 
            cancelOrder, 
            setCurrentOrder 
        }}>
            {children}
        </CheckoutContext.Provider>
    );
};

export const useCheckout = () => useContext(CheckoutContext);
