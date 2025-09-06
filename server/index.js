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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
	origin: process.env.NODE_ENV === 'production' 
        ? [ 
            'https://seraphim-luxe-ecommerce-production.up.railway.app',
            'https://seraphim-luxe-production.up.railway.app'
        ]
    	: [ 'http://localhost:5173', 'http://127.0.0.1:5173' ],
  	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  	credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
    console.log(`${ new Date().toISOString() } - ${ req.method } ${ req.url }`);
    next();
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use('/api/accounts', (req, res, next) => {
    accountsRouter(req, res, next).catch(next);
});

app.use('/api/products', (req, res, next) => {
    productsRouter(req, res, next).catch(next);
});

app.use('/api/carts', (req, res, next) => {
    cartsRouter(req, res, next).catch(next);
});

app.use('/api/reservations', (req, res, next) => {
    reservationsRouter(req, res, next).catch(next);
});

app.use('/api/installments', (req, res, next) => {
    installmentsRouter(req, res, next).catch(next);
});

app.use('/api/stocks', (req, res, next) => {
    stocksRouter(req, res, next).catch(next);
});

app.use('/api/orders', (req, res, next) => {
    ordersRouter(req, res, next).catch(next);
});

app.use('/api/oauth', (req, res, next) => {
    oauthRouter(req, res, next).catch(next);
});

app.use('/api/categories', (req, res, next) => {
    categoriesRouter(req, res, next).catch(next);
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/^(?!\/api\/).*/, (req, res) => {
	res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port: ${ PORT }`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
});
