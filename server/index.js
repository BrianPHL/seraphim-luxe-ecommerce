import cors from 'cors';
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './apis/better-auth.js';
import accountsRouter from './routes/accounts.js';
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';
import stocksRouter from './routes/stocks.js';
import ordersRouter from './routes/orders.js';
import oauthRouter from './routes/oauth.js';
import categoriesRouter from './routes/categories.js';
import cmsRouter from './routes/cms.js';
import wishlistRoutes from './routes/wishlist.js';
import userSettingsRoutes from './routes/user-settings.js';
import settingsRouter from './routes/settings.js';
import paypalRouter from './routes/paypal.js';
import notificationsRouter from './routes/notifications.js';
import auditTrailRoutes from './routes/audit-trail.js'
import reviewsRouter from './routes/reviews.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
	origin: process.env.NODE_ENV === 'production' 
        ? [ 
            'https://seraphimluxe.store', 
            'https://www.sandbox.paypal.com',
            'https://js.paypal.com',
            'https://www.paypal.com',
            'https://js-sdk.paypal.com',
            'https://www.paypalobjects.com',
            'https://checkout.paypal.com'
        ]
        : [ 
            'http://localhost:5173',
            'http://localhost:3000', 
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            'https://www.sandbox.paypal.com', 
            'https://js.paypal.com',
            'https://www.paypal.com',
            'https://js-sdk.paypal.com',
            'https://www.paypalobjects.com',
            'https://checkout.paypal.com'
        ],
  	credentials: true,
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use('/api/accounts', accountsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cms', cmsRouter);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/admin', settingsRouter);
app.use('/api/paypal', paypalRouter);
app.use('/api/audit-trail', auditTrailRoutes);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const testDatabaseConnection = async () => {
    try {
        const pool = await import('./apis/db.js');
        await pool.default.query('SELECT 1');
        return true;
    } catch (error) {
        return false;
    }
};

const startServer = async () => {

    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
        console.error('Database connection required for production. Exiting...');
        process.exit(1);
    }

    app.listen(PORT, () => console.log(`Database connection successful. Listening to port ${ PORT }`));

};

startServer();
