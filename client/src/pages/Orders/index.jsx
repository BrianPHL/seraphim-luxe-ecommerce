import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, Anchor, ReturnButton, Modal } from '@components';
import styles from './Orders.module.css';
import { useToast, useAuth, useSettings } from '@contexts';

const Orders = () => {
    const { showToast } = useToast();
    const { settings, convertPrice, formatPrice } = useSettings();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('current');
    const [convertedOrders, setConvertedOrders] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    const safeFormatPrice = (price, currency = null) => {
        try {
            if (formatPrice && typeof formatPrice === 'function') {
                return formatPrice(price, currency);
            }
            
            const numPrice = Number(price);
            if (isNaN(numPrice)) {
                return 'Price unavailable';
            }

            const currentCurrency = currency || settings?.currency || 'PHP';
            
            switch (currentCurrency?.toUpperCase()) {
                case 'USD':
                    return `$${numPrice.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
                case 'EUR':
                    return `€${numPrice.toLocaleString('en-EU', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
                case 'JPY':
                    return `¥${Math.round(numPrice).toLocaleString('ja-JP')}`;
                case 'CAD':
                    return `C$${numPrice.toLocaleString('en-CA', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
                case 'PHP':
                default:
                    return `₱${numPrice.toLocaleString('en-PH', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
            }
        } catch (error) {
            console.error('Error formatting price:', error);
            return `₱${Number(price).toFixed(2)}`;
        }
    };

    const detectOrderCurrency = (order) => {
        const amount = parseFloat(order.total_amount);
    
        if (order.currency && order.currency !== 'PHP') {
            return order.currency;
        }
        
        if (order.display_currency && order.display_currency !== 'PHP') {
            return order.display_currency;
        }
        
        if (amount > 0 && amount < 100) {
            const hasLowItemPrices = order.items?.some(item => {
                const itemPrice = parseFloat(item.price || item.unit_price || 0);
                return itemPrice > 0 && itemPrice < 5; 
            });
            
            if (hasLowItemPrices) {
                return 'USD';
            }
        }
        
        return 'PHP'; 
    };

    const convertToBasePHP = (amount, detectedCurrency) => {
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return amount;

        switch (detectedCurrency?.toUpperCase()) {
            case 'USD':
                return numAmount * 55.56; 
            case 'EUR':
                return numAmount * 62.50;
            case 'JPY':
                return numAmount * 0.37; 
            case 'CAD':
                return numAmount * 41.67;
            case 'PHP':
            default:
                return numAmount;
        }
    };

    const calculateReservedArrivalTime = (orderDate, productType) => {
        const orderDateTime = new Date(orderDate);
        const now = new Date();

        let processingDays;
        switch (productType.toLowerCase()) {
            case 'custom jewelry':
            case 'bespoke':
                processingDays = 14;
                break;
            case 'premium':
            case 'luxury':
                processingDays = 7;
                break;
            default:
                processingDays = 5;
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

    const hasReservedProducts = (order) => {
        return order.items.some(item => 
            item.status?.toLowerCase() === 'reserved' || 
            order.status?.toLowerCase() === 'reserved'
        );
    };

    useEffect(() => {
        const convertOrderPrices = async () => {
            if (!orders.length) {
                setConvertedOrders([]);
                return;
            }

            try {
                const ordersWithConvertedPrices = await Promise.all(
                    orders.map(async (order) => {
                        const detectedCurrency = detectOrderCurrency(order);
                        
                        const phpTotalAmount = convertToBasePHP(order.total_amount, detectedCurrency);
                        
                        let convertedTotalAmount = phpTotalAmount;
                        const displayCurrency = settings?.currency || 'PHP';
                        
                        if (displayCurrency !== 'PHP' && convertPrice) {
                            try {
                                convertedTotalAmount = await convertPrice(phpTotalAmount, displayCurrency);
                            } catch (error) {
                                console.error('Error converting total amount for order:', order.order_number, error);
                                convertedTotalAmount = phpTotalAmount;
                            }
                        }

                        const convertedItems = await Promise.all(
                            (order.items || []).map(async (item) => {
                                const itemPrice = item.price || item.unit_price;
                                
                                const phpItemPrice = convertToBasePHP(itemPrice, detectedCurrency);
                                
                                let convertedPrice = phpItemPrice;
                                if (displayCurrency !== 'PHP' && convertPrice && phpItemPrice) {
                                    try {
                                        convertedPrice = await convertPrice(phpItemPrice, displayCurrency);
                                    } catch (error) {
                                        console.error('Error converting item price:', item.label, error);
                                        convertedPrice = phpItemPrice;
                                    }
                                }
                                
                                return {
                                    ...item,
                                    displayPrice: convertedPrice
                                };
                            })
                        );
                        
                        return {
                            ...order,
                            displayTotalAmount: convertedTotalAmount,
                            items: convertedItems,
                            detectedCurrency, 
                            phpTotalAmount
                        };
                    })
                );
                
                setConvertedOrders(ordersWithConvertedPrices);
            } catch (error) {
                console.error('Error converting order prices:', error);
                setConvertedOrders(orders.map(order => ({
                    ...order,
                    displayTotalAmount: order.total_amount,
                    items: (order.items || []).map(item => ({
                        ...item,
                        displayPrice: item.price || item.unit_price
                    }))
                })));
            }
        };

        if (settings && orders.length > 0) {
            convertOrderPrices();
        }
    }, [orders, settings?.currency, convertPrice, settings]);

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

                    const ordersWithReservationInfo = data.map(order => {
                        if (hasReservedProducts(order)) {
                            const reservedItems = order.items.filter(item => 
                                item.status?.toLowerCase() === 'reserved'
                            );
                        
                            const firstReservedItem = reservedItems[0];
                            return {
                                ...order,
                                reservationInfo: calculateReservedArrivalTime(
                                    order.order_date || order.created_at || order.date, 
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
        
        if (user?.id) {
            fetchOrders();
        }
    }, [user?.id]);

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
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                return 'N/A';
            }
            
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-PH', options);
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'N/A';
        }
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

    const displayOrders = convertedOrders.length > 0 ? convertedOrders : orders;

    const currentOrders = displayOrders.filter(order => 
        !['delivered', 'completed'].includes(order.status.toLowerCase())
    );
    
    const pastOrders = displayOrders.filter(order => 
        ['delivered', 'completed'].includes(order.status.toLowerCase())
    );

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

                <div className={styles['tabs']}>
                    <button 
                        className={`${styles['tab']} ${activeTab === 'current' ? styles['active'] : ''}`}
                        onClick={() => setActiveTab('current')}
                    >
                        <i className="fa-solid fa-clock"></i>
                        Current Orders ({currentOrders.length})
                    </button>
                    <button 
                        className={`${styles['tab']} ${activeTab === 'past' ? styles['active'] : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        <i className="fa-solid fa-box-open"></i>
                        Past Orders ({pastOrders.length})
                    </button>
                </div>

                <div className={styles['container']}>
                    {activeTab === 'current' && (
                        <>
                            {currentOrders.length === 0 ? (
                                <div className={styles['empty']}>
                                    <h3>No current orders!</h3>
                                    <p>Start browsing for items in <Anchor label="Jewelry" link="/jewelry" isNested={false} /> or <Anchor label="Accessories" link="/accessories" isNested={false} />.</p>
                                </div>
                            ) : (
                                <div className={styles['orders-list']}>
                                    {currentOrders.map(order => (
                                        <div className={styles['order-item']} key={order.order_number || order.id}>
                                            <div className={styles['order-header']}>
                                                <div className={styles['order-info']}>
                                                    <h3>Order #: {order.order_number || 'N/A'}</h3>
                                                    <p>Placed on: {formatDate(order.order_date || order.created_at || order.date)}</p>
                                                </div>
                                                <div className={`${styles['order-status']} ${getStatusColor(order.status)}`}>
                                                    <i className={getStatusIcon(order.status)}></i>
                                                    <span>{order.status}</span>
                                                </div>
                                            </div>

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
                                                    <h4>Total: {safeFormatPrice(order.displayTotalAmount || order.total_amount)}</h4>
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'past' && (
                        <>
                            {pastOrders.length === 0 ? (
                                <div className={styles['empty']}>
                                    <h3>No past orders!</h3>
                                    <p>Your completed orders will appear here once delivered.</p>
                                </div>
                            ) : (
                                <div className={styles['orders-list']}>
                                    {pastOrders.map(order => (
                                        <div className={styles['order-item']} key={order.order_number || order.id}>
                                            <div className={styles['order-header']}>
                                                <div className={styles['order-info']}>
                                                    <h3>Order #: {order.order_number || 'N/A'}</h3>
                                                    <p>Delivered on: {formatDate(order.delivered_date || order.order_date || order.created_at || order.date)}</p>
                                                </div>
                                                <div className={`${styles['order-status']} ${getStatusColor(order.status)}`}>
                                                    <i className={getStatusIcon(order.status)}></i>
                                                    <span>{order.status}</span>
                                                </div>
                                            </div>
                                            
                                            <div className={styles['order-content']}>
                                                <div className={styles['order-items-preview']}>
                                                    {order.items.slice(0, 3).map((item, index) => (
                                                        <div key={index} className={styles['item-with-status']}>
                                                            <img
                                                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                                                alt={item.label}
                                                                className={styles['preview-image']}
                                                            />
                                                        </div>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <div className={styles['more-items']}>
                                                            +{order.items.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className={styles['order-total']}>
                                                    <h4>Total: {safeFormatPrice(order.displayTotalAmount || order.total_amount)}</h4>
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
                                                <Button
                                                    type='primary'
                                                    label='Reorder'
                                                    icon='fa-solid fa-rotate-left'
                                                    iconPosition='left'
                                                    action={() => {
                                                        showToast('Reorder functionality coming soon!', 'info');
                                                    }}
                                                />
                                                <Button
                                                    type='tertiary'
                                                    label='Write Review'
                                                    icon='fa-solid fa-star'
                                                    iconPosition='left'
                                                    action={() => {
                                                        showToast('Review functionality coming soon!', 'info');
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {selectedOrder && (
                <Modal 
                    label={`Order Details - #${selectedOrder.order_number || 'N/A'}`} 
                    isOpen={modalOpen} 
                    onClose={() => setModalOpen(false)}
                    size="large"
                >
                    <div className={styles['order-details']}>
                        <div className={styles['order-details-header']}>
                            <div className={styles['order-id-section']}>
                                <h2>Order #{selectedOrder.order_number || 'N/A'}</h2>
                                <div className={`${styles['status-badge']} ${getStatusColor(selectedOrder.status)}`}>
                                    <i className={getStatusIcon(selectedOrder.status)}></i>
                                    <span>{selectedOrder.status}</span>
                                </div>
                            </div>
                            {selectedOrder.hasReservedItems && selectedOrder.reservationInfo && (
                                <div className={styles['reservation-banner']}>
                                    <i className="fa-solid fa-clock"></i>
                                    <div>
                                        <strong>Reserved Item Progress</strong>
                                        <p>
                                            {selectedOrder.reservationInfo.daysRemaining > 0 
                                                ? `Estimated completion in ${selectedOrder.reservationInfo.daysRemaining} days`
                                                : 'Ready for shipping'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles['summary-card']}>
                            <div className={styles['summary-item']}>
                                <i className="fa-solid fa-calendar"></i>
                                <div>
                                    <span className={styles['summary-label']}>Order Date</span>
                                    <span className={styles['summary-value']}>
                                        {formatDate(selectedOrder.order_date || selectedOrder.created_at || selectedOrder.date)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles['summary-item']}>
                                <i className="fa-solid fa-credit-card"></i>
                                <div>
                                    <span className={styles['summary-label']}>Total Amount</span>
                                    <span className={styles['summary-value']}>
                                        {safeFormatPrice(selectedOrder.displayTotalAmount || selectedOrder.total_amount || 0)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles['summary-item']}>
                                <i className="fa-solid fa-box"></i>
                                <div>
                                    <span className={styles['summary-label']}>Items</span>
                                    <span className={styles['summary-value']}>
                                        {selectedOrder.items?.length || 0} item{selectedOrder.items?.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles['detail-section']}>
                            <div className={styles['section-header']}>
                                <i className="fa-solid fa-truck"></i>
                                <h3>Shipping Information</h3>
                            </div>
                            <div className={styles['shipping-card']}>
                                <div className={styles['shipping-item']}>
                                    <i className="fa-solid fa-user"></i>
                                    <div>
                                        <span className={styles['shipping-label']}>Recipient</span>
                                        <span className={styles['shipping-value']}>
                                            {selectedOrder.shipping_address?.recipient_name || 
                                             selectedOrder.recipient_name || 
                                             `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 
                                             'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles['shipping-item']}>
                                    <i className="fa-solid fa-location-dot"></i>
                                    <div>
                                        <span className={styles['shipping-label']}>Delivery Address</span>
                                        <span className={styles['shipping-value']}>
                                            {settings?.preferred_shipping_address === 'billing' && user?.address ? (
                                                user.address
                                            ) : selectedOrder.shipping_address ? (
                                                `${selectedOrder.shipping_address.street || ''}, ${selectedOrder.shipping_address.city || ''}, ${selectedOrder.shipping_address.province || selectedOrder.shipping_address.state || ''} ${selectedOrder.shipping_address.postal_code || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') || 'N/A'
                                            ) : (
                                                selectedOrder.shipping_street ? 
                                                `${selectedOrder.shipping_street}, ${selectedOrder.shipping_city}, ${selectedOrder.shipping_state} ${selectedOrder.shipping_postal_code}` : 
                                                user?.address || 'N/A'
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles['shipping-item']}>
                                    <i className="fa-solid fa-phone"></i>
                                    <div>
                                        <span className={styles['shipping-label']}>Phone Number</span>
                                        <span className={styles['shipping-value']}>
                                            {selectedOrder.shipping_address?.phone || 
                                             selectedOrder.phone_number || 
                                             user?.phone_number || 
                                             'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles['detail-section']}>
                            <div className={styles['section-header']}>
                                <i className="fa-solid fa-shopping-bag"></i>
                                <h3>Order Items</h3>
                            </div>
                            <div className={styles['items-container']}>
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    selectedOrder.items.map((item, index) => (
                                        <div className={styles['item-card']} key={item.product_id || index}>
                                            <div className={styles['item-image-container']}>
                                                <img
                                                    src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url || item.image}`}
                                                    alt={item.label || item.name || 'Product'}
                                                    className={styles['item-image']}
                                                />
                                                {item.status?.toLowerCase() === 'reserved' && (
                                                    <div className={styles['reserved-badge']}>
                                                        <i className="fa-solid fa-clock"></i>
                                                        Reserved
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles['item-info']}>
                                                <h4 className={styles['item-name']}>
                                                    {item.label || item.name || 'Unknown Item'}
                                                </h4>
                                                <div className={styles['item-details-grid']}>
                                                    <div className={styles['item-detail']}>
                                                        <span className={styles['detail-label']}>Quantity</span>
                                                        <span className={styles['detail-value']}>{item.quantity || 1}</span>
                                                    </div>
                                                    <div className={styles['item-detail']}>
                                                        <span className={styles['detail-label']}>Unit Price</span>
                                                        <span className={styles['detail-value']}>
                                                            {safeFormatPrice(item.displayPrice || item.price || item.unit_price || 0)}
                                                        </span>
                                                    </div>
                                                    <div className={styles['item-detail']}>
                                                        <span className={styles['detail-label']}>Subtotal</span>
                                                        <span className={styles['detail-value']}>
                                                            {safeFormatPrice((parseFloat(item.displayPrice || item.price || item.unit_price || 0) * (item.quantity || 1)))}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.status?.toLowerCase() === 'reserved' && (
                                                    <div className={styles['reserved-note']}>
                                                        <i className="fa-solid fa-info-circle"></i>
                                                        <span>
                                                            This item is being crafted. Estimated completion in {
                                                                selectedOrder.reservationInfo?.daysRemaining || 'a few'
                                                            } days.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles['no-items']}>
                                        <i className="fa-solid fa-box-open"></i>
                                        <p>No items found for this order.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles['total-section']}>
                            <div className={styles['total-breakdown']}>
                                <div className={styles['total-line']}>
                                    <span>Subtotal:</span>
                                    <span>{safeFormatPrice(selectedOrder.displayTotalAmount || selectedOrder.total_amount || 0)}</span>
                                </div>
                                <div className={styles['total-line']}>
                                    <span>Shipping:</span>
                                    <span>Free</span>
                                </div>
                                <div className={styles['total-line-final']}>
                                    <span>Total:</span>
                                    <span>{safeFormatPrice(selectedOrder.displayTotalAmount || selectedOrder.total_amount || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles['modal-actions']}>
                            <Button
                                label='Close'
                                type='secondary'
                                action={() => setModalOpen(false)}
                            />
                            {selectedOrder.status?.toLowerCase() === 'delivered' && (
                                <>
                                    <Button
                                        label='Write Review'
                                        type='tertiary'
                                        icon='fa-solid fa-star'
                                        iconPosition='left'
                                        action={() => {
                                            showToast('Review functionality coming soon!', 'info');
                                            setModalOpen(false);
                                        }}
                                    />
                                    <Button
                                        label='Reorder Items'
                                        type='primary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        action={() => {
                                            showToast('Reorder functionality coming soon!', 'info');
                                            setModalOpen(false);
                                        }}
                                    />
                                </>
                            )}
                            {selectedOrder.status?.toLowerCase() === 'processing' && (
                                <Button
                                    label='Track Order'
                                    type='primary'
                                    icon='fa-solid fa-location-dot'
                                    iconPosition='left'
                                    action={() => {
                                        showToast('Order tracking coming soon!', 'info');
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