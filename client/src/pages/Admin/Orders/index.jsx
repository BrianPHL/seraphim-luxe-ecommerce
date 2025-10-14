import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Orders.module.css';
import { Button, Modal, TableHeader, TableFooter } from '@components';
import { useOrders, useToast, useAuth } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { ORDER_FILTER_CONFIG } from '@utils';

const ITEMS_PER_PAGE = 10;

const ORDER_STATUS_CHAIN = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned', 'refunded'],
    returned: ['refunded'],
    cancelled: [],
    refunded: []
};

const Orders = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Latest';
    const querySearch = searchParams.get('search') || '';

    const { user } = useAuth();
    
    const { 
        recentOrders, 
        fetchRecentOrders, 
        updateOrderStatus,
        processRefund, 
        getOrderItems, 
        printInvoice,
        printInvoiceReport,
        formatDate,
        loading 
    } = useOrders();

    const { showToast } = useToast();

    const {
        data: filteredOrders,
        searchValue,
        sortValue,
        handleSearchChange,
        handleSortChange,
        sortOptions,
    } = useDataFilter(recentOrders || [], ORDER_FILTER_CONFIG);

    const {
        currentPage,
        totalPages,
        currentItems: paginatedOrders,
        handlePageChange,
        resetPagination,
    } = usePagination(filteredOrders, ITEMS_PER_PAGE, queryPage);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    })

    useEffect(() => {
        if (searchValue !== querySearch) {
            handleSearchChange(querySearch);
        }
    }, [querySearch]);

    useEffect(() => {
        if (sortValue !== querySort) {
            handleSortChange(querySort);
        }
    }, [querySort]);

    useEffect(() => {
        if (currentPage !== queryPage) {
            handlePageChange(queryPage);
        }
    }, [queryPage]);
    
    const paymentMethodLabels = {
        cash_on_delivery: "Cash on Delivery",
        paypal: "Paypal",
        bank_transfer: "Bank Transfer",
        credit_card: "Credit Card"
    };

    useEffect(() => {
        const loadOrders = async () => {
            try {
                if (user && user.role === 'admin') {
                    await fetchRecentOrders();
                }
            } catch (error) {
                showToast("Failed to load orders", "error");
            }
        };
        loadOrders();
    }, [user]);

    const updateSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);
        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);
        setSearchParams(params);
    };

    const handleSearchChangeWrapped = (value) => {
        handleSearchChange(value);
        resetPagination();
        updateSearchParams({ search: value, page: 1 });
    };

    const handleSortChangeWrapped = (sort) => {
        handleSortChange(sort);
        resetPagination();
        updateSearchParams({ sort, page: 1 });
    };

    const handlePageChangeWrapped = (page) => {
        handlePageChange(page);
        updateSearchParams({ page });
    };

    const handleSearch = () => {
        resetPagination();
        updateSearchParams({ search: searchValue, page: 1 });
    };

    const handleClearSearch = () => {
        handleSearchChange('');
        resetPagination();
        updateSearchParams({ search: '', page: 1 });
    };

    const handleViewOrder = async (order) => {
        setSelectedOrder(order);
        setModalType('view');
        setIsModalOpen(true);
        await loadOrderItems(order.id);
    };

    const loadOrderItems = async (orderId) => {
        try {
            const items = await getOrderItems(orderId);
            setSelectedOrder(prev => ({
                ...prev,
                items: items || []
            }));
        } catch (error) {
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
        
        const success = await updateOrderStatus(selectedOrder.id, newStatus, statusUpdateNotes);
        if (success) {
            setIsModalOpen(false);
            setStatusUpdateNotes('');
        }
    };

    const handlePrintInvoice = async (order) => {
        const orderWithItems = await printInvoice(order);
        if (orderWithItems) {
            const printWindow = window.open('', '_blank');
            const invoiceHTML = generateInvoiceHTML(orderWithItems);
            printWindow.document.write(invoiceHTML);
            printWindow.document.close();
            printWindow.print();
        }
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
            const success = await processRefund(selectedOrder.id, refundData);
            if (success) {
                await fetchRecentOrders();
                setIsModalOpen(false);
                setRefundAmount('');
                setRefundReason('');
                setStatusUpdateNotes('');
            }
        } catch (error) {
            showToast('Failed to process refund', 'error');
        }
    };

    const generateInvoiceHTML = (order) => `
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
                <p><strong>Customer:</strong> ${order.last_name} ${order.first_name}</p>
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

    const generatePackingSlipHTML = (order) => `
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
                <h1>SeraphimLuxe</h1>
                <h2>PACKING SLIP</h2>
            </div>
            <div class="order-info">
                <p><strong>Order Number:</strong> ${order.order_number || order.order_id}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Ship To:</strong> ${order.first_name} ${order.last_name}</p>
                <p><strong>Address:</strong> ${ order.shipping_street
                                    ? `${order.shipping_street}, ${order.shipping_city}, ${order.shipping_province}, ${order.shipping_postal_code}`
                                    : 'N/A' }</p>
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

    const orderStatuses = [
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'
    ];

    const getOrdersInDateRange = (startDate, endDate) => {
        if (!recentOrders) return [];
        
        return recentOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && end) {
                return orderDate >= start && orderDate <= end;
            } else if (start) {
                return orderDate >= start;
            } else if (end) {
                return orderDate <= end;
            }
            
            return true; // Return all orders if no date range specified
        });
    };

    const generateCombinedInvoiceHTML = (ordersWithItems, dateRangeText) => {
        const totalRevenue = ordersWithItems.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Order Invoices - ${dateRangeText}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #8B4513;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        color: #8B4513;
                        margin: 0;
                        font-size: 2.5em;
                    }
                    .header h2 {
                        color: #666;
                        margin: 10px 0;
                        font-weight: normal;
                    }
                    .date-range {
                        background: #f5f5f5;
                        padding: 10px;
                        text-align: center;
                        margin-bottom: 30px;
                        border-radius: 5px;
                    }
                    .invoice { 
                        page-break-after: always; 
                        margin-bottom: 40px;
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .invoice:last-child {
                        page-break-after: auto;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 15px;
                    }
                    .order-info {
                        flex: 1;
                    }
                    .order-info h3 {
                        margin: 0;
                        color: #8B4513;
                        font-size: 1.2em;
                    }
                    .status-badge {
                        background: #e8f5e8;
                        color: #2e7d32;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 0.8em;
                        font-weight: bold;
                    }
                    .customer-info {
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    .customer-info h4 {
                        margin: 0 0 10px 0;
                        color: #555;
                    }
                    .table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                    }
                    .table th, .table td { 
                        border: 1px solid #ddd; 
                        padding: 12px 8px; 
                        text-align: left; 
                    }
                    .table th { 
                        background-color: #8B4513; 
                        color: white;
                        font-weight: bold;
                    }
                    .table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .total-section { 
                        text-align: right; 
                        margin-top: 20px;
                        border-top: 2px solid #8B4513;
                        padding-top: 15px;
                    }
                    .total-amount {
                        font-size: 1.2em;
                        font-weight: bold;
                        color: #8B4513;
                    }
                    .summary {
                        background: #f0f8f0;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 30px 0;
                    }
                    .summary h3 {
                        margin: 0 0 15px 0;
                        color: #2e7d32;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                    }
                    .summary-item {
                        text-align: center;
                        padding: 10px;
                        background: white;
                        border-radius: 5px;
                    }
                    .summary-item .value {
                        font-size: 1.5em;
                        font-weight: bold;
                        color: #8B4513;
                    }
                    .summary-item .label {
                        font-size: 0.9em;
                        color: #666;
                        margin-top: 5px;
                    }
                    @media print {
                        body { margin: 0; }
                        .invoice { border: none; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SeraphimLuxe</h1>
                    <h2>Admin Order Invoices Report</h2>
                </div>
                
                <div class="date-range">
                    <strong>Date Range: ${dateRangeText}</strong>
                </div>

                <div class="summary" style="page-break-after: always;">
                    <h3>Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="value">${ordersWithItems.length}</div>
                            <div class="label">Total Orders</div>
                        </div>
                        <div class="summary-item">
                            <div class="value">₱${totalRevenue.toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</div>
                            <div class="label">Total Revenue</div>
                        </div>
                        <div class="summary-item">
                            <div class="value">${ordersWithItems.reduce((sum, order) => 
                                sum + (order.items?.length || 0), 0
                            )}</div>
                            <div class="label">Total Items</div>
                        </div>
                    </div>
                </div>
                
                ${ordersWithItems.map(order => `
                    <div class="invoice">
                        <div class="invoice-header">
                            <div class="order-info">
                                <h3>Order #${order.order_number || order.order_id}</h3>
                                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div class="status-badge">${order.status}</div>
                        </div>
                        
                        <div class="customer-info">
                            <h4>Customer Information</h4>
                            <p><strong>Name:</strong> ${order.first_name} ${order.last_name}</p>
                            <p><strong>Email:</strong> ${order.email}</p>
                            <p><strong>Payment Method:</strong> ${paymentMethodLabels[order.payment_method] || order.payment_method || 'N/A'}</p>
                            <p><strong>Shipping Address:</strong> ${
                                order.shipping_street
                                    ? `${order.shipping_street}, ${order.shipping_city}, ${order.shipping_province}, ${order.shipping_postal_code}`
                                    : 'N/A'
                            }</p>
                        </div>
                        
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items && order.items.length > 0 ? order.items.map(item => `
                                    <tr>
                                        <td>${item.label || 'Unknown Item'}</td>
                                        <td>${item.quantity || 1}</td>
                                        <td>₱${parseFloat(item.price || 0).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</td>
                                        <td>₱${(parseFloat(item.price || 0) * (item.quantity || 1)).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4">No items found</td></tr>'}
                            </tbody>
                        </table>
                        
                        <div class="total-section">
                            <p><strong>Subtotal:</strong> ₱${parseFloat(order.total_amount || 0).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</p>
                            <p><strong>Shipping:</strong> Free</p>
                            <div class="total-amount">
                                <strong>Total: ₱${parseFloat(order.total_amount || 0).toLocaleString('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</strong>
                            </div>
                        </div>
                        
                        ${order.notes ? `
                            <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                                <strong>Order Notes:</strong> ${order.notes}
                            </div>
                        ` : ''}
                        
                        ${order.admin_notes ? `
                            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                                <strong>Admin Notes:</strong> ${order.admin_notes}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </body>
            </html>
        `;
    };

    const handlePrintInvoicesRange = async (startDate, endDate) => {
        const ordersInRange = getOrdersInDateRange(startDate, endDate);
        
        if (ordersInRange.length === 0) {
            showToast('No orders found in the selected date range.', 'info');
            return;
        }

        // Load items for all orders
        const ordersWithItems = await Promise.all(
            ordersInRange.map(async (order) => {
                if (!order.items || order.items.length === 0) {
                    try {
                        const items = await getOrderItems(order.id);
                        return { ...order, items: items || [] };
                    } catch (error) {
                        console.error('Failed to load items for order:', order.id);
                        return { ...order, items: [] };
                    }
                }
                return order;
            })
        );

        const reportResult = await printInvoiceReport(startDate, endDate, ordersWithItems);
        if (reportResult) {
            const { ordersWithItems: processedOrders, dateRangeText } = reportResult;
            
            const combinedHTML = generateCombinedInvoiceHTML(processedOrders, dateRangeText);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(combinedHTML);
            printWindow.document.close();
            printWindow.print();
            
            showToast(`Generated invoice report for ${processedOrders.length} orders`, 'success');
            setShowPrintModal(false);
        }
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
                    <Button
                        type="primary"
                        label="Print Invoice Report"
                        icon="fa-solid fa-print"
                        iconPosition="left"
                        action={() => setShowPrintModal(true)}
                        externalStyles={styles['print-button']}
                    />
                </div>

                <TableHeader
                    currentSort={sortValue}
                    searchInput={searchValue}
                    onSortChange={handleSortChangeWrapped}
                    onSearchChange={handleSearchChangeWrapped}
                    onSearch={handleSearch}
                    sortOptions={sortOptions}
                    withPagination={true}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedOrders.length} out of ${filteredOrders.length} results`}
                    sortLabel={sortValue}
                    onPageChange={handlePageChangeWrapped}
                />

                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                            <h3>Order Number</h3>
                            <h3>Customer Name</h3>
                            <h3>Email</h3>
                            <h3>Status</h3>
                            <h3>Total Amount</h3>
                            <h3>Order Date</h3>
                            <h3>Modified At</h3>
                            <h3>Actions</h3>
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
                                {searchValue ? (
                                    <div className={styles['empty']}>
                                        <h3>No orders found matching "{searchValue}"</h3>
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
                    resultsLabel={`Showing ${paginatedOrders.length} out of ${filteredOrders.length} results`}
                    sortLabel={sortValue}
                    onPageChange={handlePageChangeWrapped}
                />
            </div>

            <Modal
                label="Print Invoice Report"
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                size="medium"
            >
                <div className={styles['print-modal-content']}>
                    <p>Select a date range to print invoices for orders:</p>
                    
                    <div className={styles['date-inputs']}>
                        <div className={styles['date-input-group']}>
                            <label htmlFor="startDate">Start Date:</label>
                            <input
                                type="date"
                                id="startDate"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({
                                    ...prev,
                                    startDate: e.target.value
                                }))}
                                className={styles['date-input']}
                            />
                        </div>
                        
                        <div className={styles['date-input-group']}>
                            <label htmlFor="endDate">End Date:</label>
                            <input
                                type="date"
                                id="endDate"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({
                                    ...prev,
                                    endDate: e.target.value
                                }))}
                                className={styles['date-input']}
                            />
                        </div>
                    </div>
                    
                    <div className={styles['quick-actions']}>
                        <Button
                            type="secondary"
                            label="Today"
                            action={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setDateRange({ startDate: today, endDate: today });
                            }}
                        />
                        <Button
                            type="secondary"
                            label="This Week"
                            action={() => {
                                const today = new Date();
                                const startOfWeek = new Date(today);
                                startOfWeek.setDate(today.getDate() - today.getDay());
                                setDateRange({
                                    startDate: startOfWeek.toISOString().split('T')[0],
                                    endDate: today.toISOString().split('T')[0]
                                });
                            }}
                        />
                        <Button
                            type="secondary"
                            label="This Month"
                            action={() => {
                            const today = new Date();
                            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                            setDateRange({
                                startDate: startOfMonth.toISOString().split('T')[0],
                                endDate: endOfMonth.toISOString().split('T')[0]
                            });
                        }}
                        />
                        <Button
                            type="secondary"
                            label="All Orders"
                            action={() => {
                                setDateRange({ startDate: '', endDate: '' });
                            }}
                        />
                    </div>
                    
                    <div className={styles['preview-info']}>
                        {dateRange.startDate || dateRange.endDate ? (
                            <p>
                                <strong>Orders to print:</strong> {getOrdersInDateRange(dateRange.startDate, dateRange.endDate).length}
                            </p>
                        ) : (
                            <p>
                                <strong>Total orders:</strong> {recentOrders?.length || 0}
                            </p>
                        )}
                    </div>
                    
                    <div className={styles['modal-ctas']}>
                        <Button
                            label="Cancel"
                            type="secondary"
                            action={() => setShowPrintModal(false)}
                        />
                        <Button
                            label="Generate Report"
                            type="primary"
                            icon="fa-solid fa-print"
                            iconPosition="left"
                            action={() => handlePrintInvoicesRange(dateRange.startDate, dateRange.endDate)}
                        />
                    </div>
                </div>
            </Modal>


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
                                    <span className={styles['detail-value-detail-total']}>₱{parseFloat(selectedOrder.total_amount).toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Shipping Address:</span>
                                    <span className={styles['detail-value']}>
                                        {selectedOrder.shipping_street
                                            ? `${selectedOrder.shipping_street}, ${selectedOrder.shipping_city}, ${selectedOrder.shipping_province}, ${selectedOrder.shipping_postal_code}`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Payment Method:</span>
                                    <span className={styles['detail-value']}>
                                        {selectedOrder.payment_method
                                            ? paymentMethodLabels[selectedOrder.payment_method] || selectedOrder.payment_method
                                            : 'N/A'}
                                    </span>
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
                                                        <span className={styles['info-value-info-total']}>₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-PH', {
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
                            <div className={styles['button-group-horizontal']}>
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
                            </div>
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
                                                disabled={ !ORDER_STATUS_CHAIN[selectedOrder.status]?.includes(status) }
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
                                    className={styles['refund-input']}
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
