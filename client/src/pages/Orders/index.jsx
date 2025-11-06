import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Anchor, ReturnButton, Modal, Banner, TableFooter, InputField } from '@components';
import styles from './Orders.module.css';
import { useToast, useAuth, useSettings, useBanners, useOrders } from '@contexts';
import { usePagination } from '@hooks';
import { getErrorMessage } from '@utils';

const Orders = () => {
    const { showToast } = useToast();
    const { settings, convertPrice, formatPrice } = useSettings();
    const { banners } = useBanners();
    const { cancelOrder } = useOrders();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [otherReason, setOtherReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('current');
    const [convertedOrders, setConvertedOrders] = useState([]);
    const [selectedProductForReview, setSelectedProductForReview] = useState(null);
    const [reviewFormData, setReviewFormData] = useState({
        rating: 0,
        review_title: '',
        review_text: ''
    });
    const [reviewFormErrors, setReviewFormErrors] = useState({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const { user } = useAuth();

    const ORDERS_PER_PAGE = 3;

    // Star Rating Component
    const StarRating = ({ value = 0, onChange = null, readOnly = false, size = 'medium' }) => {
        const [hoverValue, setHoverValue] = useState(0);
        const isInteractive = !readOnly && onChange;
        const displayValue = hoverValue || value;

        return (
            <div className={`${styles['star-rating']} ${isInteractive ? styles['interactive'] : ''}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`${styles['star']} ${star <= displayValue ? styles['star-filled'] : styles['star-empty']} ${size === 'large' ? styles['star-large'] : styles['star-medium']}`}
                        onClick={() => isInteractive && onChange(star)}
                        onMouseEnter={() => isInteractive && setHoverValue(star)}
                        onMouseLeave={() => isInteractive && setHoverValue(0)}
                        disabled={!isInteractive}
                    >
                        <i className={star <= displayValue ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                    </button>
                ))}
            </div>
        );
    };

    const safeFormatPrice = useCallback((price, currency = null) => {
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
    }, [formatPrice, settings?.currency]);

    const detectOrderCurrency = useCallback((order) => {
        if (order.currency && order.currency !== 'PHP') {
            return order.currency;
        }
        
        if (order.display_currency && order.display_currency !== 'PHP') {
            return order.display_currency;
        }
        
        const amount = parseFloat(order.total_amount);
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
    }, []);

    const convertToBasePHP = useCallback((amount, detectedCurrency) => {
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
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'N/A';
            }
            
            return date.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'N/A';
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);

            const response = await fetch(`/api/orders/${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            } else {
                const errorMessage = getErrorMessage('ORDERS_LOAD_ERROR') || 'Failed to load orders';
                showToast(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            const errorMessage = getErrorMessage('NETWORK_ERROR') || 'Network error. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.id, showToast]);

    const convertedOrdersData = useMemo(() => {
        if (!orders.length || !settings) return [];

        return orders.map(order => {
            const detectedCurrency = detectOrderCurrency(order);
            const phpTotalAmount = convertToBasePHP(order.total_amount, detectedCurrency);
            
            const convertedItems = (order.items || []).map(item => {
                const totalQuantity = order.items.reduce((sum, i) => sum + (parseInt(i.quantity) || 0), 0);
                const itemPrice = totalQuantity > 0 ? parseFloat(order.total_amount) / totalQuantity : 0;
                
                const phpUnitPrice = itemPrice > 0 ? convertToBasePHP(itemPrice, detectedCurrency) : 0;
                const quantity = parseInt(item.quantity || 1);
                const phpSubtotal = phpUnitPrice * quantity;
                
                return {
                    ...item,
                    displayPrice: phpUnitPrice,
                    price: itemPrice,
                    displaySubtotal: phpSubtotal
                };
            });
            
            return {
                ...order,
                displayTotalAmount: phpTotalAmount,
                items: convertedItems,
                detectedCurrency,
                phpTotalAmount
            };
        });
    }, [orders, settings, detectOrderCurrency, convertToBasePHP]);

    useEffect(() => {
        if (user?.id) {
            fetchOrders();
        }
    }, [user?.id, fetchOrders]);

    const handleOpenReviewModal = useCallback((order) => {
        setSelectedOrder(order);
        setReviewModalOpen(true);
        setSelectedProductForReview(null);
        setReviewFormData({ rating: 0, review_title: '', review_text: '' });
        setReviewFormErrors({});
    }, []);

    const handleCloseReviewModal = useCallback(() => {
        setReviewModalOpen(false);
        setSelectedOrder(null);
        setSelectedProductForReview(null);
        setReviewFormData({ rating: 0, review_title: '', review_text: '' });
        setReviewFormErrors({});
    }, []);

    const validateReviewForm = () => {
        const newErrors = {};
        if (reviewFormData.rating === 0) newErrors.rating = 'Please select a rating';
        if (reviewFormData.review_text.length > 2000) newErrors.review_text = 'Review must be less than 2000 characters';
        if (reviewFormData.review_title.length > 100) newErrors.review_title = 'Title must be less than 100 characters';
        
        if (!selectedProductForReview) {
            newErrors.product = 'Please select a product to review';
        }
        
        setReviewFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!validateReviewForm()) return;
        
        setSubmittingReview(true);

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: selectedProductForReview.product_id,
                    user_id: user.id,
                    rating: reviewFormData.rating,
                    review_text: reviewFormData.review_text,
                    review_title: reviewFormData.review_title
                })
            });

            if (response.ok) {
                showToast('Review submitted successfully!', 'success');
                handleCloseReviewModal();
            } else {
                const errorData = await response.json();
                showToast(errorData.error || 'Failed to submit review. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast('Failed to submit review. Please try again.', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleReviewInputChange = (field, value) => {
        setReviewFormData(prev => ({ ...prev, [field]: value }));
        if (reviewFormErrors[field]) {
            setReviewFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleProductSelection = (product) => {
        setSelectedProductForReview(product);
        if (reviewFormErrors.product) {
            setReviewFormErrors(prev => ({ ...prev, product: '' }));
        }
    };

    const getStatusColor = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case 'processing':
                return styles['status-processing'];
            case 'shipped':
                return styles['status-shipped'];
            case 'delivered':
                return styles['status-delivered'];
            case 'cancelled':
                return styles['status-cancelled'];
            default:
                return styles['status-default'];
        }
    }, []);

    const getStatusIcon = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case 'processing':
                return 'fa-solid fa-gears';
            case 'shipped':
                return 'fa-solid fa-truck-fast';
            case 'delivered':
                return 'fa-solid fa-box-open';
            case 'cancelled':
                return 'fa-solid fa-ban';
            default:
                return 'fa-solid fa-info-circle';
        }
    }, []);

    const handleViewDetails = useCallback((order) => {
        setSelectedOrder(order);
        setModalOpen(true);
    }, []);

    const handleCancelOrder = useCallback((order) => {
        setSelectedOrder(order);
        setCancelModalOpen(true);
        setCancelReason('');
        setOtherReason('');
    }, []);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        currentOrdersPagination.resetPagination();
        pastOrdersPagination.resetPagination();
    }, []);

    const displayOrders = convertedOrdersData.length > 0 ? convertedOrdersData : orders;

    const currentOrders = useMemo(() => 
        displayOrders.filter(order => 
            !['delivered', 'completed', 'cancelled'].includes(order.status?.toLowerCase())
        ), [displayOrders]
    );
    
    const pastOrders = useMemo(() => 
        displayOrders.filter(order => 
            ['delivered', 'completed', 'cancelled'].includes(order.status?.toLowerCase())
        ), [displayOrders]
    );

    const currentOrdersPagination = usePagination(currentOrders, ORDERS_PER_PAGE, 1);
    const pastOrdersPagination = usePagination(pastOrders, ORDERS_PER_PAGE, 1);

    const confirmCancelOrder = useCallback(async () => {
        const reason = cancelReason === 'Other' ? otherReason : cancelReason || 'Cancelled by customer';

        if (!selectedOrder) return;

        try {
            const success = await cancelOrder(
                selectedOrder.id || selectedOrder.order_id, 
                reason
            );

            if (success) {
                setCancelModalOpen(false);
                setSelectedOrder(null);
                setCancelReason('');
                setOtherReason('');
                await fetchOrders();
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            const errorMessage = getErrorMessage('ORDER_CANCEL_ERROR') || 'Failed to cancel order. Please try again.';
            showToast(errorMessage, 'error');
        }
    }, [cancelReason, otherReason, selectedOrder, cancelOrder, fetchOrders, showToast]);

    const canCancelOrder = useCallback((order) => {
        const cancelableStatuses = ['pending', 'processing'];
        return cancelableStatuses.includes(order.status?.toLowerCase());
    }, []);

    const formatStatusText = useCallback((status) => {
        if (!status) return 'N/A';
        
        // Capitalize first letter and make rest lowercase
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }, []);

    if (loading) {
        return (
            <div className={styles['wrapper']}>
                <Banner data={banners.filter(banner => banner.page === 'orders')} />
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
                <Banner data={banners.filter(banner => banner.page === 'orders')} />
                <div className={styles['header']}>
                    <ReturnButton />
                    <h1>Your Orders</h1>
                </div>

                <div className={styles['tabs']}>
                    <button 
                        className={`${styles['tab']} ${activeTab === 'current' ? styles['active'] : ''}`}
                        onClick={() => handleTabChange('current')}
                    >
                        <i className="fa-solid fa-clock"></i>
                        Current Orders ({currentOrders.length})
                    </button>
                    <button 
                        className={`${styles['tab']} ${activeTab === 'past' ? styles['active'] : ''}`}
                        onClick={() => handleTabChange('past')}
                    >
                        <i className="fa-solid fa-box-open"></i>
                        Past Orders ({pastOrders.length})
                    </button>
                </div>

                <div className={styles['orders-list']}>
                    {activeTab === 'current' ? (
                        <>
                            {currentOrders.length === 0 ? (
                                <div className={styles['empty']}>
                                    <h3>No current orders!</h3>
                                    <p>Start checking out items in your <Anchor label="Cart" link="/cart" isNested={false} />.</p>
                                </div>
                            ) : (
                                <>
                                    {currentOrdersPagination.currentItems.map(order => (
                                        <div className={styles['order-item']} key={order.order_number || order.id}>
                                            <div className={styles['order-header']}>
                                                <div className={styles['order-info']}>
                                                    <h3>Order #: {order.order_number || 'N/A'}</h3>
                                                    <p>Placed on: {formatDate(order.order_date || order.created_at || order.date)}</p>
                                                </div>
                                                <div className={`${styles['order-status']} ${getStatusColor(order.status)}`}>
                                                    <i className={getStatusIcon(order.status)}></i>
                                                    <span>{formatStatusText(order.status)}</span>  
                                                </div>
                                            </div>
                                            
                                            <div className={styles['order-content']}>
                                                <div className={styles['order-items-preview']}>
                                                    {(order.items || []).map((item, index) => (
                                                        <div key={index}>
                                                            <img
                                                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                                                alt={item.label || 'Product'}
                                                                className={styles['preview-image']}
                                                            />
                                                        </div>
                                                    ))}
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
                                                {canCancelOrder(order) && (
                                                    <Button
                                                        type='primary'
                                                        label='Cancel Order'
                                                        icon='fa-solid fa-times'
                                                        iconPosition='left'
                                                        action={() => handleCancelOrder(order)}
                                                        externalStyles={styles['action-danger']}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {currentOrdersPagination.totalPages > 1 && (
                                        <TableFooter
                                            currentPage={currentOrdersPagination.currentPage}
                                            totalPages={currentOrdersPagination.totalPages}
                                            resultsLabel={`Showing ${currentOrdersPagination.currentItems.length} out of ${currentOrders.length} current orders`}
                                            onPageChange={currentOrdersPagination.handlePageChange}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {pastOrders.length === 0 ? (
                                <div className={styles['empty']}>
                                    <h3>No past orders!</h3>
                                    <p>Your completed orders will appear here once delivered.</p>
                                </div>
                            ) : (
                                <>
                                    {pastOrdersPagination.currentItems.map(order => (
                                        <div className={styles['order-item']} key={order.order_number || order.id}>
                                            <div className={styles['order-header']}>
                                                <div className={styles['order-info']}>
                                                    <h3>Order #: {order.order_number || 'N/A'}</h3>
                                                    <p>Delivered on: {formatDate(order.delivered_date || order.order_date || order.created_at || order.date)}</p>
                                                </div>
                                                <div className={`${styles['order-status']} ${getStatusColor(order.status)}`}>
                                                    <i className={getStatusIcon(order.status)}></i>
                                                    <span>{formatStatusText(order.status)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className={styles['order-content']}>
                                                <div className={styles['order-items-preview']}>
                                                    {(order.items || []).map((item, index) => (
                                                        <div key={index}>
                                                            <img
                                                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                                                alt={item.label || 'Product'}
                                                                className={styles['preview-image']}
                                                            />
                                                        </div>
                                                    ))}
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
                                                    type='secondary'
                                                    label='Write Review'
                                                    icon='fa-solid fa-star'
                                                    iconPosition='left'
                                                    action={() => handleOpenReviewModal(order)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {pastOrdersPagination.totalPages > 1 && (
                                        <TableFooter
                                            currentPage={pastOrdersPagination.currentPage}
                                            totalPages={pastOrdersPagination.totalPages}
                                            resultsLabel={`Showing ${pastOrdersPagination.currentItems.length} out of ${pastOrders.length} past orders`}
                                            onPageChange={pastOrdersPagination.handlePageChange}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {selectedOrder && modalOpen && (
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
                                    <span>{formatStatusText(selectedOrder.status)}</span>
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
                                            </div>
                                            <div className={styles['item-info']}>
                                                <h4 className={styles['item-name']}>
                                                    {item.label || item.name || 'Unknown Item'}
                                                </h4>
                                                <div className={styles['item-details-grid']}>
                                                    <div className={styles['item-detail']}>
                                                        <span className={styles['detail-label']}>Quantity</span>
                                                        <span className={styles['detail-value']}>{item.quantity || 'N/A'}</span>
                                                    </div>
                                                    <div className={styles['item-detail']}>
                                                        <span className={styles['detail-label']}>Unit Price</span>
                                                        <span className={styles['detail-value']}>
                                                            {safeFormatPrice(item.displayPrice || 0)}
                                                        </span>
                                                    </div>
                                                    <div className={styles['item-detail']}>
                                                        <span className={styles['detail-label']}>Subtotal</span>
                                                        <span className={styles['detail-value']}>
                                                            {safeFormatPrice(item.displaySubtotal || 0)}
                                                        </span>
                                                    </div>
                                                </div>
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
                                             `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles['shipping-item']}>
                                    <i className="fa-solid fa-location-dot"></i>
                                    <div>
                                        <span className={styles['shipping-label']}>Delivery Address</span>
                                        <span className={styles['shipping-value']}>
                                            {selectedOrder.shipping_address?.street ? 
                                                `${selectedOrder.shipping_address.street}, ${selectedOrder.shipping_address.city || ''}, ${selectedOrder.shipping_address.state || selectedOrder.shipping_address.province || ''} ${selectedOrder.shipping_address.postal_code || ''}`.replace(/,\s*,/g, ',').trim() :
                                             selectedOrder.shipping_street ?
                                                `${selectedOrder.shipping_street}, ${selectedOrder.shipping_city || ''}, ${selectedOrder.shipping_state || ''} ${selectedOrder.shipping_postal_code || ''}`.replace(/,\s*,/g, ',').trim() :
                                             selectedOrder.address ||
                                             selectedOrder.delivery_address ||
                                             user?.address ||
                                             'No delivery address provided'
                                            }
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
                            {canCancelOrder(selectedOrder) && (
                                <Button
                                    label='Cancel Order'
                                    type='primary'
                                    icon='fa-solid fa-times'
                                    iconPosition='left'
                                    action={() => {
                                        setModalOpen(false);
                                        handleCancelOrder(selectedOrder);
                                    }}
                                    externalStyles={styles['action-danger']}
                                />
                            )}
                            {selectedOrder.status?.toLowerCase() === 'delivered' && (
                                <>
                                    <Button
                                        type='secondary'
                                        label='Write Review'
                                        icon='fa-solid fa-star'
                                        iconPosition='left'
                                        action={() => {
                                            setModalOpen(false);
                                            handleOpenReviewModal(selectedOrder);
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
                        </div>
                    </div>
                </Modal>
            )}

            <Modal
                label="Cancel Order"
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                size="medium"
            >
                <div className={styles['cancel-modal-content']}>
                    <div className={styles['cancel-warning']}>
                        <i className="fa-solid fa-exclamation-triangle"></i>
                        <p>Are you sure you want to cancel this order?</p>
                    </div>
                    
                    {selectedOrder && (
                        <div className={styles['order-summary']}>
                            <h4>Order #{selectedOrder.order_number || 'N/A'}</h4>
                            <p>Total: {safeFormatPrice(selectedOrder.displayTotalAmount || selectedOrder.total_amount)}</p>
                            <p>Status: {formatStatusText(selectedOrder.status)}</p>
                        </div>
                    )}
                    
                    <div className={styles['cancel-reason']}>
                        <label htmlFor="cancelReason">Reason for cancellation (optional):</label>
                        <select
                            id="cancelReason"
                            value={cancelReason}
                            onChange={(e) => {
                                setCancelReason(e.target.value);
                                if (e.target.value !== 'Other') setOtherReason('');
                            }}
                        >
                            <option value="">Select a reason</option>
                            <option value="Changed my mind">Changed my mind</option>
                            <option value="Found better price elsewhere">Found better price elsewhere</option>
                            <option value="No longer need the item">No longer need the item</option>
                            <option value="Ordered by mistake">Ordered by mistake</option>
                            <option value="Delivery time too long">Delivery time too long</option>
                            <option value="Other">Other</option>
                        </select>
                        
                        {cancelReason === 'Other' && (
                            <textarea
                                placeholder="Please specify your reason..."
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                rows={3}
                            />
                        )}
                    </div>

                    <div className={styles['cancellation-note']}>
                        <p>Please note:</p>
                        <ul>
                            <li>Your payment will be refunded within 3-5 business days</li>
                            <li>Once cancelled, this order cannot be restored</li>
                            <li>Items will be returned to inventory</li>
                        </ul>
                    </div>

                    <div className={styles['modal-actions']}>
                        <Button
                            label='Keep Order'
                            type='secondary'
                            action={() => setCancelModalOpen(false)}
                        />
                        <Button
                            label='Cancel Order'
                            type='primary'
                            icon='fa-solid fa-times'
                            iconPosition='left'
                            action={confirmCancelOrder}
                            externalStyles={styles['action-danger']}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                label="Write a Review"
                isOpen={reviewModalOpen}
                onClose={handleCloseReviewModal}
                size="large"
            >
                <div className={styles['review-modal-content']}>
                    <div className={styles['product-selection-section']}>
                        <h3>Select a product to review:</h3>
                        <p className={styles['product-selection-description']}>
                            Choose one product from your order to review
                        </p>
                        
                        <div className={styles['product-options']}>
                            {selectedOrder?.items?.map((item, index) => (
                                <div 
                                    key={item.product_id || index}
                                    className={`${styles['product-option']} ${selectedProductForReview?.product_id === item.product_id ? styles['active'] : ''}`}
                                    onClick={() => handleProductSelection(item)}
                                >
                                    <img
                                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                        alt={item.label || 'Product'}
                                        className={styles['product-thumb']}
                                    />
                                    <div className={styles['product-info']}>
                                        <span className={styles['product-name']}>{item.label || 'Product'}</span>
                                        <span className={styles['product-details']}>
                                            Qty: {item.quantity} • {safeFormatPrice(item.displayPrice || 0)}
                                        </span>
                                    </div>
                                    {selectedProductForReview?.product_id === item.product_id && (
                                        <i className={`fa-solid fa-check ${styles['product-check-icon']}`}></i>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {reviewFormErrors.product && (
                            <span className={styles['form-error']}>
                                {reviewFormErrors.product}
                            </span>
                        )}
                        
                        {selectedProductForReview && (
                            <p className={styles['product-selected-text']}>
                                Selected: {selectedProductForReview.label || 'Product'}
                            </p>
                        )}
                    </div>

                    {selectedProductForReview && (
                        <div className={styles['review-form-section']}>
                            <div className={styles['review-header']}>
                                <h4>Write Your Review</h4>
                                <p className={styles['review-product-info']}>
                                    Reviewing: <strong>{selectedProductForReview.label || 'Product'}</strong>
                                </p>
                            </div>

                            <form className={styles['review-form']} onSubmit={handleSubmitReview}>
                                <div className={styles['rating-section']}>
                                    <label className={styles['rating-label']}>
                                        Rating <span className={styles['required-asterisk']}>*</span>
                                    </label>
                                    <div className={styles['star-rating-container']}>
                                        <StarRating
                                            value={reviewFormData.rating}
                                            onChange={(rating) => handleReviewInputChange('rating', rating)}
                                            size="large"
                                        />
                                        {reviewFormData.rating > 0 && (
                                            <span className={styles['rating-description']}>
                                                {reviewFormData.rating} star{reviewFormData.rating !== 1 ? 's' : ''}
                                                {reviewFormData.rating === 1 && ' - Poor'}
                                                {reviewFormData.rating === 2 && ' - Fair'}
                                                {reviewFormData.rating === 3 && ' - Good'}
                                                {reviewFormData.rating === 4 && ' - Very Good'}
                                                {reviewFormData.rating === 5 && ' - Excellent'}
                                            </span>
                                        )}
                                    </div>
                                    {reviewFormErrors.rating && (
                                        <span className={styles['form-error']}>{reviewFormErrors.rating}</span>
                                    )}
                                </div>

                                <div className={styles['form-group']}>
                                    <label>Review Title (Optional)</label>
                                    <InputField
                                        type="text"
                                        hint="Summarize your review in a few words..."
                                        isSubmittable={false}
                                        value={reviewFormData.review_title}
                                        onChange={(e) => handleReviewInputChange('review_title', e.target.value)}
                                        externalStyles={`${styles['review-input']} ${reviewFormErrors.review_title ? styles['input-error'] : ''}`}
                                    />
                                    <div className={styles['character-counter']}>
                                        {reviewFormData.review_title.length}/100
                                    </div>
                                    {reviewFormErrors.review_title && (
                                        <span className={styles['form-error']}>{reviewFormErrors.review_title}</span>
                                    )}
                                </div>

                                <div className={styles['form-group']}>
                                    <label>Your Review</label>
                                    <textarea
                                        className={`${styles['review-textarea']} ${reviewFormErrors.review_text ? styles['input-error'] : ''}`}
                                        placeholder="Share your experience with this product... (Optional)"
                                        value={reviewFormData.review_text}
                                        onChange={(e) => handleReviewInputChange('review_text', e.target.value)}
                                        rows={6}
                                    />
                                    <div className={styles['character-counter']}>
                                        {reviewFormData.review_text.length}/2000
                                    </div>
                                    {reviewFormErrors.review_text && (
                                        <span className={styles['form-error']}>{reviewFormErrors.review_text}</span>
                                    )}
                                </div>

                                <div className={styles['review-modal-actions']}>
                                    <Button 
                                        type="secondary" 
                                        label="Cancel" 
                                        action={handleCloseReviewModal} 
                                        disabled={submittingReview} 
                                    />
                                    <Button
                                        type='primary'
                                        disabled={submittingReview}
                                        label={submittingReview ? 'Submitting...' : 'Submit Review'}
                                        action={handleSubmitReview}
                                    />
                                </div>
                            </form>
                        </div>
                    )}
                    
                    {!selectedProductForReview && (
                        <div className={styles['review-placeholder']}>
                            <i className={`fa-solid fa-hand-pointer ${styles['review-placeholder-icon']}`}></i>
                            Please select a product above to start writing your review
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default Orders;