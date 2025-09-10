import cors from 'cors';
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './apis/auth.js';
import accountsRouter from './routes/accounts.js';
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';
import reservationsRouter from './routes/reservations.js';
import installmentsRouter from './routes/installments.js';
import stocksRouter from './routes/stocks.js';
import ordersRouter from './routes/orders.js';
import oauthRouter from './routes/oauth.js';
import categoriesRouter from './routes/categories.js';
import wishlistRoutes from './routes/wishlist.js';
import userSettingsRoutes from './routes/user-settings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'https://seraphim-luxe-ecommerce-production.up.railway.app',
        'http://localhost:5173'
    ],
  	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  	credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
    console.log(`${ new Date().toISOString() } - ${ req.method } ${ req.url }`);
    next();
});

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use('/api/accounts', accountsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/installments', installmentsRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/user-settings', userSettingsRoutes);

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
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

const startServer = async () => {
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
        console.error('Database connection required for production. Exiting...');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port: ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
};

startServer();
