import styles from './Dashboard.module.css';
import { Button, Modal, InputField } from '@components';
import { useProducts, useAuth, useToast, useInstallments, useReservation, useStocks } from '@contexts';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

const Dashboard = () => {

    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ quantityToAdd, setQuantityToAdd ] = useState(1);
    const [ newThreshold, setNewThreshold ] = useState('');
    const [ notes, setNotes ] = useState('');
    const [ isLoading, setIsLoading ] = useState(true);
    const [ selectedProduct, setSelectedProduct ] = useState(null);

    const navigate = useNavigate();
    const { products } = useProducts();
    const { user, userCount, fetchUserCount } = useAuth();
    const { showToast } = useToast();
    const { pendingCount, fetchPendingCount } = useInstallments();
    const { recentReservations, pendingReservationsCount, fetchRecentReservations } = useReservation();
    const { lowStockProducts, addStock } = useStocks();

    const handleAddStock = async () => {
        if (!selectedProduct) return;

        const success = await addStock(
            selectedProduct.product_id,
            quantityToAdd,
            newThreshold,
            notes
        );

        if (success) {
            setIsModalOpen(false);
            setSelectedProduct(null);
            setQuantityToAdd(1);
            setNewThreshold('');
            setNotes('');
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;
            
            setIsLoading(true);
            try {

                await Promise.all([
                    fetchUserCount(),
                    fetchRecentReservations(),
                    fetchPendingCount()
                ]);

            } catch (error) {
                console.error("Error loading dashboard data:", error);
                showToast("Failed to load dashboard data", "error");
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [user]);

    const handleOpenAddStockModal = (product = null) => {
        setSelectedProduct(product);
        setQuantityToAdd(1);
        setNewThreshold(product ? product.stock_threshold : '');
        setNotes('');
        setModalType('add-stock');
        setIsModalOpen(true);
    };

    return (
        <>
            <div className={ styles['wrapper'] }>

                <div className={ styles['section'] }>

                    <h2>Overview</h2>

                    <div className={ styles['overview'] }>

                        <div className={ styles['overview-item'] }>
                            <div className={ styles['overview-item-header'] }>
                                <h3>Products Total</h3>
                                <Button
                                    type='icon-outlined'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={ () => navigate('/admin/products') }
                                />
                            </div>
                            <h2>{products?.length || 0}</h2>
                        </div>
                        <div className={ styles['overview-item'] }>
                            <div className={ styles['overview-item-header'] }>
                                <h3>Users Total</h3>
                                <Button
                                    type='icon-outlined'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={ () => navigate('/admin') }
                                />
                            </div>
                            <h2>{ userCount }</h2>
                        </div>
                        <div className={ styles['overview-item'] }>
                            <div className={ styles['overview-item-header'] }>
                                <h3>Active Reservations</h3>
                                <Button
                                    type='icon-outlined'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={ () => navigate('/admin/reservations') }
                                />
                            </div>
                            <h2>{ pendingReservationsCount }</h2>
                        </div>
                        <div className={ styles['overview-item'] }>
                            <div className={ styles['overview-item-header'] }>
                                <h3>Pending Installments</h3>
                                <Button
                                    type='icon-outlined'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={ () => navigate('/admin/installments') }
                                />
                            </div>
                            <h2>{ pendingCount }</h2>
                        </div>
                        <div className={ styles['overview-item'] }>
                            <div className={ styles['overview-item-header'] }>
                                <h3>Low Stock Count</h3>
                                <Button
                                    type='icon-outlined'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={ () => navigate('/admin/stocks') }
                                />
                            </div>
                            <h2>{ lowStockProducts['length'] || 0 }</h2>
                        </div>
                    </div>
                </div>

                <div className={ styles['divider'] }></div>

                <div className={ styles['section'] }>
                    <div className={ styles['section-header'] }>
                        <h2>Stock Alerts</h2>
                        <Button
                            type='primary'
                            icon='fa-solid fa-plus'
                            iconPosition='left'
                            label='Add Stocks'
                            action={ () => {
                                setModalType('add-stock');
                                setIsModalOpen(true);
                            }}
                        />
                    </div>
                    <div className={ styles['table'] }>
                        <div className={ styles['table-wrapper'] }>
                            <div className={` ${ styles['table-header'] } ${ styles['stock-alerts'] } `}>
                                <h3>product_id</h3>
                                <h3>label</h3>
                                <h3>category</h3>
                                <h3>stock_quantity</h3>
                                <h3>stock_threshold</h3>
                                <h3>modified_at</h3>
                                <h3>actions</h3>
                            </div>
                                {lowStockProducts.length > 0 ? (
                                    lowStockProducts.map(product => (
                                        <div key={ product.product_id } className={`${ styles['table-rows'] } ${ styles['stock-alerts'] }`}>
                                            <div className={styles['table-cell']}>{product.product_id}</div>
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
                                                {product.modified_at }
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

                <div className={ styles['divider'] }></div>

                <div className={ styles['section'] }>
                    <h2>Recent Reservations</h2>
                    <div className={ styles['table'] }>
                        <div className={ styles['table-wrapper'] }>
                            <div className={` ${ styles['table-header'] } ${ styles['recent-reservations'] } `}>
                                <h3>reservation_id</h3>
                                <h3>customer_name</h3>
                                <h3>status</h3>
                                <h3>notes</h3>
                                <h3>preferred_date</h3>
                            </div>
                                {recentReservations.length > 0 ? (
                                    recentReservations.map(reservation => (
                                        <div key={reservation.reservation_id} className={`${styles['table-rows']} ${styles['recent-reservations']}`}>
                                            <div className={styles['table-cell']}>{reservation.reservation_id}</div>
                                            <div className={styles['table-cell']}>
                                                {reservation.first_name} {reservation.last_name}
                                            </div>
                                            <div className={styles['table-cell']}>
                                                <span className={styles[`status-${reservation.status}`]}>
                                                    {reservation.status}
                                                </span>
                                            </div>
                                            <div className={styles['table-cell']}>
                                                {reservation.notes || '—'}
                                            </div>
                                            <div className={styles['table-cell']}>
                                                {new Date(reservation.preferred_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles['empty-table']}>
                                        <p>No recent reservations!</p>
                                    </div>
                                )}
                        </div>

                    </div>
                </div>

            </div>
            <Modal
                isOpen={ isModalOpen && modalType === 'add-stock' }
                onClose={ () => setIsModalOpen(false) }
                label="Add Stock Prompt"
            >
                { selectedProduct && (
                    <div className={ styles['modal-infos'] }>
                        <h3>{ selectedProduct.label || 0 }</h3>
                        <span>
                            <p>Current Stock: { selectedProduct.stock_quantity || 0 }</p>
                            <p>Stock Threshold: { selectedProduct.stock_threshold || 0 }</p>
                        </span>
                    </div>
                )}
                <div className={ styles['input-wrapper'] }>
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
                <div className={ styles['input-wrapper'] }>
                    <label>Quantity to Add</label>
                    <InputField
                        type="number"
                        hint="The quantity to add..." 
                        min="1"
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)}
                        isSubmittable={ false }
                    />
                </div>
                <div className={ styles['input-wrapper'] }>
                    <label>Update Stock Threshold (Optional)</label>
                    <InputField 
                        hint="The product's stock threshold..."
                        type="number"
                        min="0"
                        placeholder="Keep current threshold"
                        value={ newThreshold }
                        onChange={(e) => setNewThreshold(e.target.value)}
                        isSubmittable={ false }
                    />
                </div>
                <div className={ styles['input-wrapper'] }>
                    <label>Notes (Optional)</label>
                    <textarea
                        placeholder="Reason for stock addition..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
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
        </>
    );
};

export default Dashboard;
