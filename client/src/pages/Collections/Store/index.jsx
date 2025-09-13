import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Button, ProductCard, TableHeader, TableFooter, ReturnButton } from '@components';
import { useProducts, useCategories } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import styles from './Store.module.css';

const Store = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { products, loading, error, refreshProducts } = useProducts();
    const { getActiveCategories, getActiveSubcategories, getCategoryById } = useCategories();
    
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Price (Low to High)';
    const querySearch = searchParams.get('search') || '';
    const queryCategoryId = searchParams.get('category_id') || '';
    const querySubcategoryId = searchParams.get('subcategory_id') || '';
    const ITEMS_PER_PAGE = 10;
    
    const getJewelryCategoryIds = () => {
        const activeCategories = getActiveCategories();
        return activeCategories.map(cat => cat.id);
    };

    // Filter products by category first
    let filteredProducts = products.filter(product => {
        const jewelryCategoryIds = getJewelryCategoryIds();
        return jewelryCategoryIds.includes(product.category_id);
    });

    // Apply category and subcategory filters
    if (queryCategoryId) {
        filteredProducts = filteredProducts.filter(product => 
            product.category_id === parseInt(queryCategoryId)
        );
    }
    
    if (querySubcategoryId) {
        filteredProducts = filteredProducts.filter(product => 
            product.subcategory_id === parseInt(querySubcategoryId)
        );
    }

    // Apply search filter here instead of in useProductFilter
    if (querySearch) {
        filteredProducts = filteredProducts.filter(product => 
            product.label.toLowerCase().includes(querySearch.toLowerCase())
        );
    }

    const {
        sortedProducts,
        currentSort,
        searchInput,
        handleSortChange: onSortChange,
        handleSearchSubmit,
        setSearchInput,
        setSearchQuery
    } = useDataFilter(filteredProducts, null, querySort, '');
    
    const {
        currentPage,
        totalPages,
        currentItems: paginatedProducts,
        handlePageChange,
        resetPagination
    } = usePagination(sortedProducts, ITEMS_PER_PAGE, queryPage);
    
    const updateSearchParams = ({ page, sort, search, category_id, subcategory_id }) => {
        const params = new URLSearchParams(searchParams);

        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);
        if (category_id !== undefined) params.set('category_id', category_id);
        if (subcategory_id !== undefined) params.set('subcategory_id', subcategory_id);

        setSearchParams(params);
    };

    const handleSortChange = (sort) => {
        onSortChange(sort);
        updateSearchParams({ sort, page: 1 });
    };

    const handleSearch = () => {
        handleSearchSubmit();
        updateSearchParams({ search: searchInput, page: 1 });
    };

    // Create wrapper function for search change that handles value directly
    const handleSearchChange = (value) => {
        setSearchInput(value);
    };

    const handlePageChangeWrapped = (page) => {
        handlePageChange(page);
        updateSearchParams({ page });
    };

    const getCategoryDisplayName = (categoryId) => {
        const category = getCategoryById(categoryId);
        return category?.name || 'Unknown';
    };

    const getSubcategoryDisplayName = (subcategoryId) => {
        const activeCategories = getActiveCategories();
        
        for (const category of activeCategories) {
            const subcategories = getActiveSubcategories(category.id);
            const subcategory = subcategories.find(sub => sub.id === subcategoryId);
            if (subcategory) {
                return subcategory.name;
            }
        }
        return 'Unknown';
    };
    
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['banner'] }></div>
            <span className={ styles['pagewrap'] }>
                <ReturnButton />
            </span>
            
            <div className={ styles['container'] }>
                <TableHeader
                    icon='fa-solid fa-boxes-stacked'
                    label='Collections'
                    currentSort={ currentSort }
                    searchInput={ searchInput }
                    onSortChange={ handleSortChange }
                    onSearchChange={ handleSearchChange }
                    onSearchSubmit={ handleSearch }
                />

                { loading && (
                    <div className={ styles['loading'] }>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading collections, please wait...</p>
                    </div>
                )}
                
                { paginatedProducts['length'] <= 0 && !loading ? (
                    <div className={ styles['not-found'] }>
                        <i className='fa-solid fa-magnifying-glass'></i>
                        <h3>No Collections Found</h3>
                        <p>Sorry, we couldn't find any collections matching your search.</p>
                        <Button
                            type='secondary'
                            label='Clear Search'
                            action={() => {
                                setSearchInput('');
                                setSearchQuery('');
                                resetPagination();
                                updateSearchParams({ search: '', page: 1 });
                            }}
                        />
                    </div>
                ) : (
                    <div className={ styles['products-grid'] }>
                        { paginatedProducts.map(product => (
                            <ProductCard
                                key={ product['id'] }
                                id={ product['id'] }
                                category={ getCategoryDisplayName(product['category_id']) }
                                subcategory={ getSubcategoryDisplayName(product['subcategory_id']) }
                                image_url={ product['image_url'] }
                                label={ product['label'] }
                                price={ product['price'] }
                                stock_quantity={ product['stock_quantity'] }
                                views_count={ product['views_count'] }
                                created_at={ product['created_at'] }
                                orders_count={ product['orders_count'] }
                            />
                        ))}
                    </div>
                )}
            </div>

            <TableFooter
                currentPage={ currentPage }
                totalPages={ totalPages }
                resultsLabel={ `Showing ${ paginatedProducts['length'] } out of ${ sortedProducts['length'] } results` }
                sortLabel={ currentSort }
                onPageChange={ handlePageChangeWrapped }
            />
        </div>
    );
};

export default Store;
