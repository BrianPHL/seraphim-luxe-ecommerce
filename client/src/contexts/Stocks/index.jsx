import { useContext, useState, useEffect } from "react";
import StocksContext from "./context";
import { useAuth, useToast, useProducts } from '@contexts';

export const StocksProvider = ({ children }) => {
    const [ lowStockProducts, setLowStockProducts ] = useState([]);
    const [ stockHistory, setStockHistory ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(false);
    
    const { user } = useAuth();
    const { showToast } = useToast();
    const { products, refreshProducts } = useProducts();

    useEffect(() => {
        if (products && products.length > 0) {
            const lowStock = products.filter(product => 
                product.stock_quantity <= product.stock_threshold
            );
            setLowStockProducts(lowStock);
        }
    }, [products]);

    const addStock = async (productId, quantityChange, newThreshold, notes) => {
        if (!user) {
            showToast('You must be logged in to add stock', 'error');
            return false;
        }
        
        try {
            setIsLoading(true);
            const response = await fetch('/api/stocks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    quantity_change: quantityChange,
                    new_threshold: newThreshold || undefined,
                    notes,
                    admin_id: user.account_id
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add stock');
            }

            await refreshProducts();
            await fetchStockHistory();
            showToast('Stock updated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error adding stock:', error);
            showToast(error.message || 'Failed to add stock', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStockHistory = async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            const response = await fetch('/api/stocks/history');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch stock history');
            }
            
            setStockHistory(data);
        } catch (error) {
            console.error("Error fetching stock history:", error);
            showToast("Failed to load stock history", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStockHistory();
        }
    }, [user]);
    
    return (
        <StocksContext.Provider value={{
            lowStockProducts,
            stockHistory,
            isLoading,
            addStock,
            fetchStockHistory
        }}>
            {children}
        </StocksContext.Provider>
    );
};

export const useStocks = () => useContext(StocksContext);
