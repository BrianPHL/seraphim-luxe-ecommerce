import pool from "../apis/db.js";
import express from 'express';
import { AuditLogger } from '../utils/audit-trail.js';
import { requireAdmin } from '../middleware/auth.js';

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

router.put('/settings', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const admin_id = req.user?.id || req.body?.admin_id;
        const { paymentMethods, customPaymentMethods, availableCurrencies } = req.body;

        // Validate admin_id
        if (!admin_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'Admin ID is required' });
        }

        // Get old settings before update
        const [oldSettings] = await connection.execute('SELECT * FROM platform_settings');
        const oldValues = {};
        oldSettings.forEach(setting => {
            oldValues[setting.setting_key] = setting.setting_value;
        });

        // Clean up custom payment methods
        if (customPaymentMethods) {
            const [existingRows] = await connection.execute(
                'SELECT setting_key FROM platform_settings WHERE setting_key LIKE "custom_payment_%"'
            );
            const keepKeys = customPaymentMethods.map(m => m.key);

            const existingMethodKeys = new Set(
                existingRows
                    .map(row => row.setting_key.split('_')[2])
            );

            for (const methodKey of existingMethodKeys) {
                if (!keepKeys.includes(methodKey)) {
                    await connection.execute(
                        'DELETE FROM platform_settings WHERE setting_key LIKE ?',
                        [`custom_payment_${methodKey}_%`]
                    );
                }
            }
        }

        // Update payment methods
        if (paymentMethods) {
            for (const [method, enabled] of Object.entries(paymentMethods)) {
                const settingKey = `payment_${method}_enabled`;
                await connection.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [settingKey, enabled.toString()]
                );
            }
        }

        // Update custom payment methods
        if (customPaymentMethods) {
            for (const method of customPaymentMethods) {
                const enabledKey = `custom_payment_${method.key}_enabled`;
                const labelKey = `custom_payment_${method.key}_label`;
                const descriptionKey = `custom_payment_${method.key}_description`;

                await connection.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [enabledKey, method.enabled.toString()]
                );
                await connection.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [labelKey, method.label]
                );
                await connection.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [descriptionKey, method.description || '']
                );
            }
        }

        // Update available currencies
        if (availableCurrencies) {
            for (const [currency, enabled] of Object.entries(availableCurrencies)) {
                const settingKey = `currency_${currency}_enabled`;
                await connection.execute(
                    `INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
                    [settingKey, enabled.toString()]
                );
            }
        }

        await connection.commit();

        // Log settings update in audit trail
        try {
            await AuditLogger.logAdminSettingsUpdate(
                admin_id, 
                oldValues, 
                {
                    paymentMethods,
                    customPaymentMethods,
                    availableCurrencies
                }, 
                req
            );
        } catch (auditError) {
            console.error('Error logging audit trail:', auditError);
            // Don't fail the request if audit logging fails
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating settings:', error);
        res.status(500).json({ 
            error: 'Failed to update settings',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

export default router;