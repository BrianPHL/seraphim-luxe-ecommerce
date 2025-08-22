import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Button, ProductCard, TableHeader, TableFooter, ReturnButton } from '@components';
import { useProducts } from '@contexts';
import { useProductFilter, usePagination } from '@hooks';
import styles from './Store.module.css';

const Store = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { products, loading, error, refreshProducts } = useProducts();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Price (Low to High)';
    const querySearch = searchParams.get('search') || '';
    const ITEMS_PER_PAGE = 10;
    const {
        sortedProducts,
        categoryProducts,
        currentSort,
        searchQuery,
        searchInput,
        handleSortChange: onSortChange,
        handleSearchChange,
        handleSearchSubmit,
        setSearchInput,
        setSearchQuery
    } = useProductFilter(products, 'Motorcycles', querySort, querySearch);
    const {
        currentPage,
        totalPages,
        currentItems: paginatedProducts,
        handlePageChange,
        resetPagination
    } = usePagination(sortedProducts, ITEMS_PER_PAGE, queryPage);
    const updateSearchParams = ({ page, sort, search }) => {
        
        const params = new URLSearchParams(searchParams);

        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);

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

    const handlePageChangeWrapped = (page) => {
        handlePageChange(page);
        updateSearchParams({ page });
    };
    
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['banner'] }></div>
            <span className={ styles['pagewrap'] }>
                <ReturnButton />
            </span>

            <h2>Find Your Perfect Ride</h2>
            
            <TableHeader
                tableName='motorcycles'
                currentPage={ currentPage }
                totalPages={ totalPages }
                resultsLabel={ `Showing ${ paginatedProducts['length'] } out of ${ categoryProducts['length'] } results` }
                sortLabel={ currentSort }
                searchValue={ searchInput }
                onPageChange={ handlePageChangeWrapped }
                onSortChange={ handleSortChange }
                onSearchChange={ handleSearchChange }
                onSearchSubmit={ handleSearch }
            />

            <div className={ styles['container'] }>
                { paginatedProducts['length'] === 0 ? (
                    <div className={ styles['empty'] }>
                        <h3>No products found matching "{ searchQuery }"</h3>
                        <Button 
                            type="secondary" 
                            label="Clear Search" 
                            action={() => {
                                setSearchInput('');
                                setSearchQuery('');
                                resetPagination();
                                updateSearchParams({ search: '', page: 1 });
                            }}
                        />
                    </div>
                ) : (
                    <>
                        { paginatedProducts.map(product => (
                            <ProductCard
                                key={ product['product_id'] }
                                product_id={ product['product_id'] }
                                category={ product['category'] }
                                subcategory={ product['subcategory'] }
                                image_url={ product['image_url'] }
                                label={ product['label'] }
                                price={ product['price'] }
                                stock_quantity={ product['stock_quantity'] }
                            />
                        ))}
                    </>
                )}
            </div>

            <TableFooter
                currentPage={ currentPage }
                totalPages={ totalPages }
                resultsLabel={ `Showing ${ paginatedProducts['length'] } out of ${ categoryProducts['length'] } results` }
                sortLabel={ currentSort }
                onPageChange={ handlePageChangeWrapped }
            />
        </div>
    );
};

export default Store;
