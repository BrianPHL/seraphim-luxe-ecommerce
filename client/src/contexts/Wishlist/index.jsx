import { createContext, useContext, useState, useEffect } from "react";
import WishlistContext from "./context";
import { useAuth, useToast, useNotifications, useProducts } from "@contexts";

export const WishlistProvider = ({ children, auditLoggers = {} }) => {

    const [ wishlistItems, setWishlistItems ] = useState([]);
    const [ selectedWishlistItems, setSelectedWishlistItems ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const { user } = useAuth();
    const { products } = useProducts();
    const { showToast } = useToast();
    const { notifyWishlistAction } = useNotifications();
    const { logWishlistAdd, logWishlistRemove } = auditLoggers;

    const fetchWishlistItems = async () => {
        if (!user?.id) {
            setWishlistItems([]);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/wishlist/${user.id}`);
            const data = await response.json();
            setWishlistItems(Array.isArray(data) ? data : []);
            return data || [];
        } catch (err) {
            console.error("Failed to fetch wishlist items: ", err);
            setWishlistItems([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (product_id) => {
        if (!user) return;

        try {
            setLoading(true);

            const exists = wishlistItems.find(item => item['product_id'] === Number(product_id));

            if (exists) {
                showToast('Item is already in wishlist!', 'warning');
                return;
            }

            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    productId: product_id
                })
            });

            if (!response.ok)
                throw new Error('Failed to add item to wishlist!');

            showToast(`${ products[product_id].label } successfully added to wishlist!`, 'success')

            await fetchWishlistItems();
            await notifyWishlistAction({
                action: "add_to_wishlist",
                productName: products[product_id].label
            });

            if (logWishlistAdd) {
                const product = products[product_id];
                await logWishlistAdd(
                    product_id,
                    product?.label || product?.name || 'Unknown Item',
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
            console.error("Wishlist context addToWishlist function error: ", err);
            showToast("Failed to add item to wishlist", "error");
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (product_id, options = {}) => {
        if (!user) return;

        try {
            const parsedProductId = parseInt(product_id);
            setLoading(true);
            
            const removedItem = wishlistItems.find(item => item['product_id'] === parsedProductId);
            const productName = removedItem?.label || 'Item';
            
            // Optimistically update UI
            setWishlistItems(previous => previous.filter(item => item['product_id'] !== parsedProductId));
            setSelectedWishlistItems(previous => previous.filter(item => item['product_id'] !== parsedProductId));

            const response = await fetch(`/api/wishlist/${user['id']}/${parsedProductId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                
                if (!options.silent) {
                    showToast('Item removed from wishlist!', 'success');
                }
                
                await fetchWishlistItems();
                await notifyWishlistAction({
                    action: "remove_from_wishlist",
                    productName: removedItem.label
                });
            } else {
                showToast("Failed to remove item from wishlist", "error");
                fetchWishlistItems();
            }

            if (logWishlistRemove && removedItem) {
                await logWishlistRemove(
                    parsedProductId,
                    removedItem?.label || removedItem?.product_name || 'Unknown Item',
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
            console.error("Error removing from wishlist:", err);
            showToast("Failed to remove item from wishlist", "error");
            fetchWishlistItems();
        } finally {
            setLoading(false);
        }
    };

    const isInWishlist = (product_id) => {
        return wishlistItems.some(item => item['product_id'] === product_id);
    };

    const clearWishlist = async () => {
        if (!user) return;

        try {
            setLoading(true);
            
            const promises = wishlistItems.map(item =>
                fetch(`/api/wishlist/${user.id}/${item.product_id}`, {
                    method: 'DELETE'
                })
            );

            const responses = await Promise.all(promises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                setWishlistItems([]);
                setSelectedWishlistItems([]);
                showToast('Wishlist cleared successfully!', 'success');
            } else {
                throw new Error('Failed to clear all items from wishlist');
            }
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            showToast('Failed to clear wishlist', 'error');
            // Refresh the wishlist to get current state
            await fetchWishlistItems();
        } finally {
            setLoading(false);
        }
    };

    const removeSelectedFromWishlist = async () => {
        if (!user || selectedWishlistItems.length === 0) return;

        try {
            setLoading(true);
            
            const promises = selectedWishlistItems.map(item =>
                fetch(`/api/wishlist/${user['id']}/${item['product_id']}`, {
                    method: 'DELETE'
                })
            );

            const responses = await Promise.all(promises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                showToast(`${selectedWishlistItems.length} items removed from wishlist!`, 'success');
                await fetchWishlistItems();
                setSelectedWishlistItems([]);
                
                // Connect to inbox notification
                if (notifyWishlistAction) {
                    await notifyWishlistAction('removed', `${selectedWishlistItems.length} items`, null, true);
                }
            } else {
                showToast("Failed to remove some items from wishlist", "error");
                await fetchWishlistItems();
            }
        } catch (err) {
            console.error("Error removing selected items:", err);
            showToast("Failed to remove items from wishlist", "error");
            await fetchWishlistItems();
        } finally {
            setLoading(false);
        }
    };

    const moveSelectedToCart = async () => {
        if (!user || selectedWishlistItems.length === 0) return;

        try {
            setLoading(true);
            
            const promises = selectedWishlistItems.map(item =>
                fetch('/api/cart/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account_id: user.id,
                        product_id: item.product_id,
                        quantity: 1
                    })
                })
            );

            const responses = await Promise.all(promises);
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                await removeSelectedFromWishlist();
                showToast(`${selectedWishlistItems.length} items moved to cart!`, 'success');
                
                // Connect to inbox notification
                if (notifyWishlistAction) {
                    await notifyWishlistAction('moved_to_cart', `${selectedWishlistItems.length} items`, null, true);
                }
            } else {
                showToast("Failed to move some items to cart", "error");
            }
        } catch (err) {
            showToast("Failed to move items to cart", "error");
        } finally {
            setLoading(false);
        }
    };

    const isItemSelected = (product_id) => {
        return selectedWishlistItems.some(item => item['product_id'] === product_id);
    };

    const toggleItemSelection = (product_id) => {
        const item = wishlistItems.find(item => item['product_id'] === product_id);
        if (item) {
            setSelectedWishlistItems(prev => 
                prev.find(selected => selected['product_id'] === product_id)
                    ? prev.filter(selected => selected['product_id'] !== product_id)
                    : [...prev, item]
            );
        }
    };

    const selectWishlistItem = (product_id) => {
        toggleItemSelection(product_id);
    };

    const selectAllItems = () => {
        setSelectedWishlistItems([...wishlistItems]);
    };

    const clearSelectedItems = () => {
        setSelectedWishlistItems([]);
    };

    const selectAllWishlistItems = () => {
        setSelectedWishlistItems(wishlistItems);
    };

    const deselectAllWishlistItems = () => {
        setSelectedWishlistItems([]);
    };

    useEffect(() => {
        fetchWishlistItems();
    }, [user]);

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            selectedWishlistItems,
            loading,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            isItemSelected,
            clearWishlist,
            removeSelectedFromWishlist,
            moveSelectedToCart,
            selectWishlistItem,
            toggleItemSelection,
            selectAllItems,
            clearSelectedItems,
            selectAllWishlistItems,
            deselectAllWishlistItems,
            fetchWishlistItems
        }}>
            { children }
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export default WishlistProvider;