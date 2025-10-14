import { createContext, useContext, useState, useEffect } from 'react';
import CategoriesContext from './context';
import { useToast } from '../Toast';
import { useAuth, useAuditTrail } from '@contexts';

export const CategoriesProvider = ({ children }) => {
    
    const [ categories, setCategories ] = useState([]);
    const [ subcategories, setSubcategories ] = useState({});
    const [ loading, setLoading ] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();
    const { logAdminCategoryCreate, logAdminCategoryUpdate, logAdminCategoryDelete } = useAuditTrail();

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

            if (logAdminCategoryCreate && user) {
                await logAdminCategoryCreate(
                    result.id,
                    {
                        name: categoryData.name,
                        description: categoryData.description,
                        sort_order: categoryData.sort_order,
                        is_active: categoryData.is_active ?? true
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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

            if (logAdminCategoryCreate && user) {
                await logAdminCategoryCreate(
                    result.id,
                    {
                        category_id: categoryId,
                        name: subcategoryData.name,
                        description: subcategoryData.description,
                        sort_order: subcategoryData.sort_order,
                        is_active: subcategoryData.is_active ?? true,
                        type: 'subcategory'
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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

            const oldCategory = categories.find(cat => cat.id === categoryId);

            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update category');
            }

            if (logAdminCategoryUpdate && user && oldCategory) {
                await logAdminCategoryUpdate(
                    categoryId,
                    {
                        name: oldCategory.name,
                        description: oldCategory.description,
                        sort_order: oldCategory.sort_order,
                        is_active: oldCategory.is_active
                    },
                    {
                        name: categoryData.name,
                        description: categoryData.description,
                        sort_order: categoryData.sort_order,
                        is_active: categoryData.is_active
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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

            const oldSubcategory = Object.values(subcategories)
                .flat()
                .find(sub => sub.id === subcategoryId);

            const response = await fetch(`/api/categories/subcategories/${subcategoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subcategoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update subcategory');
            }

            if (logAdminCategoryUpdate && user && oldSubcategory) {
                await logAdminCategoryUpdate(
                    subcategoryId,
                    {
                        category_id: oldSubcategory.category_id,
                        name: oldSubcategory.name,
                        description: oldSubcategory.description,
                        sort_order: oldSubcategory.sort_order,
                        is_active: oldSubcategory.is_active,
                        type: 'subcategory'
                    },
                    {
                        category_id: subcategoryData.category_id,
                        name: subcategoryData.name,
                        description: subcategoryData.description,
                        sort_order: subcategoryData.sort_order,
                        is_active: subcategoryData.is_active,
                        type: 'subcategory'
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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

            const categoryToDelete = categories.find(cat => cat.id === categoryId);

            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete category');
            }

            if (logAdminCategoryDelete && user && categoryToDelete) {
                await logAdminCategoryDelete(
                    categoryId,
                    {
                        name: categoryToDelete.name,
                        description: categoryToDelete.description,
                        sort_order: categoryToDelete.sort_order,
                        is_active: categoryToDelete.is_active,
                        product_count: categoryToDelete.product_count || 0
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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

            const subcategoryToDelete = Object.values(subcategories)
                .flat()
                .find(sub => sub.id === subcategoryId);

            const response = await fetch(`/api/categories/subcategories/${subcategoryId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete subcategory');
            }

            if (logAdminCategoryDelete && user && subcategoryToDelete) {
                await logAdminCategoryDelete(
                    subcategoryId,
                    {
                        category_id: subcategoryToDelete.category_id,
                        name: subcategoryToDelete.name,
                        description: subcategoryToDelete.description,
                        sort_order: subcategoryToDelete.sort_order,
                        is_active: subcategoryToDelete.is_active,
                        product_count: subcategoryToDelete.product_count || 0,
                        type: 'subcategory'
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        role: user.role
                    }
                );
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
