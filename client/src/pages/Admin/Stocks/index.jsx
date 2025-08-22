import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Stocks.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useStocks, useProducts, useAuth, useToast } from '@contexts';

const Stocks = () => {
    
    const [searchParams, setSearchParams] = useSearchParams();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Latest';
    const querySearch = searchParams.get('search') || '';
    const ITEMS_PER_PAGE = 10;

    const [currentPage, setCurrentPage] = useState(queryPage);
    const [totalPages, setTotalPages] = useState(1);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [paginatedHistory, setPaginatedHistory] = useState([]);
    const [searchInput, setSearchInput] = useState(querySearch);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [newThreshold, setNewThreshold] = useState('');
    const [notes, setNotes] = useState('');
    
    const { stockHistory, lowStockProducts, addStock, fetchStockHistory, isLoading } = useStocks();
    const { products } = useProducts();
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (!stockHistory) return;
        
        let result = [...stockHistory];

        if (querySearch) {
            const searchLower = querySearch.toLowerCase();
            result = result.filter(item => 
                item.product_name?.toLowerCase().includes(searchLower) ||
                item.category?.toLowerCase().includes(searchLower) ||
                item.first_name?.toLowerCase().includes(searchLower) ||
                item.last_name?.toLowerCase().includes(searchLower) ||
                item.notes?.toLowerCase().includes(searchLower)
            );
        }

        switch(querySort) {
            case 'Sort by: Latest':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'Sort by: Oldest':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'Sort by: Quantity (High to Low)':
                result.sort((a, b) => b.quantity_change - a.quantity_change);
                break;
            case 'Sort by: Quantity (Low to High)':
                result.sort((a, b) => a.quantity_change - b.quantity_change);
                break;
            default:
                break;
        }
        
        setFilteredHistory(result);
        setTotalPages(Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE)));
        
    }, [stockHistory, querySearch, querySort]);

    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedHistory(filteredHistory.slice(startIndex, endIndex));
    }, [filteredHistory, currentPage]);

    const updateSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);

        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);

        setSearchParams(params);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        updateSearchParams({ page });
    };

    const handleSearchChange = (e) => {
        setSearchInput(e.target.value);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        updateSearchParams({ search: searchInput, page: 1 });
    };

    const handleSortChange = (sort) => {
        setCurrentPage(1);
        updateSearchParams({ sort, page: 1 });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        updateSearchParams({ search: '', page: 1 });
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
            selectedProduct.product_id,
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

                <div className={styles['section']}>
                    
                    <div className={ styles['section-header'] }>
                        <h2>Low Stock Products</h2>
                        <Button
                            type="primary"
                            icon="fa-solid fa-plus"
                            iconPosition="left"
                            label="Add Stock"
                            action={() => setIsModalOpen(true)}
                        />
                    </div>
                    <div className={styles['table']}>
                        <div className={styles['table-wrapper']}>
                            <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                <h3>product_id</h3>
                                <h3>label</h3>
                                <h3>category</h3>
                                <h3>stock_quantity / threshold</h3>
                                <h3>actions</h3>
                            </div>
                            
                            {isLoading ? (
                                <div className={styles['empty-table']}>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                </div>
                            ) : lowStockProducts.length > 0 ? (
                                lowStockProducts.map(product => (
                                    <div 
                                        key={product.product_id} 
                                        className={styles['table-rows']} 
                                        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
                                    >
                                        <div className={styles['table-cell']}>{product.product_id}</div>
                                        <div className={styles['table-cell']}>{product.label}</div>
                                        <div className={styles['table-cell']}>
                                            {product.category} / {product.subcategory}
                                        </div>
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
                                            &nbsp;/ {product.stock_threshold}
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
                                    <p>No low stock products!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles['divider']}></div>
                
                {/* Stock History Section */}
                <div className={styles['section']}>
                    <h2>Stock Transaction History</h2>
                    
                    <TableHeader
                        tableName="reservations"
                        currentPage={currentPage}
                        totalPages={totalPages}
                        resultsLabel={`Showing ${paginatedHistory.length} out of ${filteredHistory.length} stock transactions`}
                        sortLabel={querySort}
                        searchValue={searchInput}
                        onPageChange={handlePageChange}
                        onSortChange={handleSortChange}
                        onSearchChange={handleSearchChange}
                        onSearchSubmit={handleSearch}
                    />
                    
                    <div className={styles['table']}>
                        <div className={styles['table-wrapper']}>
                            <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                <h3>product</h3>
                                <h3>type</h3>
                                <h3>quantity change</h3>
                                <h3>previous / new qty</h3>
                                <h3>notes</h3>
                                <h3>admin</h3>
                                <h3>date</h3>
                            </div>
                            
                            {isLoading ? (
                                <div className={styles['empty-table']}>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                </div>
                            ) : paginatedHistory.length > 0 ? (
                                paginatedHistory.map(transaction => (
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
                                    {querySearch ? (
                                        <div className={styles['empty']}>
                                            <h3>No stock transactions found matching "{querySearch}"</h3>
                                            <Button 
                                                type="secondary" 
                                                label="Clear Search" 
                                                action={handleClearSearch}
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
                        currentPage={currentPage}
                        totalPages={totalPages}
                        resultsLabel={`Showing ${paginatedHistory.length} out of ${filteredHistory.length} stock transactions`}
                        sortLabel={querySort}
                        onPageChange={handlePageChange}
                    />
                </div>
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
                            value={selectedProduct?.product_id || ''} 
                            onChange={(e) => {
                                const product = products.find(p => p.product_id.toString() === e.target.value);
                                setSelectedProduct(product);
                                setNewThreshold(product?.stock_threshold || '');
                            }}
                        >
                            <option value="">-- Select a Product --</option>
                            {products.map(p => (
                                <option key={p.product_id} value={p.product_id}>
                                    {p.label} ({p.category})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className={styles['inputs-container']}>
                    <div className={styles['input-wrapper']}>
                        <label>Quantity to Add</label>
                        <InputField
                            type="number"
                            hint="The quantity to add..." 
                            min="1"
                            value={quantityToAdd}
                            onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                            isSubmittable={false}
                        />
                    </div>
                    <div className={styles['input-wrapper']}>
                        <label>Update Stock Threshold (Optional)</label>
                        <InputField 
                            hint="The product's stock threshold..."
                            type="number"
                            min="0"
                            placeholder="Keep current threshold"
                            value={newThreshold}
                            onChange={(e) => setNewThreshold(e.target.value)}
                            isSubmittable={false}
                        />
                    </div>
                    <div className={styles['input-wrapper']}>
                        <label>Notes (Optional)</label>
                        <textarea
                            placeholder="Reason for stock addition..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
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
                        label="Add Stock" 
                        action={handleAddStock} 
                        disabled={!selectedProduct || quantityToAdd < 1}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default Stocks;
