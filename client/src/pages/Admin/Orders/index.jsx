import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Orders.module.css';
import { Button, Modal, TableHeader, TableFooter, InputField } from '@components';
import { useOrder, useToast, useAuth } from '@contexts';

const Orders = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Latest';
    const querySearch = searchParams.get('search') || '';
    
    const [currentPage, setCurrentPage] = useState(queryPage);
    const [totalPages, setTotalPages] = useState(1);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [paginatedOrders, setPaginatedOrders] = useState([]);
    const [searchInput, setSearchInput] = useState(querySearch);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const ITEMS_PER_PAGE = 10;

    const { user } = useAuth();
    const { recentOrders, fetchRecentOrders, updateOrderStatus, processRefund, getOrderItems, loading } = useOrder();
    const { showToast } = useToast();

    const orderStatuses = [
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'
    ];

    const sortOptions = [
        'Sort by: Latest',
        'Sort by: Oldest',
        'Sort by: Total Amount (High to Low)',
        'Sort by: Total Amount (Low to High)',
        'Sort by: Status (Pending First)'
    ];

    // Initialize and fetch orders
    useEffect(() => {
        const loadOrders = async () => {
            try {
                if (user && user.role === 'admin') {
                    await fetchRecentOrders();
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                showToast("Failed to load orders", "error");
            }
        };
        
        loadOrders();
    }, [user]);

    useEffect(() => {
        if (!recentOrders) return;
        
        let result = [...recentOrders];

        if (querySearch) {
            const searchLower = querySearch.toLowerCase();
            result = result.filter(order => 
                order.first_name?.toLowerCase().includes(searchLower) ||
                order.last_name?.toLowerCase().includes(searchLower) ||
                order.email?.toLowerCase().includes(searchLower) ||
                order.order_id?.toString().includes(searchLower) ||
                order.status?.toLowerCase().includes(searchLower) ||
                order.order_number?.toLowerCase().includes(searchLower)
            );
        }

        switch(querySort) {
            case 'Sort by: Latest':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'Sort by: Oldest':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'Sort by: Total Amount (High to Low)':
                result.sort((a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount));
                break;
            case 'Sort by: Total Amount (Low to High)':
                result.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
                break;
            case 'Sort by: Status (Pending First)':
                result.sort((a, b) => {
                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                    if (a.status !== 'pending' && b.status === 'pending') return 1;
                    return 0;
                });
                break;
            default:
                break;
        }
        
        setFilteredOrders(result);
        setTotalPages(Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE)));
        
    }, [recentOrders, querySearch, querySort]);

    // Paginate orders
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
    }, [filteredOrders, currentPage]);

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

    const handleViewOrder = async (order) => {
        setSelectedOrder(order);
        setModalType('view');
        setIsModalOpen(true);
        await loadOrderItems(order.order_id);
    };

    const loadOrderItems = async (orderId) => {
        try {
            const items = await getOrderItems(orderId);
            setSelectedOrder(prev => ({
                ...prev,
                items: items || []
            }));
        } catch (error) {
            console.error("Error fetching order items:", error);
            showToast(`Could not load order items: ${error.message}`, "error");
            setSelectedOrder(prev => ({
                ...prev,
                items: []
            }));
        }
    };

    const handleUpdateStatus = (order, newStatus) => {
        setSelectedOrder(order);
        setStatusUpdateNotes('');
        
        if (newStatus === 'refunded') {
            setRefundAmount(order.total_amount.toString());
            setRefundReason('');
            setModalType('refund');
            setIsModalOpen(true);
        } else {
            setModalType(`update-status-${newStatus}`);
            setIsModalOpen(true);
        }
    };

    const handleConfirmStatusUpdate = async (newStatus) => {
        if (!selectedOrder) return;
        
        try {
            const response = await fetch(`/api/orders/${selectedOrder.order_id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    notes: statusUpdateNotes,
                    admin_id: user.id  
                }),
            });
            
            if (response.ok) {
                await fetchRecentOrders(); 
                setIsModalOpen(false);
                setStatusUpdateNotes('');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handlePrintInvoice = (order) => {
        const printWindow = window.open('', '_blank');
        const invoiceHTML = generateInvoiceHTML(order);
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.print();
    };

    const handlePrintPackingSlip = (order) => {
        const printWindow = window.open('', '_blank');
        const packingSlipHTML = generatePackingSlipHTML(order);
        printWindow.document.write(packingSlipHTML);
        printWindow.document.close();
        printWindow.print();
    };

    const handleRefund = (order) => {
        setSelectedOrder(order);
        setRefundAmount(order.total_amount.toString());
        setRefundReason('');
        setStatusUpdateNotes('');
        setModalType('refund');
        setIsModalOpen(true);
    };

    const handleConfirmRefund = async () => {
        if (!selectedOrder || !refundAmount || !refundReason) {
            showToast('Please fill in all refund details', 'error');
            return;
        }
        
        try {
            const refundData = {
                amount: parseFloat(refundAmount),
                reason: refundReason,
                notes: statusUpdateNotes
            };
            
            const success = await processRefund(selectedOrder.order_id, refundData);
            if (success) {
                await fetchRecentOrders(); // Refresh the orders list
                setIsModalOpen(false);
                setRefundAmount('');
                setRefundReason('');
                setStatusUpdateNotes('');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
        }
    };

    const generateInvoiceHTML = (order) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - Order #${order.order_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .order-info { margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f2f2f2; }
                    .total { font-weight: bold; text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SeraphimLuxe</h1>
                    <h2>INVOICE</h2>
                </div>
                <div class="order-info">
                    <p><strong>Order Number:</strong> ${order.order_number || order.order_id}</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                    <p><strong>Customer:</strong> ${order.first_name} ${order.last_name}</p>
                    <p><strong>Email:</strong> ${order.email}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items ? order.items.map(item => `
                            <tr>
                                <td>${item.label}</td>
                                <td>${item.quantity}</td>
                                <td>₱${parseFloat(item.price).toFixed(2)}</td>
                                <td>₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">No items found</td></tr>'}
                    </tbody>
                </table>
                <div class="total">
                    <p><strong>Total Amount: ₱${parseFloat(order.total_amount).toFixed(2)}</strong></p>
                </div>
            </body>
            </html>
        `;
    };

    const generatePackingSlipHTML = (order) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Packing Slip - Order #${order.order_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .order-info { margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MOTOSWIFT</h1>
                    <h2>PACKING SLIP</h2>
                </div>
                <div class="order-info">
                    <p><strong>Order Number:</strong> ${order.order_number || order.order_id}</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                    <p><strong>Ship To:</strong> ${order.first_name} ${order.last_name}</p>
                    <p><strong>Address:</strong> ${order.shipping_address || 'N/A'}</p>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items ? order.items.map(item => `
                            <tr>
                                <td>${item.label}</td>
                                <td>${item.quantity}</td>
                                <td></td>
                            </tr>
                        `).join('') : '<tr><td colspan="3">No items found</td></tr>'}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    };

    if (loading) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['section']}>
                    <div className={styles['empty-table']}>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading orders...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['wrapper']}>
            <div className={styles['section']}>
                <h2>Overview</h2>
                <div className={styles['overview']}>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Pending Orders</h3>
                        </div>
                        <h2>{recentOrders?.filter(o => o.status === 'pending').length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Processing Orders</h3>
                        </div>
                        <h2>{recentOrders?.filter(o => o.status === 'processing').length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Shipped Orders</h3>
                        </div>
                        <h2>{recentOrders?.filter(o => o.status === 'shipped').length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Delivered Orders</h3>
                        </div>
                        <h2>{recentOrders?.filter(o => o.status === 'delivered').length || 0}</h2>
                    </div>
                </div>
            </div>
            
            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Orders</h2>
                </div>
                
                <TableHeader
                    tableName="orders"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedOrders.length} out of ${filteredOrders.length} orders`}
                    sortLabel={querySort}
                    searchValue={searchInput}
                    sortOptions={sortOptions}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearch}
                />
                
                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                            <h3>order_number</h3>
                            <h3>customer_name</h3>
                            <h3>email</h3>
                            <h3>status</h3>
                            <h3>total_amount</h3>
                            <h3>order_date</h3>
                            <h3>modified_at</h3>
                            <h3>actions</h3>
                        </div>
                        
                        {!recentOrders ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedOrders.length > 0 ? (
                            paginatedOrders.map(order => (
                                <div 
                                    key={order.order_id} 
                                    className={styles['table-rows']} 
                                    style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>
                                        {order.order_number || `ORD-${order.order_id}`}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {order.first_name} {order.last_name}
                                    </div>
                                    <div className={styles['table-cell']}>{order.email}</div>
                                    <div className={styles['table-cell']}>
                                        <span className={styles[`status-${order.status}`]}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className={styles['table-cell']}>
                                        ₱{parseFloat(order.total_amount).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(order.modified_at || order.created_at).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-eye"
                                            action={() => handleViewOrder(order)}
                                        />
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-print"
                                            action={() => handlePrintInvoice(order)}
                                        />
                                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                                            <Button
                                                type="icon"
                                                icon="fa-solid fa-undo"
                                                action={() => handleRefund(order)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['empty-table']}>
                                {querySearch ? (
                                    <div className={styles['empty']}>
                                        <h3>No orders found matching "{querySearch}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={handleClearSearch}
                                        />
                                    </div>
                                ) : (
                                    <p>No orders found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <TableFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedOrders.length} out of ${filteredOrders.length} orders`}
                    sortLabel={querySort}
                    onPageChange={handlePageChange}
                />
            </div>

            <Modal
                label="Order Details"
                isOpen={isModalOpen && modalType === 'view'}
                onClose={() => setIsModalOpen(false)}
            >
                {selectedOrder && (
                    <>
                        <div className={styles['modal-infos']}>
                            <h3>Order #{selectedOrder.order_number || selectedOrder.order_id}</h3>
                            <div className={styles['order-details-grid']}>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Customer:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.first_name} {selectedOrder.last_name}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Email:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.email}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Status:</span>
                                    <span className={`${styles['detail-value']} ${styles[`status-${selectedOrder.status}`]}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Order Date:</span>
                                    <span className={styles['detail-value']}>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Total Amount:</span>
                                    <span className={styles['detail-value detail-total']}>₱{parseFloat(selectedOrder.total_amount).toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Shipping Address:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.shipping_address || 'N/A'}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Payment Method:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.payment_method || 'N/A'}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Notes:</span>
                                    <span className={styles['detail-value']}>{selectedOrder.notes || 'None'}</span>
                                </div>
                                {selectedOrder.admin_notes && (
                                    <div className={styles['detail-item']} style={{ gridColumn: '1 / -1' }}>
                                        <span className={styles['detail-label']}>Admin Notes:</span>
                                        <span className={styles['detail-value']}>{selectedOrder.admin_notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className={styles['divider']}></div>
                        
                        <div className={styles['order-items-section']}>
                            <h3>Order Items</h3>
                            {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                <div className={styles['order-items-container']}>
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className={styles['order-item-card']}>
                                            <div className={styles['item-image']}>
                                                <img 
                                                    src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                                    alt={item.label}
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-image.jpg';
                                                    }}
                                                />
                                            </div>
                                            <div className={styles['item-details']}>
                                                <h4 className={styles['item-name']}>{item.label}</h4>
                                                <div className={styles['item-info']}>
                                                    <div className={styles['item-price']}>
                                                        <span className={styles['info-label']}>Price:</span>
                                                        <span className={styles['info-value']}>₱{parseFloat(item.price).toLocaleString('en-PH', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}</span>
                                                    </div>
                                                    <div className={styles['item-quantity']}>
                                                        <span className={styles['info-label']}>Qty:</span>
                                                        <span className={styles['info-value']}>{item.quantity}</span>
                                                    </div>
                                                    <div className={styles['item-subtotal']}>
                                                        <span className={styles['info-label']}>Subtotal:</span>
                                                        <span className={styles['info-value info-total']}>₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-PH', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles['loading-items']}>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Loading order items...</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles['modal-ctas']}>
                            <Button
                                type="secondary"
                                label="Close"
                                action={() => setIsModalOpen(false)}
                            />
                            <Button
                                type="secondary"
                                label="Print Invoice"
                                action={() => handlePrintInvoice(selectedOrder)}
                            />
                            <Button
                                type="secondary"
                                label="Print Packing Slip"
                                action={() => handlePrintPackingSlip(selectedOrder)}
                            />
                            
                            {/* Add Refund Button for delivered/cancelled orders */}
                            {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                                <Button
                                    type="primary"
                                    label="Process Refund"
                                    action={() => {
                                        setIsModalOpen(false);
                                        handleRefund(selectedOrder);
                                    }}
                                    externalStyles={styles['modal-warn']}
                                />
                            )}
                            
                            {/* Status Update Buttons */}
                            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded' && (
                                <div className={styles['status-buttons']}>
                                    {orderStatuses
                                        .filter(status => status !== selectedOrder.status)
                                        .map(status => (
                                            <Button
                                                key={status}
                                                type="primary"
                                                label={`Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                                                action={() => {
                                                    setIsModalOpen(false);
                                                    handleUpdateStatus(selectedOrder, status);
                                                }}
                                            />
                                        ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Modal>


            {orderStatuses.map(status => (
                <Modal
                    key={status}
                    label={`Update Order Status to ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                    isOpen={isModalOpen && modalType === `update-status-${status}`}
                    onClose={() => setIsModalOpen(false)}
                >
                    {selectedOrder && (
                        <>
                            <p className={styles['modal-info']}>
                                Are you sure you want to update{' '}
                                <strong>Order #{selectedOrder.order_number || selectedOrder.order_id}</strong> status to{' '}
                                <strong>{status}</strong>?
                            </p>
                            
                            <div className={styles['inputs-container']}>
                                <div className={styles['input-wrapper']}>
                                    <label>Add Notes (Optional)</label>
                                    <textarea
                                        value={statusUpdateNotes}
                                        onChange={(e) => setStatusUpdateNotes(e.target.value)}
                                        placeholder="Add any additional notes about this status change..."
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
                                    label="Confirm"
                                    action={() => handleConfirmStatusUpdate(status)}
                                />
                            </div>
                        </>
                    )}
                </Modal>
            ))}

            <Modal
                label="Process Refund"
                isOpen={isModalOpen && modalType === 'refund'}
                onClose={() => setIsModalOpen(false)}
            >
                {selectedOrder && (
                    <>
                        <p className={styles['modal-info']}>
                            Process refund for <strong>Order #{selectedOrder.order_number || selectedOrder.order_id}</strong>
                        </p>
                        
                        <div className={styles['inputs-container']}>
                            <div className={styles['input-wrapper']}>
                                <label>Refund Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className={styles['input-wrapper']}>
                                <label>Refund Reason</label>
                                <select
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                >
                                    <option value="">Select reason</option>
                                    <option value="customer_request">Customer Request</option>
                                    <option value="defective_product">Defective Product</option>
                                    <option value="wrong_item">Wrong Item Sent</option>
                                    <option value="damaged_shipping">Damaged During Shipping</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className={styles['input-wrapper']}>
                                <label>Additional Notes</label>
                                <textarea
                                    value={statusUpdateNotes}
                                    onChange={(e) => setStatusUpdateNotes(e.target.value)}
                                    placeholder="Add any additional notes about this refund..."
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
                                label="Process Refund"
                                action={handleConfirmRefund}
                                externalStyles={styles['modal-warn']}
                            />
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default Orders;