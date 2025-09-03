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
    	? [ 'https://seraphim-luxe-production.up.railway.app' ]
    	: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  	credentials: true,
}));

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

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get(/^(?!\/api\/).*/, (req, res) => {
	res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port: ${ PORT }`)
});
