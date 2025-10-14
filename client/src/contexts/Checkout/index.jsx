import { useContext, useState, useEffect } from "react";
import CheckoutContext from "./context";
import { useAuth, useToast, useCart, useSettings, useProducts, useNotifications } from "@contexts";
import { fetchWithTimeout } from "@utils";

export const CheckoutProvider = ({ children, auditLoggers = {} }) => {
    const [orders, setOrders] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [directCheckoutItem, setDirectCheckoutItem] = useState(null);
    const [checkoutData, setCheckoutData] = useState({
        shippingAddress: null,
        paymentMethod: 'cash',
        notes: ''
    });
    const [ loading, setLoading ] = useState(false);
    const [ paypalClientId, setPaypalClientId ] = useState('');
    const [ paypalCurrency, setPaypalCurrency ] = useState('');
    const [ paypalMessage, setPaypalMessage ] = useState('');
    const [ paypalLoading, setPaypalLoading ] = useState(false);
    
    const { settings } = useSettings();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { clearSelectedCartItems } = useCart();
    const { products, refreshProducts } = useProducts();
    const { setNotification } = useNotifications();
    const { logOrderCreate } = auditLoggers;

    const generateOrderNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `ORD-${timestamp}-${random}`;
    };

    const setDirectCheckout = (product) => {
        setDirectCheckoutItem(product);
    };

    const clearDirectCheckout = () => {
        setDirectCheckoutItem(null);
    };

    const fetchOrders = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/orders/${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

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
                payment_method: orderData.paymentMethod || orderData.payment_method || 'cash_on_delivery',
                subtotal: subtotal,
                shipping_fee: shippingFee,
                tax: tax,
                discount: discount,
                total_amount: totalAmount,
                notes: orderData.notes || '',
                shipping_address_id: orderData.shipping_address_id,
                billing_address_id: orderData.billing_address_id,
                items: orderData.items || [],
                paypal_transaction_id: orderData.paypal_transaction_id || null
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

            if (!directCheckoutItem) {
                await clearSelectedCartItems();
            } else {
                clearDirectCheckout();
            }

            setCurrentOrder(data);
            showToast(`Order ${data.order_number} placed successfully!`, 'success');

            await setNotification({
                type: 'orders',
                title: 'Order Successful',
                message: `Your new order is ${ data.order_number }. It is now pending.`
            });

            const productNames = orderData.items
            .map(item => products[item.product_id]?.label || products[item.product_id]?.name || `Product #${item.product_id}`)
            .join(', ');

            if (logOrderCreate && data?.order_number) {
                await logOrderCreate(
                    data.order_id, 
                    {
                        order_number: data.order_number,
                        total_amount: data.total_amount,
                        items_count: orderData.items?.length || 0,
                        product_names: productNames
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role,
                        details: `Order created for: ${productNames}`
                    }
                );
            }
            
            return { success: true, order: data };
        } catch (err) {
            console.error("Checkout context createOrder function error: ", err);
            showToast(`Failed to place order: ${err.message}`, "error");
            return { error: err.message };
        } finally {
            await refreshProducts();
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
            await refreshProducts();
            setLoading(false);
        }
    };

    const fetchPaypalClientId = async () => {
        try {
            setPaypalLoading(true);
            const userCurrency = settings?.currency || 'USD';
            const response = await fetch(`/api/paypal/get-client-id?currency=${userCurrency}`);

            if (response.ok) {
                const data = await response.json();
                setPaypalClientId(data.clientId);
            }
        } catch (error) {
            console.error('PayPal client ID fetch error:', error);
        } finally {
            setPaypalLoading(false);
        }
    };

    const createPayPalOrder = async () => {
        try {
            setPaypalLoading(true);

            const totalAmountInDisplayCurrency = convertedItems.reduce((sum, item) => {
                const priceValue = parseFloat(item.displayPrice || item.price);
                return sum + (priceValue * parseInt(item.quantity));
            }, 0);

            const userCurrency = settings?.currency || "PHP";

            const response = await fetch("/api/paypal/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currency: userCurrency,
                    displayCurrency: userCurrency,
                    amount: totalAmountInDisplayCurrency.toFixed(2)
                }),
            });
        
            const orderData = await response.json();
        
            if (orderData.id) {
                return orderData.id;
            } else {
                throw new Error("Failed to create PayPal order");
            }
        } catch (error) {
            console.error("PayPal order creation failed:", error);
            showToast('PayPal order creation failed', 'error');
            throw error;
        } finally {
            setPaypalLoading(false);
        }
    };

    const onPayPalApprove = async (data, actions) => {
        try {

            const response = await fetch(
                `/api/paypal/orders/${data.orderID}/capture`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to capture PayPal payment');
            }

            const orderData = await response.json();

            const errorDetail = orderData?.details?.[0];

            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                return actions.restart();
            } else if (errorDetail) {
                throw new Error(
                    `${errorDetail.description} (${orderData.debug_id})`
                );
            } else {
                const transaction = orderData.purchase_units[0].payments.captures[0];
                
                setPaypalMessage(`Transaction ${transaction.status}: ${transaction.id}`);
                
                
                return {
                    success: true,
                    transactionId: transaction.id,
                    status: transaction.status,
                    amount: transaction.amount.value,
                    currency: transaction.amount.currency_code
                };
            }
        } catch (error) {
            console.error("PayPal approve error:", error);
            setPaypalMessage(`Sorry, your transaction could not be processed: ${error.message}`);
            throw error;
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
            directCheckoutItem,
            checkoutData, 
            loading, 
            fetchOrders, 
            createOrder, 
            updateCheckoutData, 
            cancelOrder, 
            setCurrentOrder,
            setDirectCheckout,
            clearDirectCheckout,
            fetchPaypalClientId,
            setPaypalClientId,
            paypalClientId,
            paypalCurrency,
            createPayPalOrder,
            onPayPalApprove,
            paypalMessage,
            setPaypalMessage,
            setPaypalLoading
        }}>
            {children}
        </CheckoutContext.Provider>
    );
};

export const useCheckout = () => useContext(CheckoutContext);
