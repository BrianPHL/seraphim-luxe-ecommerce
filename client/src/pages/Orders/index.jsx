import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, Anchor, ReturnButton, Modal } from '@components';
import styles from './Orders.module.css';
import { useToast, useAuth } from '@contexts';
import { username } from 'better-auth/plugins';

const Orders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Calculate estimated arrival time for reserved products
    const calculateReservedArrivalTime = (orderDate, productType) => {
        const orderDateTime = new Date(orderDate);
        const now = new Date();
        
        // Different processing times based on product type
        let processingDays;
        switch (productType.toLowerCase()) {
            case 'custom jewelry':
            case 'bespoke':
                processingDays = 14; // Custom items take longer
                break;
            case 'premium':
            case 'luxury':
                processingDays = 7; // Premium items take moderate time
                break;
            default:
                processingDays = 5; // Standard items
        }
        
        const estimatedArrival = new Date(orderDateTime);
        estimatedArrival.setDate(estimatedArrival.getDate() + processingDays);
        
        const daysRemaining = Math.ceil((estimatedArrival - now) / (1000 * 60 * 60 * 24));
        
        return {
            estimatedArrival,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
            status: 'Reserved'
        };
    };

    // Check if order contains reserved products
    const hasReservedProducts = (order) => {
        return order.items.some(item => 
            item.status?.toLowerCase() === 'reserved' || 
            order.status?.toLowerCase() === 'reserved'
        );
    };

    // Fetch orders from API
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);

                const response = await fetch(`/api/orders/${ user.id }`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                   
                    console.log('Fetched orders:', data);

                    // Add reservation info to orders with reserved products
                    const ordersWithReservationInfo = data.map(order => {
                        if (hasReservedProducts(order)) {
                            const reservedItems = order.items.filter(item => 
                                item.status?.toLowerCase() === 'reserved'
                            );
                            
                            // Use first reserved item to calculate arrival time
                            const firstReservedItem = reservedItems[0];
                            return {
                                ...order,
                                reservationInfo: calculateReservedArrivalTime(
                                    order.order_date, 
                                    firstReservedItem?.category || 'standard'
                                ),
                                hasReservedItems: true
                            };
                        }
                        return {
                            ...order,
                            hasReservedItems: false
                        };
                    });
                    
                    setOrders(ordersWithReservationInfo);
                } else {
                    showToast('Failed to load orders', 'error');
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
                showToast('Network error. Please try again.', 'error');
            } finally {
                setLoading(false);
            }
        };
        
        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'processing':
                return styles['status-processing'];
            case 'shipped':
                return styles['status-shipped'];
            case 'delivered':
                return styles['status-delivered'];
            case 'cancelled':
                return styles['status-cancelled'];
            case 'reserved':
                return styles['status-reserved'];
            default:
                return styles['status-default'];
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setModalOpen(true);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-PH', options);
    };

    const formatArrivalDate = (date) => {
        if (!date) return 'N/A';
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        return date.toLocaleDateString('en-PH', options);
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'processing':
                return 'fa-solid fa-gears';
            case 'shipped':
                return 'fa-solid fa-truck-fast';
            case 'delivered':
                return 'fa-solid fa-box-open';
            case 'cancelled':
                return 'fa-solid fa-ban';
            case 'reserved':
                return 'fa-solid fa-clock';
            default:
                return 'fa-solid fa-info-circle';
        }
    };

    if (loading) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['banner']}></div>
                <div className={styles['header']}>
                    <ReturnButton />
                    <h1>Your Orders</h1>
                </div>
                <div className={styles['loading']}>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles['wrapper']}>
                <div className={styles['banner']}></div>
                <div className={styles['header']}>
                    <ReturnButton />
                    <h1>Your Orders</h1>
                </div>
                <div className={styles['container']}>
                    {orders.length === 0 ? (
                        <div className={styles['empty']}>
                            <h3>No orders found!</h3>
                            <p>Start browsing for items in <Anchor label="Jewelry" link="/jewelry" isNested={false} /> or <Anchor label="Accessories" link="/accessories" isNested={false} />.</p>
                        </div>
                    ) : (
                        <div className={styles['orders-list']}>
                            {orders.map(order => (
                                <div className={styles['order-item']} key={order.order_id}>
                                    <div className={styles['order-header']}>
                                        <div className={styles['order-info']}>
                                            <h3>Order #: {order.order_id}</h3>
                                            <p>Placed on: {formatDate(order.order_date)}</p>
                                        </div>
                                        <div className={`${styles['order-status']} ${getStatusColor(order.status)}`}>
                                            <i className={getStatusIcon(order.status)}></i>
                                            <span>{order.status}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Reservation Information for reserved products */}
                                    {order.hasReservedItems && order.reservationInfo && (
                                        <div className={styles['reservation-info']}>
                                            <div className={styles['reservation-estimate']}>
                                                <i className="fa-solid fa-clock"></i>
                                                <span>
                                                    {order.reservationInfo.daysRemaining > 0 ? (
                                                        `Estimated completion in ${order.reservationInfo.daysRemaining} day${order.reservationInfo.daysRemaining !== 1 ? 's' : ''}`
                                                    ) : (
                                                        'Ready for shipping'
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles['reservation-note']}>
                                                <small>
                                                    Your reserved item{order.items.filter(item => item.status?.toLowerCase() === 'reserved').length > 1 ? 's are' : ' is'} being crafted and will ship soon after completion.
                                                    {order.reservationInfo.daysRemaining > 0 && (
                                                        ` Estimated arrival: ${formatArrivalDate(order.reservationInfo.estimatedArrival)}`
                                                    )}
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className={styles['order-content']}>
                                        <div className={styles['order-items-preview']}>
                                            {order.items.slice(0, 3).map((item, index) => (
                                                <div key={index} className={styles['item-with-status']}>
                                                    <img
                                                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                                        alt={item.label}
                                                        className={styles['preview-image']}
                                                    />
                                                    {item.status?.toLowerCase() === 'reserved' && (
                                                        <span className={styles['item-reserved-badge']}>Reserved</span>
                                                    )}
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className={styles['more-items']}>
                                                    +{order.items.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className={styles['order-total']}>
                                            <h4>Total: ₱{parseFloat(order.total_amount).toLocaleString('en-PH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}</h4>
                                        </div>
                                    </div>
                                    
                                    <div className={styles['order-actions']}>
                                        <Button
                                            type='secondary'
                                            label='View Details'
                                            icon='fa-solid fa-eye'
                                            iconPosition='left'
                                            action={() => handleViewDetails(order)}
                                        />
                                        {order.status.toLowerCase() === 'delivered' && (
                                            <Button
                                                type='primary'
                                                label='Reorder'
                                                icon='fa-solid fa-rotate-left'
                                                iconPosition='left'
                                                action={() => {
                                                    showToast('Reorder functionality coming soon!', 'info');
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {selectedOrder && (
                <Modal 
                    label={`Order Details - #${selectedOrder.order_id}`} 
                    isOpen={modalOpen} 
                    onClose={() => setModalOpen(false)}
                    size="large"
                >
                    <div className={styles['order-details']}>
                        <div className={styles['detail-section']}>
                            <h3>Order Information</h3>
                            <div className={styles['detail-grid']}>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Order Date:</span>
                                    <span className={styles['detail-value']}>{formatDate(selectedOrder.order_date)}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Status:</span>
                                    <span className={`${styles['detail-value']} ${getStatusColor(selectedOrder.status)}`}>
                                        <i className={getStatusIcon(selectedOrder.status)}></i>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                {selectedOrder.hasReservedItems && selectedOrder.reservationInfo && (
                                    <div className={styles['detail-item']}>
                                        <span className={styles['detail-label']}>Est. Completion:</span>
                                        <span className={styles['detail-value']}>
                                            {formatArrivalDate(selectedOrder.reservationInfo.estimatedArrival)}
                                            {selectedOrder.reservationInfo.daysRemaining > 0 && (
                                                ` (in ${selectedOrder.reservationInfo.daysRemaining} days)`
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Total Amount:</span>
                                    <span className={styles['detail-value']}>₱{parseFloat(selectedOrder.total_amount).toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles['detail-section']}>
                            <h3>Shipping Information</h3>
                            <div className={styles['detail-grid']}>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Recipient:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.shipping_address.recipient_name}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Address:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province} {selectedOrder.shipping_address.postal_code}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Contact:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.shipping_address.phone}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles['detail-section']}>
                            <h3>Order Items</h3>
                            <div className={styles['order-items']}>
                                {selectedOrder.items.map(item => (
                                    <div className={styles['order-item-detail']} key={item.product_id}>
                                        <img
                                            src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                            alt={item.label}
                                            className={styles['item-image']}
                                        />
                                        <div className={styles['item-details']}>
                                            <h4>{item.label}</h4>
                                            <p>Quantity: {item.quantity}</p>
                                            <p>Price: ₱{parseFloat(item.price).toLocaleString('en-PH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}</p>
                                            {item.status?.toLowerCase() === 'reserved' && (
                                                <p className={styles['reserved-item-note']}>
                                                    <i className="fa-solid fa-clock"></i>
                                                    Reserved item - estimated completion in {
                                                        selectedOrder.reservationInfo?.daysRemaining || 'a few'
                                                    } days
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className={styles['modal-actions']}>
                            <Button
                                label='Close'
                                type='secondary'
                                action={() => setModalOpen(false)}
                            />
                            {selectedOrder.status.toLowerCase() === 'delivered' && (
                                <Button
                                    label='Reorder All Items'
                                    type='primary'
                                    icon='fa-solid fa-rotate-left'
                                    action={() => {
                                        showToast('Reorder functionality coming soon!', 'info');
                                        setModalOpen(false);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default Orders;