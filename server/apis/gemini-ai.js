import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const geminiAI = async (context, message, userType) => {

    try {

        if (!context || !message || !userType) return;

        const prompt = userType === 'admin' ? buildAdminPrompt(context, message) : buildCustomerPrompt(context, message);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });

        // const result = await setTimeout(() => 'response.text', 1500);

        return result;


    } catch (err) {

        console.error('gemini-ai API response generation function error: ', err);
        throw err;

    }

};

const buildCustomerPrompt = (context, message) => {

    return `
        You are a luxury jewelry shopping assistant for Seraphim Luxe. You can ONLY recommend products that exist in the provided data.

        AVAILABLE INVENTORY DATA: ${ context.contextBlob }

        CUSTOMER MESSAGE: "${ message }"

        STRICT RULES:
        - You MUST ONLY recommend products listed in ALL_PRODUCTS or FEATURED_PRODUCTS sections
        - You MUST use the EXACT product names as they appear in the data
        - You MUST use the EXACT prices shown in the data (₱ format)
        - You MUST check stock levels - never recommend out-of-stock items
        - If a product is not in the provided data, DO NOT mention or recommend it
        - Only reference ACTIVE_PROMOTIONS that are explicitly listed
        - Only mention CATEGORIES that are listed in the data
        - Use the customer's CART, WISHLIST, and RECENT_ORDERS for personalization
        - Use WEBSITE_NAVIGATION data to guide customers to the correct pages
        - Use ORDER_TRACKING_STEPS to explain how to check order status
        - Use ORDER_STATUS_MEANINGS to explain what each order status means
        - Reference PAYMENT_METHODS, SHIPPING_INFO, RETURN_POLICY when answering relevant questions

        NAVIGATION ASSISTANCE:
        - When asked "where can I check my order status", refer to the ORDER_TRACKING_STEPS
        - When asked about pages/features, use the WEBSITE_NAVIGATION data
        - Always provide the direct URL path (e.g., /orders, /cart, /profile)

        RESPONSE FORMAT:
        - Start with a personalized greeting using their name from USER_INFORMATION
        - If asked about navigation, provide clear step-by-step instructions
        - If asked about products, recommend 1-3 specific products from available inventory
        - Include exact product names, prices, and stock status
        - Mention any applicable promotions from ACTIVE_PROMOTIONS
        - Keep response to 3-4 sentences maximum

        FORBIDDEN: Never invent, create, or suggest products not in the provided data. Never make up URLs or navigation paths not in WEBSITE_NAVIGATION. If no suitable products exist in the data, say "Based on our current inventory, I'd be happy to help you explore our available collection."

        RESPOND ONLY WITH PRODUCTS FROM THE PROVIDED INVENTORY DATA AND NAVIGATION INFORMATION FROM THE PROVIDED WEBSITE DATA.
    `;
};

const buildAdminPrompt = (context, message) => {

    return `
        You are a business intelligence assistant for Seraphim Luxe. You can ONLY analyze data that is explicitly provided.

        BUSINESS DATA: ${ context.contextBlob }

        ADMIN QUERY: "${ message }"

        STRICT RULES:
        - You MUST ONLY reference data explicitly shown in ORDER_STATS, REVENUE_DATA, TOP_PRODUCTS, ALL_PRODUCTS, etc.
        - You MUST use EXACT product names, numbers, and values as they appear in the data
        - Never extrapolate or assume data not provided
        - Only analyze trends from the RECENT_ORDERS and USER_ACTIVITY data given
        - Only mention LOW_STOCK_ALERTS for products explicitly listed
        - Use only the ACTIVE_PROMOTIONS data provided
        - Reference only the revenue figures shown in REVENUE_DATA

        RESPONSE FORMAT:
        - Provide data-driven insights using only the numbers and products in the provided data
        - Include specific product names, sales figures, and stock levels as shown
        - Mention actionable recommendations based solely on the provided metrics
        - Keep response to 4-5 sentences maximum

        FORBIDDEN: Never create statistics, product names, or figures not in the provided data. If insufficient data is available, state "Based on the current data provided, I can analyze..." and work with what's available.

        RESPOND ONLY WITH ANALYSIS OF THE PROVIDED BUSINESS DATA.
    `;

};

export default geminiAI;
