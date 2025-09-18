import pool from '../apis/db.js';

export class AuditLogger {
    static async log({
        user_id,
        action_type,
        resource_type = null,
        resource_id = null,
        old_values = null,
        new_values = null,
        details = null,
        req = null
    }) {
        try {
            // Handle different request object formats
            let ip_address = 'unknown';
            let user_agent = null;
            let session_id = null;

            if (req) {
                // Handle IP address extraction
                if (req.ip) {
                    ip_address = req.ip;
                } else if (req.connection?.remoteAddress) {
                    ip_address = req.connection.remoteAddress;
                } else if (req.headers) {
                    ip_address = req.headers['x-forwarded-for'] || 
                               req.headers['x-real-ip'] || 
                               req.headers['cf-connecting-ip'] || 
                               'unknown';
                }

                // Handle user agent extraction - check both methods
                if (req.get && typeof req.get === 'function') {
                    user_agent = req.get('User-Agent');
                } else if (req.headers && req.headers['user-agent']) {
                    user_agent = req.headers['user-agent'];
                }

                // Handle session
                session_id = req.session?.id || null;
            }

            const query = `
                INSERT INTO audit_trail (
                    user_id, action_type, resource_type, resource_id,
                    old_values, new_values, ip_address, user_agent,
                    session_id, details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                user_id,
                action_type,
                resource_type,
                resource_id,
                old_values ? JSON.stringify(old_values) : null,
                new_values ? JSON.stringify(new_values) : null,
                ip_address,
                user_agent,
                session_id,
                details
            ];

            await pool.query(query, params);
            return true;

        } catch (error) {
            console.error('Audit logging error:', error);
            return false;
        }
    }

    // Authentication logs
    static async logSignIn(user_id, req, details = null) {
        return this.log({
            user_id: user_id,
            action_type: 'auth_signin',
            resource_type: 'session',
            resource_id: null,
            old_values: null,
            new_values: null,
            details: details || 'User signed in',
            req
        });
    }

    static async logSignUp(user_id, user_data, req) {
        return this.log({
            user_id: user_id,
            action_type: 'auth_signup',
            resource_type: 'account',
            resource_id: user_id,
            old_values: null,
            new_values: {
                email: user_data.email,
                first_name: user_data.first_name,
                last_name: user_data.last_name,
                role: user_data.role
            },
            details: `New account registered: ${user_data.email}`,
            req
        });
    }

    static async logSignOut(user_id, req, details = null) {
        return this.log({
            user_id: user_id,
            action_type: 'auth_signout',
            resource_type: 'session',
            resource_id: null,
            old_values: null,
            new_values: null,
            details: details || 'User signed out',
            req
        });
    }

    static async logPasswordChange(user_id, req, details = null) {
        return this.log({
            user_id: user_id,
            action_type: 'auth_password_change',
            resource_type: 'account',
            resource_id: user_id,
            old_values: null,
            new_values: null,
            details: details || 'Password changed',
            req
        });
    }

    // Profile updates
    static async logProfileUpdate(user_id, oldValues, newValues, req) {
        return this.log({
            user_id: user_id,
            action_type: 'profile_update',
            resource_type: 'user_profile',
            resource_id: user_id,
            old_values: oldValues,
            new_values: newValues,
            details: 'User profile updated',
            req
        });
    }

    static async logPreferencesUpdate(user_id, oldValues, newValues, req) {
        return this.log({
            user_id: user_id,
            action_type: 'profile_preferences_update',
            resource_type: 'user_settings',
            resource_id: user_id,
            old_values: oldValues,
            new_values: newValues,
            details: 'User preferences updated',
            req
        });
    }

    static async logAccountSuspension(admin_id, target_user_id, is_suspended, req, user_data = null) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_suspend',
            resource_type: 'account',
            resource_id: target_user_id,
            old_values: { is_suspended: !is_suspended },
            new_values: { 
                is_suspended: is_suspended,
                user_email: user_data?.email,
                user_name: user_data ? `${user_data.first_name} ${user_data.last_name}` : null
            },
            details: `Account ${is_suspended ? 'suspended' : 'reactivated'}${user_data ? ` for ${user_data.email}` : ''}`,
            req
        });
    }

    static async logAccountEdit(admin_id, target_user_id, old_values, new_values, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_update',
            resource_type: 'account',
            resource_id: target_user_id,
            old_values: old_values,
            new_values: new_values,
            details: `Account updated for ${new_values.email || 'user'}`,
            req
        });
    }

    static async logAccountDeletion(admin_id, target_user_id, user_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_delete',
            resource_type: 'account',
            resource_id: target_user_id,
            old_values: {
                email: user_data.email,
                first_name: user_data.first_name,
                last_name: user_data.last_name,
                role: user_data.role
            },
            new_values: null,
            details: `Account deleted for ${user_data.email}`,
            req
        });
    }

    static async logAccountCreation(admin_id, new_user_id, user_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_create',
            resource_type: 'account',
            resource_id: new_user_id,
            old_values: null,
            new_values: {
                email: user_data.email,
                first_name: user_data.first_name,
                last_name: user_data.last_name,
                role: user_data.role
            },
            details: `Account created for ${user_data.email}`,
            req
        });
    }

    // Product interactions
    static async logProductView(user_id, product_id, req) {
        return this.log({
            user_id,
            action_type: 'product_view',
            resource_type: 'product',
            resource_id: product_id,
            details: 'Product viewed',
            req
        });
    }

    // Cart actions
    static async logCartAdd(user_id, product_id, quantity, req) {
        return this.log({
            user_id,
            action_type: 'cart_add',
            resource_type: 'product',
            resource_id: product_id,
            new_values: { quantity },
            details: `Added ${quantity} item(s) to cart`,
            req
        });
    }

    static async logCartRemove(user_id, product_id, req) {
        return this.log({
            user_id,
            action_type: 'cart_remove',
            resource_type: 'product',
            resource_id: product_id,
            details: 'Removed item from cart',
            req
        });
    }

    static async logCartUpdate(user_id, product_id, old_quantity, new_quantity, req) {
        return this.log({
            user_id,
            action_type: 'cart_update',
            resource_type: 'product',
            resource_id: product_id,
            old_values: { quantity: old_quantity },
            new_values: { quantity: new_quantity },
            details: `Updated cart quantity from ${old_quantity} to ${new_quantity}`,
            req
        });
    }

    // Wishlist actions
    static async logWishlistAdd(user_id, product_id, req) {
        return this.log({
            user_id,
            action_type: 'wishlist_add',
            resource_type: 'product',
            resource_id: product_id,
            details: 'Added item to wishlist',
            req
        });
    }

    static async logWishlistRemove(user_id, product_id, req) {
        return this.log({
            user_id,
            action_type: 'wishlist_remove',
            resource_type: 'product',
            resource_id: product_id,
            details: 'Removed item from wishlist',
            req
        });
    }

    // Order actions
    static async logOrderCreate(user_id, order_id, order_data, req) {
        return this.log({
            user_id,
            action_type: 'order_create',
            resource_type: 'order',
            resource_id: order_id,
            new_values: order_data,
            details: `Order ${order_data.order_number || order_id} created`,
            req
        });
    }

    static async logOrderUpdate(admin_id, order_id, old_values, new_values, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'order_update',
            resource_type: 'order',
            resource_id: order_id,
            old_values,
            new_values,
            details: 'Order updated',
            req
        });
    }

    static async logOrderCancel(user_id, order_id, req, details = null) {
        return this.log({
            user_id,
            action_type: 'order_cancel',
            resource_type: 'order',
            resource_id: order_id,
            details: details || 'Order cancelled',
            req
        });
    }

    // Invoice printing (single order)
    static async logInvoicePrint(admin_id, order_id, order_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'order_invoice_print',
            resource_type: 'order',
            resource_id: order_id,
            details: `Admin printed invoice for order ${order_data.order_number || order_id} (Customer: ${order_data.customer_name})`,
            new_values: {
                order_number: order_data.order_number,
                customer_name: order_data.customer_name,
                total_amount: order_data.total_amount
            },
            req
        });
    }

    // Invoice report printing (multiple orders)
    static async logInvoiceReportPrint(admin_id, report_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'order_invoice_report_print',
            resource_type: 'order',
            resource_id: null,
            details: `Admin printed invoice report for ${report_data.order_count} orders (${report_data.date_range}) - Total Revenue: ₱${report_data.total_revenue}`,
            new_values: {
                order_count: report_data.order_count,
                date_range: report_data.date_range,
                total_revenue: report_data.total_revenue,
                start_date: report_data.start_date,
                end_date: report_data.end_date
            },
            req
        });
    }

    // Admin actions
    static async logAdminProductCreate(admin_id, product_id, product_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_product_create',
            resource_type: 'product',
            resource_id: product_id,
            new_values: product_data,
            details: `Product ${product_data.label || product_id} created`,
            req
        });
    }

    static async logAdminProductUpdate(admin_id, product_id, old_values, new_values, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_product_update',
            resource_type: 'product',
            resource_id: product_id,
            old_values,
            new_values,
            details: 'Product updated by admin',
            req
        });
    }

    static async logAdminProductDelete(admin_id, product_id, product_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_product_delete',
            resource_type: 'product',
            resource_id: product_id,
            old_values: product_data,
            details: `Product ${product_data.label || product_id} deleted`,
            req
        });
    }

    static async logAdminCategoryCreate(admin_id, category_id, category_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_category_create',
            resource_type: 'category',
            resource_id: category_id,
            new_values: category_data,
            details: `Category ${category_data.name || category_id} created`,
            req
        });
    }

    static async logAdminCategoryUpdate(admin_id, category_id, old_values, new_values, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_category_update',
            resource_type: 'category',
            resource_id: category_id,
            old_values,
            new_values,
            details: 'Category updated by admin',
            req
        });
    }

    static async logAdminCategoryDelete(admin_id, category_id, category_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_category_delete',
            resource_type: 'category',
            resource_id: category_id,
            old_values: category_data,
            details: `Category ${category_data.name || category_id} deleted`,
            req
        });
    }

    static async logAdminStockUpdate(admin_id, product_id, old_stock, new_stock, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_stock_update',
            resource_type: 'product',
            resource_id: product_id,
            old_values: { stock_quantity: old_stock },
            new_values: { stock_quantity: new_stock },
            details: `Stock updated from ${old_stock} to ${new_stock}`,
            req
        });
    }

    static async logAdminSettingsUpdate(admin_id, oldValues, newValues, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_settings_update',
            resource_type: 'platform_settings',
            resource_id: null,
            old_values: oldValues,
            new_values: newValues,
            details: 'Platform settings updated',
            req
        });
    }

    static async logAdminAccountCreate(admin_id, account_id, account_data, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_create',
            resource_type: 'account',
            resource_id: account_id,
            new_values: account_data,
            details: `Account ${account_data.email || account_id} created by admin`,
            req
        });
    }

    static async logAdminAccountUpdate(admin_id, account_id, old_values, new_values, req) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_update',
            resource_type: 'account',
            resource_id: account_id,
            old_values,
            new_values,
            details: 'Account updated by admin',
            req
        });
    }

    static async logAdminAccountSuspend(admin_id, account_id, req, details = null) {
        return this.log({
            user_id: admin_id,
            action_type: 'admin_account_suspend',
            resource_type: 'account',
            resource_id: account_id,
            details: details || 'Account suspended by admin',
            req
        });
    }
}

export default AuditLogger;