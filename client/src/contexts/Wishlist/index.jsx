import { createContext, useContext, useState, useEffect } from "react";
import WishlistContext from "./context";
import { useAuth, useToast } from "@contexts";

export const WishlistProvider = ({ children }) => {

    const [ wishlistItems, setWishlistItems ] = useState([]);
    const [ selectedWishlistItems, setSelectedWishlistItems ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchWishlistItems = async () => {
        
        if (!user) {
            setWishlistItems([]);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/wishlist/${ user['id'] }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setWishlistItems(data || []);

        } catch (err) {
            console.error("Failed to fetch wishlist items: ", err);
            setWishlistItems([]); // Set empty array on error
            showToast(`Failed to load your wishlist: ${ err.message } `, "error");
        } finally {
            setLoading(false);
        }

    };

    const addToWishlist = async (product_id) => {

        if (!user) return;

        try {
            setLoading(true);

            // Check if item already exists
            const exists = wishlistItems.find(item => item['product_id'] === product_id);
            if (exists) {
                showToast('Item already in wishlist!', 'warning');
                return;
            }

            await fetch('/api/wishlist/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user['id'],
                    productId: product_id
                })
            });

            fetchWishlistItems();
            showToast('Item added to wishlist!', 'success');

        } catch (err) {
            console.error("Failed to add item to wishlist:", err);
            showToast("Failed to add item to wishlist", "error");
        } finally {
            setLoading(false);
        }

    };

    const removeFromWishlist = async (product_id) => {
        
        if (!user) return;

        try {
            
            setLoading(true);
            setWishlistItems(previous => previous.filter(item => item['product_id'] !== product_id));
            setSelectedWishlistItems(previous => previous.filter(item => item['product_id'] !== product_id));
            
            await fetch(`/api/wishlist/${ user['id'] }/${ product_id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (err) {
            console.error("Failed to remove item:", err);
            showToast("Failed to remove item from wishlist", "error");
            fetchWishlistItems();            
        } finally {
            setLoading(false);
        }

    };

    const clearWishlist = async () => {
        
        if (!user) return;

        try {

            setLoading(true);

            setWishlistItems([]);
            setSelectedWishlistItems([]);
            
            await fetch(`/api/wishlist/${ user['id'] }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            showToast('Wishlist cleared!', 'success');
            
        } catch (err) {
            console.error("Failed to clear wishlist:", err);
            showToast("Failed to clear wishlist", "error");
            fetchWishlistItems();
        } finally {
            setLoading(false);
        }

    };

    const toggleItemSelection = (product_id) => {
        const item = wishlistItems.find(wishlistItem => wishlistItem['product_id'] === product_id);
        if (!item) return;

        setSelectedWishlistItems(previous => {
            const isSelected = previous.some(selectedItem => selectedItem['product_id'] === product_id);
            if (isSelected) {
                return previous.filter(selectedItem => selectedItem['product_id'] !== product_id);
            } else {
                return [...previous, item];
            }
        });
    };

    const selectAllItems = () => {
        setSelectedWishlistItems([...wishlistItems]);
    };

    const clearSelectedItems = () => {
        setSelectedWishlistItems([]);
    };

    const clearSelectedWishlistItems = async () => {
        if (!user || selectedWishlistItems.length === 0) return;

        try {
            setLoading(true);

            const selectedProductIds = selectedWishlistItems.map(item => item['product_id']);
            
            setWishlistItems(previous => 
                previous.filter(item => !selectedProductIds.includes(item['product_id']))
            );
            
            setSelectedWishlistItems([]);

            await fetch(`/api/wishlist/${ user['id'] }/batch-remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: selectedProductIds })
            });

        } catch (err) {
            console.error("Failed to clear selected items:", err);
            showToast("Failed to clear selected items", "error");
            fetchWishlistItems();
        } finally {
            setLoading(false);
        }
    };

    const isItemSelected = (product_id) => {
        return selectedWishlistItems.some(item => item['product_id'] === product_id);
    };

    const isInWishlist = (product_id) => {
        return wishlistItems.some(item => item['product_id'] === product_id);
    };

    useEffect(() => {
        if (user?.id) fetchWishlistItems();
    }, [ user ])
    
    return (
        <WishlistContext.Provider value={{ 
            wishlistItems, 
            selectedWishlistItems,
            addToWishlist, 
            removeFromWishlist, 
            clearWishlist, 
            toggleItemSelection,
            selectAllItems,
            clearSelectedItems,
            clearSelectedWishlistItems,
            isItemSelected,
            isInWishlist,
            loading, 
            refreshWishlist: fetchWishlistItems 
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
