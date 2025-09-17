import { useContext, useState, useEffect, useCallback } from "react";
import ProductsContext from "./context";
import { useToast } from '@contexts';
import { fetchWithTimeout } from "@utils";

export const ProductsProvider = ({ children }) => {

    const [ products, setProducts ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const [ lastFetched, setLastFetched ] = useState(null);
    const { showToast } = useToast();

    const fetchProducts = async () => {

        if (loading) return;

        try {


            setLoading(true);

            const response = await fetchWithTimeout('api/products', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch products, something went wrong!");

            const data = await response.json();

            console.log("Products data in context: ", data);

            setProducts(data);

        } catch (err) {

            console.error("Products context fetchProducts function error: ", err);
            showToast(err, "error");

        } finally {

            setLoading(false);

        }

    };

    const deleteProduct = async (productId) => {

        try {

            setLoading(true);
            
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

        } catch (error) {
            console.error('Error deleting product:', error);
            showToast(`Failed to delete product: ${error.message}`, 'error');
        } finally {
            setLoading(false);
            await fetchProducts();
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

            await fetchProducts(true);
            
            showToast('Product successfully created', 'success');
            
        } catch (err) {
            console.error('Error adding product:', err);
            showToast(`Failed to create product: ${err.message}`, 'error');
        } finally {
            setLoading(false);
            await fetchProducts();
        }
    };

    const updateProduct = async (productId, productData) => {
        
        try {
            setLoading(true);
            
            const response = await fetch(`/api/products/${ productId }`, {
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

            await fetchProducts(true);

            showToast(`Product updated successfully! Product Id: ${ productId }`, 'success')


        } catch (err) {

            console.error('Error updating product:', err);
            showToast(`Failed to update product: ${err.message}`, 'error');

        } finally {
            setLoading(false);
            await fetchProducts();
        }

    };

    const featureProduct = async (productId, isFeatured) => {
        
        try {
            setLoading(true);
            
            const response = await fetch(`/api/products/${ productId }/feature/${ isFeatured }`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to ${ isFeatured ? 'feature' : 'un-feature' } product!`);
            }

            await fetchProducts(true);

            showToast(`Product ${ isFeatured ? 'featured' : 'un-featured' } successfully! Product Id: ${ productId }`, 'success')


        } catch (err) {
            console.error('Error updating product:', err);
            showToast(`Failed to update product: ${err.message}`, 'error');
        } finally {

            setLoading(false);
            await fetchProducts();

        }

    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <ProductsContext.Provider 
            value={{
                products,
                loading,
                error,
                lastFetched,
                refreshProducts: () => fetchProducts(),
                deleteProduct,
                updateProduct,
                addProduct,
                featureProduct
            }}
        >
            { children }
        </ProductsContext.Provider>
    );
};

export const useProducts = () => useContext(ProductsContext);
