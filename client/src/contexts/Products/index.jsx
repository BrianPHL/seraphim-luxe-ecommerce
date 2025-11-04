import { useContext, useState, useEffect, useCallback } from "react";
import ProductsContext from "./context";
import { useToast, useAuditTrail, useAuth } from '@contexts';
import { fetchWithTimeout } from "@utils";

export const ProductsProvider = ({ children }) => {

    const [ products, setProducts ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const [ lastFetched, setLastFetched ] = useState(null);
    const { showToast } = useToast();
    const { logAdminProductCreate, logAdminProductUpdate, logAdminProductDelete } = useAuditTrail();
    const { user } = useAuth();
    const fetchProducts = async () => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout('/api/products', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch products, something went wrong!");

            const data = await response.json();

            if (Array.isArray(data)) {
                setProducts(data);
                return data || [];
            } else {
                console.error('Products data is not an array:', data);
                setProducts([]);
                throw new Error('Invalid data format received');
            }

        } catch (err) {

            console.error("Products context fetchProducts function error:", err);
            showToast(`Failed to load products: ${err.message}`, 'error');
            setError(err.message);
            setProducts([]);
            return [];

        } finally {

            setLoading(false);

        }

    };

    const deleteProduct = async (productId) => {

        try {

            setLoading(true);

            const currentProduct = products.find(p => p.id === productId);
            
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

            if (logAdminProductDelete && currentProduct && user) {
                await logAdminProductDelete(productId, currentProduct, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
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

            const newProduct = await response.json();

            if (logAdminProductCreate && user) {
                await logAdminProductCreate(newProduct.id, productData, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
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

            const currentProduct = products.find(p => p.id === productId);
            
            const response = await fetch(`/api/products/${ productId }`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                throw new Error('Failed to update product data!');
            }
                        
            const data = await response.json();

            if (logAdminProductUpdate && currentProduct && user) {
                await logAdminProductUpdate(productId, currentProduct, productData, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
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

            const currentProduct = products.find(p => p.id === productId);
            
            const response = await fetch(`/api/products/${ productId }/feature/${ isFeatured }`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to ${ isFeatured ? 'feature' : 'un-feature' } product!`);
            }

            const data = await response.json();

            if (logAdminProductUpdate && currentProduct && user) {
                await logAdminProductUpdate(
                    productId, 
                    currentProduct, 
                    { ...currentProduct, is_featured: isFeatured },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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
