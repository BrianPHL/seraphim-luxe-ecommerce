import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, ProductCard, TableHeader, TableFooter, ReturnButton } from '@components';
import { useProducts, useCategories } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { COLLECTIONS_FILTER_CONFIG } from '@utils';
import FilterSidebar from '@components/FilterSidebar';
import styles from './Store.module.css';

const Store = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { products, loading, error, refreshProducts } = useProducts();
    const { getActiveCategories, getActiveSubcategories, getCategoryById } = useCategories();
    
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Price (Low to High)';
    const querySearch = searchParams.get('search') || '';
    const queryCategoryId = searchParams.get('category_id') || '';
    const querySubcategoryId = searchParams.get('subcategory_id') || '';
    const queryPriceMin = searchParams.get('price_min') || '';
    const queryPriceMax = searchParams.get('price_max') || '';
    const queryColors = searchParams.get('colors')?.split(',') || [];
    const ITEMS_PER_PAGE = 10;
    
    const getJewelryCategoryIds = () => {
        const activeCategories = getActiveCategories();
        return activeCategories.map(cat => cat.id);
    };

    // Initial filtering by jewelry categories
    let filteredProducts = products.filter(product => {
        const jewelryCategoryIds = getJewelryCategoryIds();
        return jewelryCategoryIds.includes(product.category_id);
    });

    // Apply additional filters from URL parameters
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
    
    // Price range filtering
    if (queryPriceMin) {
        filteredProducts = filteredProducts.filter(product => 
            product.price >= parseFloat(queryPriceMin)
        );
    }
    
    if (queryPriceMax) {
        filteredProducts = filteredProducts.filter(product => 
            product.price <= parseFloat(queryPriceMax)
        );
    }
    
    // Color filtering
    if (queryColors.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
            queryColors.some(color => 
                product.attributes?.colors?.includes(color) || 
                product.color === color
            )
        );
    }

    const {
        data: sortedData,
        searchValue,
        sortValue,
        handleSearchChange,
        handleSortChange: onSortChange,
        sortOptions,
        totalItems,
        filteredItems
    } = useDataFilter(filteredProducts, COLLECTIONS_FILTER_CONFIG);
    
    const {
        currentPage,
        totalPages,
        currentItems: paginatedProducts,
        handlePageChange,
        resetPagination
    } = usePagination(sortedData, ITEMS_PER_PAGE, queryPage);
    
    useEffect(() => {
        if (querySearch !== searchValue) {
            handleSearchChange(querySearch);
        }
    }, [querySearch]);

    useEffect(() => {
        if (querySort !== sortValue) {
            onSortChange(querySort);
        }
    }, [querySort]);
    
    const updateSearchParams = ({ page, sort, search, category_id, subcategory_id, price_min, price_max, colors }) => {
        const params = new URLSearchParams(searchParams);

        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);
        if (category_id !== undefined) params.set('category_id', category_id);
        if (subcategory_id !== undefined) params.set('subcategory_id', subcategory_id);
        if (price_min !== undefined) params.set('price_min', price_min);
        if (price_max !== undefined) params.set('price_max', price_max);
        if (colors !== undefined) params.set('colors', colors);

        setSearchParams(params);
    };

    const handleSortChange = (sort) => {
        onSortChange(sort);
        updateSearchParams({ sort, page: 1 });
    };

    const handleSearchChangeWrapped = (value) => {
        handleSearchChange(value);
        updateSearchParams({ search: value, page: 1 });
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
    
    const handleClearFilters = () => {
        handleSearchChange('');
        resetPagination();
        // Clear all filter parameters but keep sort
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('sort', querySort);
        setSearchParams(params);
    };
    
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['banner'] }></div>
            <span className={ styles['pagewrap'] }>
                <ReturnButton />
            </span>
            
            <div className={ styles['store-layout'] }>
                <div className={ styles['sidebar'] }>
                    <FilterSidebar />
                </div>
                
                <div className={ styles['main-content'] }>
                    <TableHeader
                        icon='fa-solid fa-boxes-stacked'
                        label='Collections'
                        currentSort={ sortValue }
                        searchInput={ searchValue }
                        onSortChange={ handleSortChange }
                        onSearchChange={ handleSearchChangeWrapped }
                        onSearchSubmit={ () => {} }
                        currentPage={ currentPage }
                        totalPages={ totalPages }
                        resultsLabel={ `Showing ${ paginatedProducts.length } out of ${ sortedData.length } results` }
                        sortLabel={ sortValue }
                        onPageChange={ handlePageChangeWrapped }
                        withPagination={ true }
                    />

                    { loading && (
                        <div className={ styles['loading'] }>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <p>Loading collections, please wait...</p>
                        </div>
                    )}
                    
                    { paginatedProducts.length <= 0 && !loading ? (
                        <div className={ styles['not-found'] }>
                            <i className='fa-solid fa-magnifying-glass'></i>
                            <h3>No Collections Found</h3>
                            <p>Sorry, we couldn't find any collections matching your search or filters.</p>
                            <Button
                                type='secondary'
                                label='Clear Filters'
                                action={handleClearFilters}
                            />
                        </div>
                    ) : (
                        <div className={ styles['products-grid'] }>
                            { paginatedProducts.map(product => (
                                <ProductCard
                                    key={ product.id }
                                    id={ product.id }
                                    category={ getCategoryDisplayName(product.category_id) }
                                    subcategory={ getSubcategoryDisplayName(product.subcategory_id) }
                                    image_url={ product.image_url }
                                    label={ product.label }
                                    price={ product.price }
                                    stock_quantity={ product.stock_quantity }
                                    views_count={ product.views_count }
                                    created_at={ product.created_at }
                                    orders_count={ product.orders_count }
                                />
                            ))}
                        </div>
                    )}
                    
                    <TableFooter
                        currentPage={ currentPage }
                        totalPages={ totalPages }
                        resultsLabel={ `Showing ${ paginatedProducts.length } out of ${ sortedData.length } results` }
                        sortLabel={ sortValue }
                        onPageChange={ handlePageChangeWrapped }
                    />
                </div>
            </div>
        </div>
    );
};

export default Store;
