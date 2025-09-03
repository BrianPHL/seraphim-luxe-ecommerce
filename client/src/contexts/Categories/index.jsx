import { createContext, useContext, useState, useEffect } from 'react';
import CategoriesContext from './context';
import { useToast } from '../Toast';

export const CategoriesProvider = ({ children }) => {
    
    const [ categories, setCategories ] = useState([]);
    const [ subcategories, setSubcategories ] = useState({});
    const [ loading, setLoading ] = useState(false);
    const { showToast } = useToast();

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data);
            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Failed to load categories', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const fetchSubcategories = async (categoryId) => {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`);
            const data = await response.json();
            setSubcategories(prev => ({ ...prev, [categoryId]: data }));
            return data;
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            showToast('Failed to load subcategories', 'error');
            return [];
        }
    };

    const fetchHierarchy = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/categories/hierarchy');
            const data = await response.json();
            setCategories(data);

            const subcategoryLookup = {};
            data.forEach(category => {
                if (category.subcategories) {
                    subcategoryLookup[category.id] = category.subcategories;
                }
            });
            setSubcategories(subcategoryLookup);
            
            return data;
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
            showToast('Failed to load category hierarchy', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const createCategory = async (categoryData) => {
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create category');
            }

            showToast(result.message, 'success');
            await fetchCategories();
            return result;
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    };

    const createSubcategory = async (categoryId, subcategoryData) => {
        try {
            const response = await fetch(`/api/categories/${categoryId}/subcategories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subcategoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create subcategory');
            }

            showToast(result.message, 'success');
            await fetchCategories();
            await fetchSubcategories(categoryId);
            return result;
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    };

    const updateCategory = async (categoryId, categoryData) => {
        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update category');
            }

            showToast(result.message, 'success');
            await fetchCategories();
            return result;
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    };

    const updateSubcategory = async (subcategoryId, subcategoryData) => {
        try {
            const response = await fetch(`/api/categories/subcategories/${subcategoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subcategoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update subcategory');
            }

            showToast(result.message, 'success');
            await fetchCategories();
            return result;
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    };

    const deleteCategory = async (categoryId) => {
        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete category');
            }

            showToast(result.message, 'success');
            await fetchCategories();
            return result;
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    };

    const deleteSubcategory = async (subcategoryId) => {
        try {
            const response = await fetch(`/api/categories/subcategories/${subcategoryId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete subcategory');
            }

            showToast(result.message, 'success');
            await fetchCategories();
            return result;
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            throw error;
        }
    };

    const getCategoryById = (id) => categories.find(cat => cat.id === id);
    const getSubcategoriesByCategory = (categoryId) => subcategories[categoryId] || [];
    const getActiveCategories = () => categories.filter(cat => cat.is_active);
    const getActiveSubcategories = (categoryId) => {
        const subs = subcategories[categoryId] || [];
        return subs.filter(sub => sub.is_active);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <CategoriesContext.Provider value={{
            categories,
            subcategories,
            loading,
            fetchCategories,
            fetchSubcategories,
            fetchHierarchy,
            createCategory,
            createSubcategory,
            updateCategory,
            updateSubcategory,
            deleteCategory,
            deleteSubcategory,
            getCategoryById,
            getSubcategoriesByCategory,
            getActiveCategories,
            getActiveSubcategories
        }}>
            {children}
        </CategoriesContext.Provider>
    );
};

export const useCategories = () => useContext(CategoriesContext);
