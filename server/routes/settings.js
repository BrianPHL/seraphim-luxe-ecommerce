import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/settings', async (req, res) => {
    try {
        const [paymentRows] = await pool.execute(
            'SELECT setting_key, setting_value FROM platform_settings WHERE setting_key LIKE "payment_%_enabled"'
        );

        const [customPaymentRows] = await pool.execute(
            'SELECT setting_key, setting_value FROM platform_settings WHERE setting_key LIKE "custom_payment_%"'
        );

        const [currencyRows] = await pool.execute(
            'SELECT setting_key, setting_value FROM platform_settings WHERE setting_key LIKE "currency_%_enabled"'
        );

        const paymentSettings = {
            cash_on_delivery: true,
            bank_transfer: true,
            paypal: true,
            credit_card: false
        };

        const customPaymentMethods = [];
        const availableCurrencies = {
            PHP: true,
            USD: true,
            EUR: true,
            JPY: true,
            CAD: true
        };

        paymentRows.forEach(row => {
            const method = row.setting_key.replace('payment_', '').replace('_enabled', '');
            paymentSettings[method] = row.setting_value === 'true';
        });

        const customPaymentData = {};
        customPaymentRows.forEach(row => {
            const parts = row.setting_key.split('_');
            const methodKey = parts[2]; 
            const property = parts.slice(3).join('_');
            
            if (!customPaymentData[methodKey]) {
                customPaymentData[methodKey] = { key: methodKey };
            }
            
            if (property === 'enabled') {
                customPaymentData[methodKey].enabled = row.setting_value === 'true';
            } else if (property === 'label') {
                customPaymentData[methodKey].label = row.setting_value;
            } else if (property === 'description') {
                customPaymentData[methodKey].description = row.setting_value;
            }
        });

        Object.values(customPaymentData).forEach(method => {
            if (method.label) { 
                customPaymentMethods.push({
                    ...method,
                    is_custom: true
                });
            }
        });

        currencyRows.forEach(row => {
            const currency = row.setting_key.replace('currency_', '').replace('_enabled', '');
            availableCurrencies[currency] = row.setting_value === 'true';
        });

        res.json({
            paymentMethods: paymentSettings,
            customPaymentMethods,
            availableCurrencies
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ 
            error: 'Failed to fetch settings',
            details: error.message 
        });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { paymentMethods, customPaymentMethods, availableCurrencies } = req.body;

        if (customPaymentMethods) {
            const [existingRows] = await pool.execute(
                'SELECT setting_key FROM platform_settings WHERE setting_key LIKE "custom_payment_%"'
            );
            const keepKeys = customPaymentMethods.map(m => m.key);

            const existingMethodKeys = new Set(
                existingRows
                    .map(row => row.setting_key.split('_')[2])
            );

            for (const methodKey of existingMethodKeys) {
                if (!keepKeys.includes(methodKey)) {
                    await pool.execute(
                        'DELETE FROM platform_settings WHERE setting_key LIKE ?',
                        [`custom_payment_${methodKey}_%`]
                    );
                }
            }
        }

        if (paymentMethods) {
            for (const [method, enabled] of Object.entries(paymentMethods)) {
                const settingKey = `payment_${method}_enabled`;
                await pool.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [settingKey, enabled.toString()]
                );
            }
        }

        if (customPaymentMethods) {
            for (const method of customPaymentMethods) {
                const enabledKey = `custom_payment_${method.key}_enabled`;
                const labelKey = `custom_payment_${method.key}_label`;
                const descriptionKey = `custom_payment_${method.key}_description`;

                await pool.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [enabledKey, method.enabled.toString()]
                );
                await pool.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [labelKey, method.label]
                );
                await pool.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [descriptionKey, method.description || '']
                );
            }
        }

        if (availableCurrencies) {
            for (const [currency, enabled] of Object.entries(availableCurrencies)) {
                const settingKey = `currency_${currency}_enabled`;
                await pool.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [settingKey, enabled.toString()]
                );
            }
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ 
            error: 'Failed to update settings',
            details: error.message 
        });
    }
});

export default router;