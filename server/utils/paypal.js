import "dotenv/config";
import { ApiError, CheckoutPaymentIntent, Client, Environment, LogLevel, OrdersController } from "@paypal/paypal-server-sdk";

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment: Environment.Sandbox
});

const ordersController = new OrdersController(client);

const CURRENCY_TO_USD_RATES = {
    PHP: 0.018,
    USD: 1.0,
    EUR: 1.10,
    JPY: 0.0067,
    CAD: 0.74
};

const PAYPAL_SUPPORTED_CURRENCIES = {
    GLOBAL: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
    REGIONAL: ['PHP']
};

const convertToPayPalCurrency = (amount, fromCurrency) => {
    const numAmount = parseFloat(amount);
    const currency = fromCurrency.toUpperCase();

    if (['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].includes(currency)) {
        return {
            currency: currency,
            amount: numAmount.toFixed(2)
        };
    }

    if (currency === 'PHP') {
        const usdAmount = numAmount * 0.018;
        return {
            currency: 'USD',
            amount: usdAmount.toFixed(2)
        };
    }

    return {
        currency: 'USD',
        amount: (numAmount * 0.018).toFixed(2)
    };
};

export const createOrder = async (orderData) => {
    const { currency = "PHP", amount = "0.00", displayCurrency, cart = [] } = orderData;
    
    const actualCurrency = displayCurrency || currency;
    
    const { currency: paypalCurrency, amount: paypalAmount } = convertToPayPalCurrency(amount, actualCurrency);
    
    const finalAmount = Math.max(parseFloat(paypalAmount), 0.01).toFixed(2);

    const collect = {
        body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    amount: {
                        currencyCode: paypalCurrency,
                        value: finalAmount,
                    },
                    description: "Seraphim Luxe Order",
                    customId: `ORDER_${Date.now()}`,
                },
            ],
        },
        prefer: "return=minimal",
    };

    try {
        
        const { body, ...httpResponse } = await ordersController.createOrder(collect);
        
        const response = JSON.parse(body);
        
        return { 
            jsonResponse: response, 
            httpStatusCode: httpResponse.statusCode,
            originalCurrency: actualCurrency,
            originalAmount: amount,
            paypalCurrency: paypalCurrency,
            paypalAmount: finalAmount
        };

    } catch (error) {
        console.error("PayPal createOrder error:", error);
        
        if (error instanceof ApiError) {
            console.error("PayPal API Error details:", {
                statusCode: error.statusCode,
                headers: error.headers,
                result: error.result
            });
            throw new Error(`PayPal API Error: ${error.message}`);
        }
        
        throw new Error(`PayPal Order Creation Failed: ${error.message}`);
    }
};

export const captureOrder = async (orderID) => {
    const collect = {
        id: orderID,
        prefer: "return=minimal",
    };  
    
    try {
        const { body, ...httpResponse } = await ordersController.captureOrder(collect);   
        
        return { 
          jsonResponse: JSON.parse(body), 
          httpStatusCode: httpResponse.statusCode 
        };

    } catch (error) {
        if (error instanceof ApiError) {
          throw new Error(error.message);
        }
        throw error;
    }
};

export const getPayPalCurrency = (requestedCurrency) => {
    const converted = convertToPayPalCurrency("1.00", requestedCurrency);
    return converted.currency;
};
