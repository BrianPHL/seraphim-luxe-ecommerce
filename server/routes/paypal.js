import pool from "../apis/db.js";
import express from 'express';
import dotenv from "dotenv";
import { createOrder, captureOrder, getPayPalCurrency } from '../utils/paypal.js';

const router = express.Router();

dotenv.config();

router.get("/get-client-id", async (req, res) => {

    try {

        const requestedCurrency = req.query.currency || 'USD';
        const supportedCurrency = getPayPalCurrency(requestedCurrency);
        
        res.status(200).json({
            clientId: process.env.PAYPAL_CLIENT_ID,
            currency: supportedCurrency
        });

    } catch (error) {
        console.error("Paypal route GET /get-client-id endpoint error: ", error);
        res.status(500).json({ error: "Failed to get PayPal client ID." });		
    }
});


router.post("/orders", async (req, res) => {

    try {
        const { currency = "USD", cart = [], amount } = req.body;
        
        let totalAmount = amount;
        if (!totalAmount && cart && cart.length > 0) {
            totalAmount = cart.reduce((sum, item) => {
                const price = parseFloat(item.price || 0);
                const quantity = parseInt(item.quantity || 1);
                return sum + (price * quantity);
            }, 0).toFixed(2);
        }
        
        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            return res.status(400).json({ error: "Invalid order amount" });
        }
        
        const orderData = {
            currency: currency,
            amount: totalAmount,
            cart: cart
        };
        
        const result = await createOrder(orderData);
        res.status(result.httpStatusCode).json(result.jsonResponse);
        
    } catch (error) {
        console.error("Failed to create PayPal order:", error);
        res.status(500).json({ error: "Failed to create order: " + error.message });
    }
});

router.post("/orders/:orderID/capture", async (req, res) => {
	
	try {
		const { orderID } = req.params;
		const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
		res.status(httpStatusCode).json(jsonResponse);
	} catch (error) {
		console.error("Failed to capture order:", error);
		res.status(500).json({ error: "Failed to capture order." });
	}

});

export default router;
