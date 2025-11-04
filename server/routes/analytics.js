import express from 'express';
import pool from '../apis/db.js';

const router = express.Router();

// Dashboard Analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const dateRange = `DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;

        const [salesTrend] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(total_amount), 0) as sales
            FROM orders
            WHERE ${dateRange} AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        const [orderStatus] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
            FROM orders
            WHERE ${dateRange}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                salesTrend: salesTrend || [],
                orderStatus: orderStatus || [],
            },
        });
    } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// Orders Analytics
router.get('/orders', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const dateRange = `DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;

        // Today's Sales by Hour
        const [todaySales] = await pool.query(`
            SELECT 
                HOUR(created_at) as hour,
                COALESCE(SUM(total_amount), 0) as sales,
                COUNT(*) as orders
            FROM orders
            WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'
            GROUP BY HOUR(created_at)
            ORDER BY hour ASC
        `);

        // Daily Sales
        const [dailySales] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(total_amount), 0) as sales,
                COUNT(*) as orders
            FROM orders
            WHERE ${dateRange} AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Monthly Revenue
        const [monthlyRevenue] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COALESCE(SUM(total_amount), 0) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) AND status != 'cancelled' -- Replace 'order_status' with 'status'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // Payment Methods
        const [paymentMethods] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(CASE WHEN payment_method = 'cash_on_delivery' THEN 1 END) as cash_on_delivery,
                COUNT(CASE WHEN payment_method = 'paypal' THEN 1 END) as paypal,
                COUNT(CASE WHEN payment_method = 'bank_transfer' THEN 1 END) as bank_transfer,
                COUNT(CASE WHEN payment_method = 'credit_card' THEN 1 END) as credit_card
            FROM orders
            WHERE ${dateRange}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                todaySales,
                dailySales,
                monthlyRevenue,
                paymentMethods
            }
        });
    } catch (err) {
        console.error('Error fetching orders analytics:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Accounts Analytics
router.get('/accounts', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const dateRange = `DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;

        // User Registrations
        const [userRegistrations] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
            FROM accounts
            WHERE ${dateRange}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Account Types
        const [accountTypes] = await pool.query(`
            SELECT 
                role,
                COUNT(*) as count
            FROM accounts
            GROUP BY role
        `);

        // Account Status
        const [accountStatus] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(CASE WHEN is_suspended = 0 THEN 1 END) as active,
                COUNT(CASE WHEN is_suspended = 1 THEN 1 END) as suspended
            FROM accounts
            WHERE ${dateRange}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                userRegistrations,
                accountTypes,
                accountStatus
            }
        });
    } catch (err) {
        console.error('Error fetching accounts analytics:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Stocks Analytics
router.get('/stocks', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const dateRange = `DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;

        // Category Stock
        const [categoryStock] = await pool.query(`
            SELECT 
                c.name as category,
                COUNT(CASE WHEN p.stock_status = 'in_stock' THEN 1 END) as inStock,
                COUNT(CASE WHEN p.stock_status = 'low_stock' THEN 1 END) as lowStock,
                COUNT(CASE WHEN p.stock_status = 'out_of_stock' THEN 1 END) as outOfStock
            FROM product_categories c
            LEFT JOIN product_subcategories sc ON c.id = sc.category_id
            LEFT JOIN products p ON sc.id = p.subcategory_id
            GROUP BY c.id, c.name
            ORDER BY c.name
        `);

        // Reorder Analysis
        const [reorderAnalysis] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(CASE WHEN stock_history_type = 'restock' THEN 1 END) as reordersCompleted,
                COUNT(CASE WHEN stock_history_type = 'low_stock_alert' THEN 1 END) as reordersSuggested
            FROM stocks_history
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);

        // Stock Level Trends
        const [stockLevelTrends] = await pool.query(`
            SELECT 
                DATE(sh.created_at) as date,
                COUNT(CASE WHEN p.stock_status = 'in_stock' THEN 1 END) as inStock,
                COUNT(CASE WHEN p.stock_status = 'low_stock' THEN 1 END) as lowStock,
                COUNT(CASE WHEN p.stock_status = 'out_of_stock' THEN 1 END) as outOfStock
            FROM stocks_history sh
            JOIN products p ON sh.product_id = p.id
            WHERE ${dateRange.replace('created_at', 'sh.created_at')}
            GROUP BY DATE(sh.created_at)
            ORDER BY date ASC
        `);

        res.json({
            success: true,
            data: {
                categoryStock,
                reorderAnalysis,
                stockLevelTrends
            }
        });
    } catch (err) {
        console.error('Error fetching stocks analytics:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


router.get('/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { days } = req.query;
        
        const dateCondition = days 
            ? `AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`
            : '';

        const [productAnalytics] = await pool.query(`
            SELECT 
                DATE(o.created_at) as date,
                COALESCE(SUM(oi.quantity * oi.price), 0) as sales,
                COALESCE(SUM(oi.quantity), 0) as orders
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = ? ${dateCondition} AND o.status != 'cancelled'
            GROUP BY DATE(o.created_at)
            ORDER BY date ASC
        `, [productId]);

        res.json({
            success: true,
            data: productAnalytics
        });
    } catch (err) {
        console.error('Error fetching product analytics:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;