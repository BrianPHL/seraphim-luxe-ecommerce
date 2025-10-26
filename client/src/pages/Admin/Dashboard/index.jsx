import styles from './Dashboard.module.css';
import { Button } from '@components';
import { useProducts, useAuth, useToast, useStocks, useOrders, useAnalytics } from '@contexts';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {

    const [selectedReportLabel, setSelectedReportLabel] = useState('All Reports');
    const navigate = useNavigate();
    
    const { products } = useProducts();
    const { user, userCount, fetchUserCount } = useAuth();
    const { showToast } = useToast();
    const { lowStockProducts } = useStocks();
    const { fetchRecentOrders, recentOrders } = useOrders();

    const {
        chartType,
        setChartType,
        selectedReports,
        setSelectedReports,
        chartOptions,
        shouldShowReport,
        salesTrendData,
        orderStatusData,
        userRegistrationsData,
        stockLevelsData,
        generateAnalyticsData,
        generateAccountsAnalyticsData,
        generateStocksAnalyticsData
    } = useAnalytics();


    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;
            try {

                await Promise.all([
                    fetchUserCount(),
                    fetchRecentOrders()
                ]);

            } catch (error) {
                console.error("Error loading dashboard data:", error);
                showToast("Failed to load dashboard data", "error");
            }
        };

        loadDashboardData();
    }, [user, fetchUserCount, fetchRecentOrders, showToast]);

    useEffect(() => {
        generateAnalyticsData();
    }, [generateAnalyticsData]);

    useEffect(() => {
        generateAccountsAnalyticsData();
    }, [generateAccountsAnalyticsData]);

    useEffect(() => {
        generateStocksAnalyticsData();
    }, [generateStocksAnalyticsData]);

    return (
        <>
            <div className={styles['wrapper']}>

                <div className={styles['section']}>

                    <h2>Overview</h2>

                    <div className={styles['overview']}>

                        <div className={styles['overview-item']}>
                            <div className={styles['overview-item-header']}>
                                <h3>Products</h3>
                                <Button
                                    type='icon'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={() => navigate('/admin/products')}
                                />
                            </div>
                            <h2>{products?.length || 0}</h2>
                        </div>
                        <div className={styles['overview-item']}>
                            <div className={styles['overview-item-header']}>
                                <h3>Accounts</h3>
                                <Button
                                    type='icon'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={() => navigate('/admin/accounts')}
                                />
                            </div>
                            <h2>{userCount}</h2>
                        </div>
                        <div className={styles['overview-item']}>
                            <div className={styles['overview-item-header']}>
                                <h3>Orders</h3>
                                <Button
                                    type='icon'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={() => navigate('/admin/orders')}
                                />
                            </div>
                            <h2>{recentOrders.length || 0}</h2>
                        </div>
                        <div className={styles['overview-item']}>
                            <div className={styles['overview-item-header']}>
                                <h3>Low Stock Alerts</h3>
                                <Button
                                    type='icon'
                                    icon='fa-solid fa-square-arrow-up-right'
                                    action={() => navigate('/admin/stocks')}
                                />
                            </div>
                            <h2>{lowStockProducts['length'] || 0}</h2>
                        </div>
                    </div>
                </div>

                <div className={styles['divider']}></div>

                <div className={styles['section']}>
                    <div className={styles['section-header']}>
                        <h2>Analytics & Reports</h2>
                        <div className={styles['chart-controls']}>
                            <Button
                                id='analytics-report-dropdown'
                                type='secondary'
                                label={`Report: ${selectedReportLabel}`}
                                icon='fa-solid fa-chart-column'
                                dropdownPosition='right'
                                options={[
                                    {
                                        label: 'All Reports',
                                        action: () => {
                                            setSelectedReports(['all']);
                                            setSelectedReportLabel('All Reports');
                                        }
                                    },
                                    {
                                        label: 'Sales & Revenue',
                                        action: () => {
                                            setSelectedReports(['sales']);
                                            setSelectedReportLabel('Sales & Revenue');
                                        }
                                    },
                                    {
                                        label: 'Orders & Status',
                                        action: () => {
                                            setSelectedReports(['orders']);
                                            setSelectedReportLabel('Orders & Status');
                                        }
                                    },
                                    {
                                        label: 'User Analytics',
                                        action: () => {
                                            setSelectedReports(['accounts']);
                                            setSelectedReportLabel('User Analytics');
                                        }
                                    },
                                    {
                                        label: 'Stock Management',
                                        action: () => {
                                            setSelectedReports(['stocks']);
                                            setSelectedReportLabel('Stock Management');
                                        }
                                    },
                                ]}
                            />
                            <Button
                                type='secondary'
                                label={`Chart Type: ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`}
                                icon='fa-solid fa-chart-line'
                                disabled={true}
                            />
                        </div>
                    </div>

                    <div className={styles['analytics-container']}>
                        
                        {shouldShowReport('sales') && (
                            <div className={styles['analytics-card']}>
                                <div className={styles['analytics-card-header']}>
                                    <h3>Sales Trend (Last 7 Days)</h3>
                                </div>
                                <div className={styles['chart-container']}>
                                    <Line data={salesTrendData && salesTrendData.labels ? salesTrendData : { labels: [], datasets: [] }} options={chartOptions} />
                                </div>
                            </div>
                        )}

                        {shouldShowReport('orders') && (
                            <div className={styles['analytics-card']}>
                                <div className={styles['analytics-card-header']}>
                                    <h3>Order Status Timeline</h3>
                                </div>
                                <div className={styles['chart-container']}>
                                    <Line data={orderStatusData && orderStatusData.labels ? orderStatusData : { labels: [], datasets: [] }} options={chartOptions} />
                                </div>
                            </div>
                        )}

                        {shouldShowReport('accounts') && (
                            <div className={styles['analytics-card']}>
                                <div className={styles['analytics-card-header']}>
                                    <h3>User Registrations (Last 7 Days)</h3>
                                </div>
                                <div className={styles['chart-container']}>
                                    <Line data={userRegistrationsData && userRegistrationsData.labels ? userRegistrationsData : { labels: [], datasets: [] }} options={chartOptions} />
                                </div>
                            </div>
                        )}

                        {shouldShowReport('stocks') && (
                            <div className={styles['analytics-card']}>
                                <div className={styles['analytics-card-header']}>
                                    <h3>Stock Level Trends</h3>
                                </div>
                                <div className={styles['chart-container']}>
                                    <Line data={stockLevelsData && stockLevelsData.labels ? stockLevelsData : { labels: [], datasets: [] }} options={chartOptions} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles['divider']}></div>

                <div className={styles['section']}>
                    <div className={styles['section-header']}>
                        <h2>Stock Alerts</h2>
                        <Button
                            type='primary'
                            label='Manage low stock alerts'
                            icon='fa-solid fa-arrow-right'
                            iconPosition='right'
                            action={() => navigate('/admin/stocks')}
                        />
                    </div>
                    <div className={styles['table']}>
                        <div className={styles['table-wrapper']}>
                            <div className={` ${styles['table-header']} ${styles['stock-alerts']} `}>
                                <h3></h3>
                                <h3>product_id</h3>
                                <h3>label</h3>
                                <h3>category</h3>
                                <h3>stock_quantity</h3>
                                <h3>stock_threshold</h3>
                                <h3>modified_at</h3>
                            </div>
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.map(product => (
                                    <div key={product.product_id} className={`${styles['table-rows']} ${styles['stock-alerts']}`}>
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
                                            {product.modified_at}
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

            </div>
        </>
    );
};

export default Dashboard;
