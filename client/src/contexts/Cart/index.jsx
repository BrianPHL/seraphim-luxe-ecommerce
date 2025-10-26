import { useContext, useState, useEffect } from "react";
import CartContext from "./context";
import { useAuth, useToast, useNotifications } from "@contexts";

export const CartProvider = ({ children, auditLoggers = {} }) => {

    const [ cartItems, setCartItems ] = useState([]);
    const [ selectedItems, setSelectedItems ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();
    const { setNotification } = useNotifications();
    const { logCartAdd, logCartRemove, logCartUpdate } = auditLoggers;

    const fetchCartItems = async () => {
        
        if (!user) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/carts/${ user['id'] }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch cart items!');
            }

            const data = await response.json();

            setCartItems(data || []);
            return data || [];

        } catch (err) {
            console.error("Failed to fetch cart items: ", err);
            showToast(`Failed to load your cart: ${ err } `, "error");
            return [];
        } finally {
            setLoading(false);
        }

    };

    const addToCart = async (item) => {

        if (!user) return;

        try {
            setLoading(true);

            setCartItems(previous => {
                const exists = previous.find(cartItem => cartItem['product_id'] === item['product_id']);
                if (exists) {
                    return previous.map(cartItem =>
                        cartItem['product_id'] === item['product_id'] ? { ...cartItem, quantity: cartItem['quantity'] + item['quantity'] } : cartItem
                    );
                };
                return [...previous, { ...item, quantity: item['quantity'] }];
            });

            await fetch('/api/carts/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: user['id'],
                    product_id: item['product_id'],
                    quantity: item['quantity']
                })
            });

            await setNotification({
                type: 'cart',
                title: 'Item added to cart',
                message: `${ item.label } was added to your cart.`
            });

            if (logCartAdd) {
                await logCartAdd(
                item.product_id,
                item.quantity,
                item.label || item.product_name,
                {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    role: user.role
                }
                );
            }

        } catch (err) {
            console.error("Failed to add item to cart:", err);
            showToast("Failed to add item to cart", "error");
            await fetchCartItems();
        } finally {
            setLoading(false);
        }

    };

    const updateQuantity = async (product_id, newQuantity) => {
        
        if (!user) return;

        try {

            setLoading(true);
            
            if (newQuantity <= 0) {
                return removeFromCart(product_id);
            }

            const stockResponse = await fetch(`/api/stocks/${product_id}/stock`);
            if (stockResponse.ok) {
                const stockData = await stockResponse.json();
                if (stockData.stock_quantity < newQuantity) {
                    showToast(`Sorry, only ${stockData.stock_quantity} units available in stock.`, 'error');
                    return;
                }
            }
            
            setCartItems(previous => 
                previous.map(item => 
                    item['product_id'] === product_id 
                    ? { ...item, quantity: newQuantity } 
                    : item
                )
            );

            setSelectedItems(previous => 
                previous.map(item => 
                    item['product_id'] === product_id 
                    ? { ...item, quantity: newQuantity } 
                    : item
                )
            );

            await fetch(`/api/carts/${ user.id }/${ product_id }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: user['id'],
                    product_id,
                    quantity: newQuantity
                })
            });

            const product = cartItems.find(item => item.product_id === product_id);
            const oldQuantity = product?.quantity || 0;

            if (logCartUpdate && product) {
                await logCartUpdate(
                    product_id,
                    oldQuantity,
                    newQuantity,
                    product.label || product.product_name,
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
            }           

        } catch (err) {
            console.error("Failed to update quantity:", err);
            showToast("Failed to update quantity", "error");
            await fetchCartItems();
        } finally {
            setLoading(false);
        }

    };

    const removeFromCart = async (product_id) => {
        
        if (!user) return;

        try {

            const cartItem = cartItems.filter(item => item.product_id === product_id);
            
            setLoading(true);
            setCartItems(previous => previous.filter(item => item['product_id'] !== product_id));
            setSelectedItems(previous => previous.filter(item => item['product_id'] !== product_id));
            
            await fetch(`/api/carts/${ user['id'] }/${ product_id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            await setNotification({
                type: 'cart',
                title: 'Item removed from cart',
                message: `${ cartItem[0].label } was removed from your cart.`
            });

            if (logCartRemove && cartItem) {
                await logCartRemove(
                    product_id,
                    cartItem.label || cartItem.product_name,
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
            }

        } catch (err) {
            console.error("Failed to remove item:", err);
            showToast("Failed to remove item from cart", "error");
            await fetchCartItems();            
        } finally {
            setLoading(false);
        }

    };

    const clearCart = async () => {
        
        if (!user) return;

        try {

            setLoading(true);

            setCartItems([]);
            setSelectedItems([]);
            
            await fetch(`/api/carts/clear/${ user['id'] }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            showToast('Cart cleared!', 'success');
            
        } catch (err) {
            console.error("Failed to clear cart:", err);
            showToast("Failed to clear cart", "error");
            await fetchCartItems();
        } finally {
            setLoading(false);
        }

    };

    const toggleItemSelection = (product_id) => {
        const item = cartItems.find(cartItem => cartItem['product_id'] === product_id);
        if (!item) return;

        setSelectedItems(previous => {
            const isSelected = previous.some(selectedItem => selectedItem['product_id'] === product_id);
            if (isSelected) {
                return previous.filter(selectedItem => selectedItem['product_id'] !== product_id);
            } else {
                return [...previous, item];
            }
        });
    };

    const selectAllItems = () => {
        setSelectedItems([...cartItems]);
    };

    const clearSelectedItems = () => {
        setSelectedItems([]);
    };

    const clearSelectedCartItems = async () => {
        if (!user || selectedItems.length === 0) return;

        try {
            setLoading(true);

            const selectedProductIds = selectedItems.map(item => item['product_id']);
            
            setCartItems(previous => 
                previous.filter(item => !selectedProductIds.includes(item['product_id']))
            );
            
            setSelectedItems([]);

            await Promise.all(
                selectedProductIds.map(product_id =>
                    fetch(`/api/carts/${ user['id'] }/${ product_id }`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    })
                )
            );

        } catch (err) {
            console.error("Failed to clear selected items:", err);
            showToast("Failed to clear selected items", "error");
            await fetchCartItems();
        } finally {
            setLoading(false);
        }
    };

    const selectedCartItems = selectedItems;
    const isItemSelected = (product_id) => {
        return selectedItems.some(item => item['product_id'] === product_id);
    };

    useEffect(() => {
        if (user?.id) fetchCartItems();
    }, [ user ])
    
    return (
        <CartContext.Provider value={{ 
            cartItems, 
            selectedCartItems,
            addToCart, 
            updateQuantity, 
            removeFromCart, 
            clearCart, 
            toggleItemSelection,
            selectAllItems,
            clearSelectedItems,
            clearSelectedCartItems,
            isItemSelected,
            loading, 
            refreshCart: fetchCartItems 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
