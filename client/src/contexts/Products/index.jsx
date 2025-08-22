import { useContext, useState, useEffect, useCallback } from "react";
import ProductsContext from "./context";
import { useToast } from '@contexts';

export const ProductsProvider = ({ children }) => {

    const REFRESH_INTERVAL = 10 * 60 * 1000;
    const [ products, setProducts ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const [ lastFetched, setLastFetched ] = useState(null);
    const { showToast } = useToast();

    const fetchProducts = useCallback( async (force = false) => {

        if (loading) return;

        const minTimeBetweenFetches = 10000;

        if (force || !lastFetched || (Date.now() - lastFetched > minTimeBetweenFetches)) {
            setLoading(true);
            try {

                const response = await fetch('/api/products');

                if (!response['ok']) throw new Error('Failed to fetch products');
                
                const data = await response.json();
                setProducts(data);
                setLastFetched(Date.now());
                setError(null);

            } catch (err) {
                console.error("Product fetch error:", err);
                showToast(`Failed to load products: ${ err['message'] }`, 'error');
                setError(err['message']);
            } finally {
                setLoading(false);
            }

        }
    }, [ showToast ]);

    const deleteProduct = async (productId) => {

        try {
            const response = await fetch(`/api/products/${ productId }`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete product');
            }
            
            showToast('Product successfully deleted', 'success');

            // TODO: Add a function for context changes instead of relying on fully products fetch.
            fetchProducts(true);

        } catch (error) {
            console.error('Error deleting product:', error);
            showToast(`Failed to delete product: ${error.message}`, 'error');
        }
    };

    const addProduct = async (productData) => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            // TODO: Add a function for context changes instead of relying on fully products fetch.
            fetchProducts(true);
            
            showToast('Product successfully created', 'success');
            
        } catch (err) {
            console.error('Error adding product:', err);
            showToast(`Failed to create product: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (productData) => {

        console.log('Attempt to update product data: ', productData['product_id'])
        
        try {
            setLoading(true);
            
            const response = await fetch(`/api/products/${ productData['product_id'] }`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to update product data!');
            }

            fetchProducts(true);

            showToast(`Product updated successfully! Product Id: ${ data['product_id'] }`, 'success')


        } catch (err) {
            console.error('Error updating product:', err);
            showToast(`Failed to update product: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        fetchProducts(true);
    }, [ fetchProducts ]);

    useEffect(() => {
        
        const interval = setInterval(() => { 
            fetchProducts(false)
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
  
    }, []);

    return (
        <ProductsContext.Provider 
            value={{
                products,
                loading,
                error,
                lastFetched,
                refreshProducts: () => fetchProducts(true),
                deleteProduct,
                updateProduct,
                addProduct
            }}
        >
            { children }
        </ProductsContext.Provider>
    );
};

export const useProducts = () => useContext(ProductsContext);
