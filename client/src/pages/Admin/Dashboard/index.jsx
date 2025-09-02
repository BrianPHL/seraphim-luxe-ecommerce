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
    const { recentReservations, pendingReservationsCount } = useReservation();
    const { lowStockProducts, addStock } = useStocks();

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;
            
            setIsLoading(true);
            try {

                await Promise.all([
                    fetchUserCount(),
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
                    </div>
                    <div className={ styles['table'] }>
                        <div className={ styles['table-wrapper'] }>
                            <div className={` ${ styles['table-header'] } ${ styles['stock-alerts'] } `}>
                                <h3></h3>
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
                                            <div className={styles['table-cell']}>
                                                {product.image_url ? (
                                                    <img 
                                                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`}
                                                        alt={product.label}
                                                    />
                                                ) : '—'}
                                            </div>
                                            <div className={styles['table-cell']}>{product.id}</div>
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
        </>
    );
};

export default Dashboard;
