import { useContext, useState, useCallback, useRef, useMemo } from 'react';
import AnalyticsContext from './context';

export const AnalyticsProvider = ({ children }) => {

    const [chartType, setChartType] = useState('line');
    const [selectedReports, setSelectedReports] = useState(['all']);

    const [analyticsData, setAnalyticsData] = useState({

        salesTrend: [],
        orderStatus: [],
        stockLevels: [],
        userRegistrations: [],
        accountTypes: [],
        accountStatus: [],
        stockLevelTrends: [],
        categoryStock: [],
        reorderAnalysis: [],
        todaySales: [],
        dailySales: [],
        monthlyRevenue: [],
        paymentMethods: [],
        productSalesData: {}

    });

    const dataInitialized = useRef({
        dashboard: false,
        accounts: false,
        stocks: false,
        orders: false,
        products: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    }), []);

    const colorPalettes = useMemo(() => ({
        primary: {
            main: '#a67c52',
            light: 'rgba(166, 124, 82, 0.2)',
            dark: '#8b6441',
            lighter: 'rgba(166, 124, 82, 0.1)'
        },
        status: {
            completed: '#4CAF50',
            processing: '#FF9800',
            shipped: '#2196F3',
            cancelled: '#F44336',
            delivered: '#4CAF50',
            pending: '#FFC107',
            returned: '#9C27B0',
            refunded: '#607D8B'
        },
        stock: {
            inStock: '#4CAF50',
            lowStock: '#FF9800',
            outOfStock: '#F44336'
        },
        user: {
            newUsers: '#2196F3',
            totalUsers: '#4CAF50'
        }
    }), []);

    const formatDateLabel = useCallback((dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const shouldShowReport = useCallback((reportType) => {
        return selectedReports.includes('all') || selectedReports.includes(reportType);
    }, [selectedReports]);

    const fetchDashboardAnalytics = useCallback(async (days = 7) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/analytics/dashboard?days=${days}`);
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard analytics');
            }

            const result = await response.json();
            if (result.success) {
                const { salesTrend, orderStatus } = result.data;

                setAnalyticsData(prevData => ({
                    ...prevData,
                    salesTrend: salesTrend.map(item => ({
                        date: item.date,
                        sales: parseFloat(item.sales) || 0,
                    })),
                    orderStatus: orderStatus.map(item => ({
                        date: item.date,
                        completed: parseInt(item.completed) || 0,
                        processing: parseInt(item.processing) || 0,
                        shipped: parseInt(item.shipped) || 0,
                        cancelled: parseInt(item.cancelled) || 0,
                    })),
                }));
            } else {
                setAnalyticsData(prevData => ({
                    ...prevData,
                    salesTrend: [],
                    orderStatus: [],
                }));
            }
        } catch (err) {
            console.error('Dashboard analytics API error:', err);
            setError(err.message);
            setAnalyticsData(prevData => ({
                ...prevData,
                salesTrend: [],
                orderStatus: [],
            }));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchOrdersAnalytics = useCallback(async (days = 7) => {
        if (dataInitialized.current.orders) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`/api/analytics/orders?days=${days}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch orders analytics');
            }
            
            const result = await response.json();
            
            if (result.success) {
                const { todaySales, dailySales, monthlyRevenue, paymentMethods } = result.data;
                
                setAnalyticsData(prevData => ({
                    ...prevData,
                    todaySales: todaySales.map(item => ({
                        hour: `${item.hour.toString().padStart(2, '0')}:00`,
                        sales: parseFloat(item.sales) || 0,
                        orders: parseInt(item.orders) || 0
                    })),
                    dailySales: dailySales.map(item => ({
                        date: item.date,
                        sales: parseFloat(item.sales) || 0,
                        orders: parseInt(item.orders) || 0
                    })),
                    monthlyRevenue: monthlyRevenue.map(item => ({
                        month: item.month,
                        revenue: parseFloat(item.revenue) || 0,
                        orders: parseInt(item.orders) || 0
                    })),
                    paymentMethods: paymentMethods.map(item => ({
                        date: item.date,
                        cash_on_delivery: parseInt(item.cash_on_delivery) || 0,
                        paypal: parseInt(item.paypal) || 0,
                        bank_transfer: parseInt(item.bank_transfer) || 0,
                        credit_card: parseInt(item.credit_card) || 0
                    }))
                }));
                
                dataInitialized.current.orders = true;
            }
        } catch (err) {
            console.error('Orders analytics API error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchAccountsAnalytics = useCallback(async (days = 7) => {
        if (dataInitialized.current.accounts) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`/api/analytics/accounts?days=${days}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch accounts analytics');
            }
            
            const result = await response.json();
            
            if (result.success) {
                const { userRegistrations, accountTypes, accountStatus } = result.data;
                
                setAnalyticsData(prevData => ({
                    ...prevData,
                    userRegistrations: userRegistrations.map(item => ({
                        date: item.date,
                        customers: parseInt(item.customers) || 0,
                        admins: parseInt(item.admins) || 0
                    })),
                    accountTypes: accountTypes.map(item => ({
                        type: item.role,
                        count: parseInt(item.count) || 0
                    })),
                    accountStatus: accountStatus.map(item => ({
                        date: item.date,
                        active: parseInt(item.active) || 0,
                        suspended: parseInt(item.suspended) || 0
                    }))
                }));
                
                dataInitialized.current.accounts = true;
            }
        } catch (err) {
            console.error('Accounts analytics API error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchStocksAnalytics = useCallback(async (days = 7) => {
        if (dataInitialized.current.stocks) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`/api/analytics/stocks?days=${days}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stocks analytics');
            }
            
            const result = await response.json();
            
            if (result.success) {
                const { categoryStock, reorderAnalysis, stockLevelTrends } = result.data;
                
                setAnalyticsData(prevData => ({
                    ...prevData,
                    categoryStock: categoryStock.map(item => ({
                        category: item.category,
                        inStock: parseInt(item.inStock) || 0,
                        lowStock: parseInt(item.lowStock) || 0,
                        outOfStock: parseInt(item.outOfStock) || 0
                    })),
                    reorderAnalysis: reorderAnalysis.map(item => ({
                        month: item.month,
                        reordersSuggested: parseInt(item.reordersSuggested) || 0,
                        reordersCompleted: parseInt(item.reordersCompleted) || 0
                    })),
                    stockLevelTrends: stockLevelTrends ? stockLevelTrends.map(item => ({
                        date: item.date,
                        inStock: parseInt(item.inStock) || 0,
                        lowStock: parseInt(item.lowStock) || 0,
                        outOfStock: parseInt(item.outOfStock) || 0
                    })) : []
                }));
                
                dataInitialized.current.stocks = true;
            }
        } catch (err) {
            console.error('Stocks analytics API error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchProductAnalytics = useCallback(async (productId, days = null) => {
        try {
            setIsLoading(true);
            setError(null);

            const url = days 
                ? `/api/analytics/products/${productId}?days=${days}`
                : `/api/analytics/products/${productId}`;
        
            const response = await fetch(url, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch product analytics');
            }
            
            const result = await response.json();
            
            if (result.success) {
                const chartData = {
                    labels: result.data.map(item => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
                    }),
                    datasets: [
                        {
                            label: 'Sales (₱)',
                            data: result.data.map(item => parseFloat(item.sales) || 0),
                            borderColor: colorPalettes.primary.main,
                            backgroundColor: colorPalettes.primary.light,
                            borderWidth: 2,
                            fill: true,
                        },
                        {
                            label: 'Orders',
                            data: result.data.map(item => parseInt(item.orders) || 0),
                            borderColor: colorPalettes.primary.dark,
                            backgroundColor: colorPalettes.primary.lighter,
                            borderWidth: 2,
                            fill: true,
                        }
                    ]
                };
                
                setProductAnalyticsData(productId, chartData);
                return chartData;
            }
        } catch (err) {
            console.error('Product analytics API error:', err);
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [colorPalettes]);

    const generateAnalyticsData = useCallback(() => {
        return fetchDashboardAnalytics();
    }, [fetchDashboardAnalytics]);

    const generateAccountsAnalyticsData = useCallback(() => {
        return fetchAccountsAnalytics();
    }, [fetchAccountsAnalytics]);

    const generateStocksAnalyticsData = useCallback(() => {
        return fetchStocksAnalytics();
    }, [fetchStocksAnalytics]);

    const generateOrdersAnalyticsData = useCallback(() => {
        return fetchOrdersAnalytics();
    }, [fetchOrdersAnalytics]);

    const setProductAnalyticsData = useCallback((productId, data) => {
        setAnalyticsData(prevData => ({
            ...prevData,
            productSalesData: {
                ...prevData.productSalesData,
                [productId]: data
            }
        }));
    }, []);

    const getProductAnalyticsData = useCallback((productId) => {
        return analyticsData.productSalesData[productId] || null;
    }, [analyticsData.productSalesData]);

    const salesTrendData = useMemo(() => {
        if (!analyticsData.salesTrend || analyticsData.salesTrend.length === 0) {
            return { labels: [], datasets: [] };
        }

        return {
            labels: analyticsData.salesTrend.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'Sales (₱)',
                    data: analyticsData.salesTrend.map(item => item.sales),
                    borderColor: colorPalettes.primary.main,
                    backgroundColor: colorPalettes.primary.light,
                    borderWidth: 2,
                    fill: true,
                },
            ],
        };
    }, [analyticsData.salesTrend, formatDateLabel, colorPalettes.primary]);

    const orderStatusData = useMemo(() => {
        if (!analyticsData.orderStatus || analyticsData.orderStatus.length === 0) {
            return { labels: [], datasets: [] };
        }

        return {
            labels: analyticsData.orderStatus.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'Completed',
                    data: analyticsData.orderStatus.map(item => item.completed),
                    borderColor: colorPalettes.status.completed,
                    backgroundColor: `${colorPalettes.status.completed}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Processing',
                    data: analyticsData.orderStatus.map(item => item.processing),
                    borderColor: colorPalettes.status.processing,
                    backgroundColor: `${colorPalettes.status.processing}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Shipped',
                    data: analyticsData.orderStatus.map(item => item.shipped),
                    borderColor: colorPalettes.status.shipped,
                    backgroundColor: `${colorPalettes.status.shipped}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Cancelled',
                    data: analyticsData.orderStatus.map(item => item.cancelled),
                    borderColor: colorPalettes.status.cancelled,
                    backgroundColor: `${colorPalettes.status.cancelled}20`,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.orderStatus, formatDateLabel, colorPalettes.status]);

    const todaySalesData = useMemo(() => {
        if (analyticsData.todaySales.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.todaySales.map(item => item.hour),
            datasets: [
                {
                    label: 'Sales (₱)',
                    data: analyticsData.todaySales.map(item => item.sales),
                    borderColor: colorPalettes.primary.main,
                    backgroundColor: colorPalettes.primary.light,
                    borderWidth: 2,
                    fill: true,
                },
                {
                    label: 'Orders',
                    data: analyticsData.todaySales.map(item => item.orders),
                    borderColor: colorPalettes.primary.dark,
                    backgroundColor: colorPalettes.primary.lighter,
                    borderWidth: 2,
                    fill: true,
                },
            ],
        };
    }, [analyticsData.todaySales, colorPalettes.primary]);

    const dailySalesData = useMemo(() => {
        if (analyticsData.dailySales.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.dailySales.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'Sales (₱)',
                    data: analyticsData.dailySales.map(item => item.sales),
                    borderColor: colorPalettes.primary.main,
                    backgroundColor: colorPalettes.primary.light,
                    borderWidth: 2,
                    fill: true,
                },
                {
                    label: 'Orders',
                    data: analyticsData.dailySales.map(item => item.orders),
                    borderColor: colorPalettes.primary.dark,
                    backgroundColor: colorPalettes.primary.lighter,
                    borderWidth: 2,
                    fill: true,
                },
            ],
        };
    }, [analyticsData.dailySales, formatDateLabel, colorPalettes.primary]);

    const monthlyRevenueData = useMemo(() => {
        if (analyticsData.monthlyRevenue.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.monthlyRevenue.map(item => item.month),
            datasets: [
                {
                    label: 'Revenue (₱)',
                    data: analyticsData.monthlyRevenue.map(item => item.revenue),
                    borderColor: colorPalettes.primary.main,
                    backgroundColor: colorPalettes.primary.light,
                    borderWidth: 2,
                    fill: true,
                },
            ],
        };
    }, [analyticsData.monthlyRevenue, colorPalettes.primary]);

    const stockLevelsData = useMemo(() => {
        if (analyticsData.stockLevelTrends.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.stockLevelTrends.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'In Stock',
                    data: analyticsData.stockLevelTrends.map(item => item.inStock),
                    borderColor: colorPalettes.stock.inStock,
                    backgroundColor: `${colorPalettes.stock.inStock}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Low Stock',
                    data: analyticsData.stockLevelTrends.map(item => item.lowStock),
                    borderColor: colorPalettes.stock.lowStock,
                    backgroundColor: `${colorPalettes.stock.lowStock}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Out of Stock',
                    data: analyticsData.stockLevelTrends.map(item => item.outOfStock),
                    borderColor: colorPalettes.stock.outOfStock,
                    backgroundColor: `${colorPalettes.stock.outOfStock}20`,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.stockLevelTrends, formatDateLabel, colorPalettes.stock]);

    const userRegistrationsData = useMemo(() => {
        if (analyticsData.userRegistrations.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.userRegistrations.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'Customers',
                    data: analyticsData.userRegistrations.map(item => item.customers),
                    borderColor: colorPalettes.user.newUsers,
                    backgroundColor: `${colorPalettes.user.newUsers}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Admins',
                    data: analyticsData.userRegistrations.map(item => item.admins),
                    borderColor: colorPalettes.user.totalUsers,
                    backgroundColor: `${colorPalettes.user.totalUsers}20`,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.userRegistrations, formatDateLabel, colorPalettes.user]);

    const stockLevelTrendsData = useMemo(() => stockLevelsData, [stockLevelsData]);
    
    const categoryStockData = useMemo(() => {
        if (analyticsData.categoryStock.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.categoryStock.map(item => item.category),
            datasets: [
                {
                    label: 'In Stock',
                    data: analyticsData.categoryStock.map(item => item.inStock),
                    borderColor: colorPalettes.stock.inStock,
                    backgroundColor: `${colorPalettes.stock.inStock}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Low Stock',
                    data: analyticsData.categoryStock.map(item => item.lowStock),
                    borderColor: colorPalettes.stock.lowStock,
                    backgroundColor: `${colorPalettes.stock.lowStock}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Out of Stock',
                    data: analyticsData.categoryStock.map(item => item.outOfStock),
                    borderColor: colorPalettes.stock.outOfStock,
                    backgroundColor: `${colorPalettes.stock.outOfStock}20`,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.categoryStock, colorPalettes.stock]);

    const reorderAnalysisData = useMemo(() => {
        if (analyticsData.reorderAnalysis.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.reorderAnalysis.map(item => item.month),
            datasets: [
                {
                    label: 'Reorders Suggested',
                    data: analyticsData.reorderAnalysis.map(item => item.reordersSuggested),
                    borderColor: colorPalettes.primary.main,
                    backgroundColor: colorPalettes.primary.light,
                    borderWidth: 2,
                },
                {
                    label: 'Reorders Completed',
                    data: analyticsData.reorderAnalysis.map(item => item.reordersCompleted),
                    borderColor: colorPalettes.primary.dark,
                    backgroundColor: colorPalettes.primary.lighter,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.reorderAnalysis, colorPalettes.primary]);

    const accountTypesData = useMemo(() => {
        if (analyticsData.accountTypes.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.accountTypes.map(item => item.type),
            datasets: [
                {
                    label: 'Account Count',
                    data: analyticsData.accountTypes.map(item => item.count),
                    borderColor: colorPalettes.primary.main,
                    backgroundColor: colorPalettes.primary.light,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.accountTypes, colorPalettes.primary]);

    const accountStatusAnalyticsData = useMemo(() => {
        if (analyticsData.accountStatus.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.accountStatus.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'Active',
                    data: analyticsData.accountStatus.map(item => item.active),
                    borderColor: colorPalettes.user.totalUsers,
                    backgroundColor: `${colorPalettes.user.totalUsers}20`,
                    borderWidth: 2,
                },
                {
                    label: 'Suspended',
                    data: analyticsData.accountStatus.map(item => item.suspended),
                    borderColor: colorPalettes.status.cancelled,
                    backgroundColor: `${colorPalettes.status.cancelled}20`,
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.accountStatus, formatDateLabel, colorPalettes]);

    const paymentMethodsData = useMemo(() => {
        if (analyticsData.paymentMethods.length === 0) return { labels: [], datasets: [] };
        
        return {
            labels: analyticsData.paymentMethods.map(item => formatDateLabel(item.date)),
            datasets: [
                {
                    label: 'Cash on Delivery',
                    data: analyticsData.paymentMethods.map(item => item.cash_on_delivery),
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    borderWidth: 2,
                },
                {
                    label: 'PayPal',
                    data: analyticsData.paymentMethods.map(item => item.paypal),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    borderWidth: 2,
                },
                {
                    label: 'Bank Transfer',
                    data: analyticsData.paymentMethods.map(item => item.bank_transfer),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderWidth: 2,
                },
                {
                    label: 'Credit Card',
                    data: analyticsData.paymentMethods.map(item => item.credit_card),
                    borderColor: '#9C27B0',
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderWidth: 2,
                },
            ],
        };
    }, [analyticsData.paymentMethods, formatDateLabel]);

    const contextValue = useMemo(() => ({

        chartType,
        setChartType,
        selectedReports,
        setSelectedReports,
        analyticsData,
        isLoading,
        error,
        chartOptions,
        shouldShowReport,
        generateAnalyticsData,
        generateAccountsAnalyticsData,
        generateStocksAnalyticsData,
        generateOrdersAnalyticsData,
        fetchProductAnalytics,
        
        // Chart data objects
        salesTrendData,
        orderStatusData,
        todaySalesData,
        dailySalesData,
        monthlyRevenueData,
        stockLevelsData,
        userRegistrationsData,
        stockLevelTrendsData,
        categoryStockData,
        reorderAnalysisData,
        accountTypesData,
        accountStatusAnalyticsData,
        paymentMethodsData,
        setProductAnalyticsData,
        getProductAnalyticsData,

    }), [

        chartType,
        selectedReports,
        analyticsData,
        isLoading,
        error,
        chartOptions,
        shouldShowReport,
        generateAnalyticsData,
        generateAccountsAnalyticsData,
        generateStocksAnalyticsData,
        generateOrdersAnalyticsData,
        fetchProductAnalytics,
        salesTrendData,
        orderStatusData,
        todaySalesData,
        dailySalesData,
        monthlyRevenueData,
        stockLevelsData,
        userRegistrationsData,
        stockLevelTrendsData,
        categoryStockData,
        reorderAnalysisData,
        accountTypesData,
        accountStatusAnalyticsData,
        setProductAnalyticsData,
        getProductAnalyticsData,
        paymentMethodsData,
        
    ]);

    return (
        <AnalyticsContext.Provider value={contextValue}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => useContext(AnalyticsContext);
