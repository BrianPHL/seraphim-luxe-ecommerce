import { useContext, useState, useEffect } from "react";
import CartContext from "./context";
import { useAuth, useToast } from "@contexts";

export const CartProvider = ({ children }) => {

    const [ cartItems, setCartItems ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchCartItems = async () => {
        
        if (!user) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/carts/${ user['account_id'] }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            setCartItems(data || []);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch cart items!');
            }

        } catch (err) {
            console.error("Failed to fetch cart items: ", err);
            showToast(`Failed to load your cart: ${ err } `, "error");
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
                    account_id: user['account_id'],
                    product_id: item['product_id'],
                    quantity: item['quantity']
                })
            });

        } catch (err) {
            console.error("Failed to add item to cart:", err);
            showToast("Failed to add item to cart", "error");
            fetchCartItems();
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

            await fetch('/api/carts/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: user['account_id'],
                    product_id,
                    quantity: newQuantity
                })
            });

        } catch (err) {
            console.error("Failed to update quantity:", err);
            showToast("Failed to update quantity", "error");
            fetchCartItems();
        } finally {
            setLoading(false);
        }

    };

    const removeFromCart = async (product_id) => {
        
        if (!user) return;

        try {
            
            setLoading(true);
            setCartItems(previous => previous.filter(item => item['product_id'] !== product_id));
            await fetch(`/api/carts/${ user['account_id'] }/${ product_id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (err) {
            console.error("Failed to remove item:", err);
            showToast("Failed to remove item from cart", "error");
            fetchCartItems();            
        } finally {
            setLoading(false);
        }

    };

    const clearCart = async () => {
        
        if (!user) return;

        try {

            setLoading(true);

            setCartItems([]);
            
            await fetch(`/api/carts/clear/${ user['account_id'] }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            showToast('Cart cleared!', 'success');
            
        } catch (err) {
            console.error("Failed to clear cart:", err);
            showToast("Failed to clear cart", "error");
            fetchCartItems();
        } finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        if (user?.account_id) fetchCartItems();
    }, [ user ])
    
    return (
        <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, loading, refreshCart: fetchCartItems }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
