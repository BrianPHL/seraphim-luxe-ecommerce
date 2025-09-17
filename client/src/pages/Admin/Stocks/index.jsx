import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Stocks.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useStocks, useProducts, useAuth, useToast } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { LOW_STOCK_FILTER_CONFIG, STOCKS_FILTER_CONFIG } from '@utils';

const ITEMS_PER_PAGE = 10;

const Stocks = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const queryLowStockPage = parseInt(searchParams.get('lowStockPage') || '1', 10);
    const queryLowStockSort = searchParams.get('lowStockSort') || 'Sort by: Most Critical First';
    const queryLowStockSearch = searchParams.get('lowStockSearch') || '';
    const queryHistoryPage = parseInt(searchParams.get('historyPage') || '1', 10);
    const queryHistorySort = searchParams.get('historySort') || 'Sort by: Latest';
    const queryHistorySearch = searchParams.get('historySearch') || '';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [newThreshold, setNewThreshold] = useState('');
    const [notes, setNotes] = useState('');
    
    const { stockHistory, lowStockProducts, addStock, fetchStockHistory, isLoading } = useStocks();
    const { products } = useProducts();
    const { user } = useAuth();
    const { showToast } = useToast();

    const {
        data: filteredLowStockProducts,
        searchValue: lowStockSearchValue,
        sortValue: lowStockSortValue,
        handleSearchChange: handleLowStockSearchChange,
        handleSortChange: handleLowStockSortChange,
        sortOptions: lowStockSortOptions,
    } = useDataFilter(lowStockProducts || [], LOW_STOCK_FILTER_CONFIG);

    const {
        currentPage: lowStockCurrentPage,
        totalPages: lowStockTotalPages,
        currentItems: paginatedLowStockProducts,
        handlePageChange: handleLowStockPageChange,
        resetPagination: resetLowStockPagination,
    } = usePagination(filteredLowStockProducts, ITEMS_PER_PAGE, queryLowStockPage);

    const {
        data: filteredStockHistory,
        searchValue: historySearchValue,
        sortValue: historySortValue,
        handleSearchChange: handleHistorySearchChange,
        handleSortChange: handleHistorySortChange,
        sortOptions: historySortOptions,
    } = useDataFilter(stockHistory || [], STOCKS_FILTER_CONFIG);

    const {
        currentPage: historyCurrentPage,
        totalPages: historyTotalPages,
        currentItems: paginatedStockHistory,
        handlePageChange: handleHistoryPageChange,
        resetPagination: resetHistoryPagination,
    } = usePagination(filteredStockHistory, ITEMS_PER_PAGE, queryHistoryPage);

    useEffect(() => {
        if (lowStockSearchValue !== queryLowStockSearch) {
            handleLowStockSearchChange(queryLowStockSearch);
        }
    }, [queryLowStockSearch]);

    useEffect(() => {
        if (lowStockSortValue !== queryLowStockSort) {
            handleLowStockSortChange(queryLowStockSort);
        }
    }, [queryLowStockSort]);

    useEffect(() => {
        if (lowStockCurrentPage !== queryLowStockPage) {
            handleLowStockPageChange(queryLowStockPage);
        }
    }, [queryLowStockPage]);

    useEffect(() => {
        if (historySearchValue !== queryHistorySearch) {
            handleHistorySearchChange(queryHistorySearch);
        }
    }, [queryHistorySearch]);

    useEffect(() => {
        if (historySortValue !== queryHistorySort) {
            handleHistorySortChange(queryHistorySort);
        }
    }, [queryHistorySort]);

    useEffect(() => {
        if (historyCurrentPage !== queryHistoryPage) {
            handleHistoryPageChange(queryHistoryPage);
        }
    }, [queryHistoryPage]);

    const updateSearchParams = ({ lowStockPage, lowStockSort, lowStockSearch, historyPage, historySort, historySearch }) => {
        const params = new URLSearchParams(searchParams);
        
        if (lowStockPage !== undefined) params.set('lowStockPage', lowStockPage);
        if (lowStockSort !== undefined) params.set('lowStockSort', lowStockSort);
        if (lowStockSearch !== undefined) params.set('lowStockSearch', lowStockSearch);
        
        if (historyPage !== undefined) params.set('historyPage', historyPage);
        if (historySort !== undefined) params.set('historySort', historySort);
        if (historySearch !== undefined) params.set('historySearch', historySearch);
        
        setSearchParams(params);
    };

    const handleLowStockSearchChangeWrapped = (value) => {
        handleLowStockSearchChange(value);
        resetLowStockPagination();
        updateSearchParams({ lowStockSearch: value, lowStockPage: 1 });
    };

    const handleLowStockSortChangeWrapped = (sort) => {
        handleLowStockSortChange(sort);
        resetLowStockPagination();
        updateSearchParams({ lowStockSort: sort, lowStockPage: 1 });
    };

    const handleLowStockPageChangeWrapped = (page) => {
        handleLowStockPageChange(page);
        updateSearchParams({ lowStockPage: page });
    };

    const handleLowStockSearch = () => {
        resetLowStockPagination();
        updateSearchParams({ lowStockSearch: lowStockSearchValue, lowStockPage: 1 });
    };

    const handleLowStockClearSearch = () => {
        handleLowStockSearchChange('');
        resetLowStockPagination();
        updateSearchParams({ lowStockSearch: '', lowStockPage: 1 });
    };

    const handleHistorySearchChangeWrapped = (value) => {
        handleHistorySearchChange(value);
        resetHistoryPagination();
        updateSearchParams({ historySearch: value, historyPage: 1 });
    };

    const handleHistorySortChangeWrapped = (sort) => {
        handleHistorySortChange(sort);
        resetHistoryPagination();
        updateSearchParams({ historySort: sort, historyPage: 1 });
    };

    const handleHistoryPageChangeWrapped = (page) => {
        handleHistoryPageChange(page);
        updateSearchParams({ historyPage: page });
    };

    const handleHistorySearch = () => {
        resetHistoryPagination();
        updateSearchParams({ historySearch: historySearchValue, historyPage: 1 });
    };

    const handleHistoryClearSearch = () => {
        handleHistorySearchChange('');
        resetHistoryPagination();
        updateSearchParams({ historySearch: '', historyPage: 1 });
    };

    const handleOpenAddStockModal = (product = null) => {
        setSelectedProduct(product);
        setQuantityToAdd(1);
        setNewThreshold(product ? product.stock_threshold : '');
        setNotes('');
        setIsModalOpen(true);
    };

    const handleAddStock = async () => {
        if (!selectedProduct) return;

        const success = await addStock(
            selectedProduct.id || selectedProduct.product_id,
            quantityToAdd,
            newThreshold,
            notes
        );

        if (success) {
            await fetchStockHistory();
            setIsModalOpen(false);
            setSelectedProduct(null);
            setQuantityToAdd(1);
            setNewThreshold('');
            setNotes('');
        }
    };

    return (
        <div className={styles['wrapper']}>
            <div className={styles['section']}>
                <h2>Overview</h2>
                <div className={styles['overview']}>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Low Stock Items</h3>
                        </div>
                        <h2>{lowStockProducts?.length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Out of Stock Items</h3>
                        </div>
                        <h2>{products?.filter(p => p.stock_quantity <= 0).length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Recent Stock Updates</h3>
                        </div>
                        <h2>{stockHistory?.filter(t => {
                            const date = new Date(t.created_at);
                            const now = new Date();
                            return (now - date) < 86400000;
                        }).length || 0}</h2>
                    </div>
                </div>
            </div>

            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Low Stock Products</h2>
                    <Button
                        type="primary"
                        icon="fa-solid fa-plus"
                        iconPosition="left"
                        label="Add Stock"
                        action={() => handleOpenAddStockModal()}
                    />
                </div>

                <TableHeader
                    currentSort={lowStockSortValue}
                    searchInput={lowStockSearchValue}
                    onSortChange={handleLowStockSortChangeWrapped}
                    onSearchChange={handleLowStockSearchChangeWrapped}
                    onSearch={handleLowStockSearch}
                    sortOptions={lowStockSortOptions}
                    withPagination={true}
                    currentPage={lowStockCurrentPage}
                    totalPages={lowStockTotalPages}
                    resultsLabel={`Showing ${paginatedLowStockProducts.length} out of ${filteredLowStockProducts.length} results`}
                    sortLabel={lowStockSortValue}
                    onPageChange={handleLowStockPageChangeWrapped}
                />

                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                            <h3></h3>
                            <h3>Product ID</h3>
                            <h3>Label</h3>
                            <h3>Category</h3>
                            <h3>Stock Quantity</h3>
                            <h3>Stock Threshold</h3>
                            <h3>Modified At</h3>
                            <h3>Actions</h3>
                        </div>
                        
                        {isLoading ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedLowStockProducts.length > 0 ? (
                            paginatedLowStockProducts.map(product => (
                                <div 
                                    key={product.id || product.product_id} 
                                    className={styles['table-rows']} 
                                    style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>
                                        {product.image_url ? (
                                            <img 
                                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`}
                                                alt={product.label}
                                            />
                                        ) : '—'}
                                    </div>
                                    <div className={styles['table-cell']}>{product.id || product.product_id}</div>
                                    <div className={styles['table-cell']}>{product.label}</div>
                                    <div className={styles['table-cell']}>{product.category}</div>
                                    <div className={styles['table-cell']}>
                                        <span className={
                                            product.stock_quantity <= 0 
                                                ? styles['stock-out'] 
                                                : product.stock_quantity <= product.stock_threshold 
                                                    ? styles['stock-low'] 
                                                    : styles['stock-ok']
                                        }>
                                            {product.stock_quantity}
                                        </span>
                                    </div>
                                    <div className={styles['table-cell']}>{product.stock_threshold}</div>
                                    <div className={styles['table-cell']}>
                                        {new Date(product.modified_at).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-square-plus"
                                            action={() => handleOpenAddStockModal(product)}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['empty-table']}>
                                {lowStockSearchValue ? (
                                    <div className={styles['empty']}>
                                        <h3>No low stock products found matching "{lowStockSearchValue}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={handleLowStockClearSearch}
                                        />
                                    </div>
                                ) : (
                                    <p>No low stock products!</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <TableFooter
                    currentPage={lowStockCurrentPage}
                    totalPages={lowStockTotalPages}
                    resultsLabel={`Showing ${paginatedLowStockProducts.length} out of ${filteredLowStockProducts.length} results`}
                    sortLabel={lowStockSortValue}
                    onPageChange={handleLowStockPageChangeWrapped}
                />
            </div>

            <div className={styles['divider']}></div>

            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Stock Transaction History</h2>
                </div>
                
                <TableHeader
                    currentSort={historySortValue}
                    searchInput={historySearchValue}
                    onSortChange={handleHistorySortChangeWrapped}
                    onSearchChange={handleHistorySearchChangeWrapped}
                    onSearch={handleHistorySearch}
                    sortOptions={historySortOptions}
                    withPagination={true}
                    currentPage={historyCurrentPage}
                    totalPages={historyTotalPages}
                    resultsLabel={`Showing ${paginatedStockHistory.length} out of ${filteredStockHistory.length} results`}
                    sortLabel={historySortValue}
                    onPageChange={handleHistoryPageChangeWrapped}
                />
                
                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                            <h3>Product</h3>
                            <h3>Type</h3>
                            <h3>Quantity Change</h3>
                            <h3>Previous / New Qty</h3>
                            <h3>Notes</h3>
                            <h3>Admin</h3>
                            <h3>Date</h3>
                        </div>
                        
                        {isLoading ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedStockHistory.length > 0 ? (
                            paginatedStockHistory.map(transaction => (
                                <div 
                                    key={transaction.stock_history_id} 
                                    className={styles['table-rows']} 
                                    style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>{transaction.product_name}</div>
                                    <div className={styles['table-cell']}>
                                        <span className={styles[`type-${transaction.stock_history_type}`]}>
                                            {transaction.stock_history_type}
                                        </span>
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {transaction.previous_quantity} → {transaction.new_quantity}
                                    </div>
                                    <div className={styles['table-cell']}>{transaction.notes || '—'}</div>
                                    <div className={styles['table-cell']}>
                                        {transaction.first_name} {transaction.last_name}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(transaction.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['empty-table']}>
                                {historySearchValue ? (
                                    <div className={styles['empty']}>
                                        <h3>No stock transactions found matching "{historySearchValue}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={handleHistoryClearSearch}
                                        />
                                    </div>
                                ) : (
                                    <p>No stock transactions found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <TableFooter
                    currentPage={historyCurrentPage}
                    totalPages={historyTotalPages}
                    resultsLabel={`Showing ${paginatedStockHistory.length} out of ${filteredStockHistory.length} results`}
                    sortLabel={historySortValue}
                    onPageChange={handleHistoryPageChangeWrapped}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                label="Add Stock"
            >
                {selectedProduct ? (
                    <div className={styles['modal-infos']}>
                        <h3>{selectedProduct.label}</h3>
                        <span>
                            <p>Current Stock: {selectedProduct.stock_quantity}</p>
                            <p>Stock Threshold: {selectedProduct.stock_threshold}</p>
                        </span>
                    </div>
                ) : (
                    <div className={styles['input-wrapper']}>
                        <label>Select Product</label>
                        <select 
                            value={selectedProduct?.id || selectedProduct?.product_id || ''} 
                            onChange={(e) => {
                                const product = products.find(p => (p.id || p.product_id).toString() === e.target.value);
                                setSelectedProduct(product);
                            }}
                        >
                            <option value="">Choose a product...</option>
                            {products?.map(product => (
                                <option key={product.id || product.product_id} value={product.id || product.product_id}>
                                    {product.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className={styles['inputs-container']}>
                    <div className={styles['input-wrapper']}>
                        <label>Quantity to Add/Remove</label>
                        <InputField
                            type="number"
                            name="quantityToAdd"
                            hint="Use negative values to remove stock"
                            value={quantityToAdd}
                            onChange={(name, value) => setQuantityToAdd(parseInt(value) || 0)}
                            isSubmittable={false}
                        />
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>New Stock Threshold (Optional)</label>
                        <InputField
                            type="number"
                            name="newThreshold"
                            hint="Leave empty to keep current threshold"
                            value={newThreshold}
                            onChange={(name, value) => setNewThreshold(value)}
                            isSubmittable={false}
                        />
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this stock change..."
                        />
                    </div>
                </div>

                <div className={styles['modal-ctas']}>
                    <Button
                        type="secondary"
                        label="Cancel"
                        action={() => setIsModalOpen(false)}
                    />
                    <Button
                        type="primary"
                        label="Update Stock"
                        action={handleAddStock}
                        disabled={!selectedProduct}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default Stocks;
