export const PRODUCT_FILTER_CONFIG = {
    searchFields: ['label', 'description'],
    sortOptions: [
        {
            label: 'Name (A-Z)',
            value: 'Sort by: Name (A-Z)',
            field: 'label',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Name (Z-A)',
            value: 'Sort by: Name (Z-A)',
            field: 'label',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Price (Low to High)',
            value: 'Sort by: Price (Low to High)',
            field: 'price',
            type: 'number',
            direction: 'asc'
        },
        {
            label: 'Price (High to Low)',
            value: 'Sort by: Price (High to Low)',
            field: 'price',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'Newest First',
            value: 'Sort by: Newest First',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest First',
            value: 'Sort by: Oldest First',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        },
        {
            label: 'Stock Quantity (High to Low)',
            value: 'Sort by: Stock (High to Low)',
            field: 'stock_quantity',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'Stock Quantity (Low to High)',
            value: 'Sort by: Stock (Low to High)',
            field: 'stock_quantity',
            type: 'number',
            direction: 'asc'
        },
        ...(typeof window !== 'undefined' && window.INCLUDE_POPULARITY_SORT ? [
            {
                label: 'Most Popular',
                value: 'Sort by: Popularity (Most Popular)',
                sortFunction: (a, b) => {
                    const aPopularity = (a.views_count || 0) + (a.orders_count || 0) * 3;
                    const bPopularity = (b.views_count || 0) + (b.orders_count || 0) * 3;
                    return bPopularity - aPopularity;
                }
            },
            {
                label: 'Least Popular',
                value: 'Sort by: Popularity (Least Popular)',
                sortFunction: (a, b) => {
                    const aPopularity = (a.views_count || 0) + (a.orders_count || 0) * 3;
                    const bPopularity = (b.views_count || 0) + (b.orders_count || 0) * 3;
                    return aPopularity - bPopularity;
                }
            }
        ] : [])
    ],
    filterOptions: [
        {
            key: 'category_id',
            label: 'Category',
            type: 'select',
            field: 'category_id'
        },
        {
            key: 'subcategory_id',
            label: 'Subcategory',
            type: 'select',
            field: 'subcategory_id'
        },
        {
            key: 'price_range',
            label: 'Price Range',
            type: 'range',
            field: 'price'
        },
        {
            key: 'stock_status',
            label: 'Stock Status',
            type: 'multiselect',
            field: 'stock_status'
        },
        {
            key: 'stock_range',
            label: 'Stock Quantity Range',
            type: 'range',
            field: 'stock_quantity'
        },
        {
            key: 'in_stock',
            label: 'In Stock Only',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.stock_quantity > 0) : true;
            }
        },
        {
            key: 'low_stock',
            label: 'Low Stock Only',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.stock_quantity <= item.stock_threshold) : true;
            }
        }
    ]
};

export const LOW_STOCK_FILTER_CONFIG = {
    searchFields: ['label', 'category'],
    sortOptions: [
        {
            label: 'Most Critical First',
            value: 'Sort by: Most Critical First',
            sortFunction: (a, b) => {
                const aCritical = (a.stock_threshold - a.stock_quantity);
                const bCritical = (b.stock_threshold - b.stock_quantity);
                return bCritical - aCritical;
            }
        },
        {
            label: 'Name (A-Z)',
            value: 'Sort by: Name (A-Z)',
            field: 'label',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Name (Z-A)',
            value: 'Sort by: Name (Z-A)',
            field: 'label',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Stock Quantity (Low to High)',
            value: 'Sort by: Stock (Low to High)',
            field: 'stock_quantity',
            type: 'number',
            direction: 'asc'
        },
        {
            label: 'Stock Quantity (High to Low)',
            value: 'Sort by: Stock (High to Low)',
            field: 'stock_quantity',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'Recently Modified',
            value: 'Sort by: Recently Modified',
            field: 'modified_at',
            type: 'date',
            direction: 'desc'
        }
    ],
    filterOptions: [
        {
            key: 'out_of_stock',
            label: 'Out of Stock Only',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.stock_quantity <= 0) : true;
            }
        },
        {
            key: 'category',
            label: 'Category',
            type: 'multiselect',
            field: 'category'
        }
    ]
};

export const ORDER_FILTER_CONFIG = {
    searchFields: ['order_number', 'first_name', 'last_name', 'email', 'tracking_number'],
    sortOptions: [
        {
            label: 'Latest',
            value: 'Sort by: Latest',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest',
            value: 'Sort by: Oldest',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        },
        {
            label: 'Order Number (A-Z)',
            value: 'Sort by: Order Number (A-Z)',
            field: 'order_number',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Order Number (Z-A)',
            value: 'Sort by: Order Number (Z-A)',
            field: 'order_number',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Customer Name (A-Z)',
            value: 'Sort by: Customer Name (A-Z)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();
                return aName.localeCompare(bName);
            }
        },
        {
            label: 'Customer Name (Z-A)',
            value: 'Sort by: Customer Name (Z-A)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();
                return bName.localeCompare(aName);
            }
        },
        {
            label: 'Total Amount (High to Low)',
            value: 'Sort by: Total Amount (High to Low)',
            field: 'total_amount',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'Total Amount (Low to High)',
            value: 'Sort by: Total Amount (Low to High)',
            field: 'total_amount',
            type: 'number',
            direction: 'asc'
        },
        {
            label: 'Status (Pending First)',
            value: 'Sort by: Status (Pending First)',
            sortFunction: (a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return 0;
            }
        },
        {
            label: 'Recently Shipped',
            value: 'Sort by: Recently Shipped',
            field: 'shipped_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Recently Delivered',
            value: 'Sort by: Recently Delivered',
            field: 'delivered_at',
            type: 'date',
            direction: 'desc'
        }
    ],
    filterOptions: [
        {
            key: 'status',
            label: 'Order Status',
            type: 'multiselect',
            field: 'status'
        },
        {
            key: 'payment_status',
            label: 'Payment Status',
            type: 'multiselect',
            field: 'payment_status'
        },
        {
            key: 'payment_method',
            label: 'Payment Method',
            type: 'multiselect',
            field: 'payment_method'
        },
        {
            key: 'amount_range',
            label: 'Amount Range',
            type: 'range',
            field: 'total_amount'
        },
        {
            key: 'date_range',
            label: 'Order Date',
            type: 'date_range',
            field: 'created_at'
        },
        {
            key: 'shipped_date_range',
            label: 'Shipped Date',
            type: 'date_range',
            field: 'shipped_at'
        },
        {
            key: 'delivered_date_range',
            label: 'Delivered Date',
            type: 'date_range',
            field: 'delivered_at'
        },
        {
            key: 'has_tracking',
            label: 'Has Tracking Number',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.tracking_number && item.tracking_number.trim() !== '') : true;
            }
        },
        {
            key: 'has_admin_notes',
            label: 'Has Admin Notes',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.admin_notes && item.admin_notes.trim() !== '') : true;
            }
        }
    ]
};

export const STOCKS_FILTER_CONFIG = {
    searchFields: ['product_name', 'category', 'first_name', 'last_name', 'notes'],
    sortOptions: [
        {
            label: 'Latest',
            value: 'Sort by: Latest',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest',
            value: 'Sort by: Oldest',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        },
        {
            label: 'Product Name (A-Z)',
            value: 'Sort by: Product Name (A-Z)',
            field: 'product_name',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Product Name (Z-A)',
            value: 'Sort by: Product Name (Z-A)',
            field: 'product_name',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Quantity Change (High to Low)',
            value: 'Sort by: Quantity Change (High to Low)',
            field: 'quantity_change',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'Quantity Change (Low to High)',
            value: 'Sort by: Quantity Change (Low to High)',
            field: 'quantity_change',
            type: 'number',
            direction: 'asc'
        },
        {
            label: 'New Quantity (High to Low)',
            value: 'Sort by: New Quantity (High to Low)',
            field: 'new_quantity',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'New Quantity (Low to High)',
            value: 'Sort by: New Quantity (Low to High)',
            field: 'new_quantity',
            type: 'number',
            direction: 'asc'
        }
    ],
    filterOptions: [
        {
            key: 'stock_history_type',
            label: 'Transaction Type',
            type: 'multiselect',
            field: 'stock_history_type'
        },
        {
            key: 'quantity_change_range',
            label: 'Quantity Change Range',
            type: 'range',
            field: 'quantity_change'
        },
        {
            key: 'new_quantity_range',
            label: 'New Quantity Range',
            type: 'range',
            field: 'new_quantity'
        },
        {
            key: 'date_range',
            label: 'Transaction Date',
            type: 'date_range',
            field: 'created_at'
        },
        {
            key: 'positive_only',
            label: 'Positive Changes Only',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.quantity_change > 0) : true;
            }
        },
        {
            key: 'negative_only',
            label: 'Negative Changes Only',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.quantity_change < 0) : true;
            }
        },
        {
            key: 'has_notes',
            label: 'Has Notes',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.notes && item.notes.trim() !== '') : true;
            }
        }
    ]
};

export const COLLECTIONS_FILTER_CONFIG = {
    searchFields: ['label', 'description'],
    sortOptions: [
        {
            label: 'Price (Low to High)',
            value: 'Sort by: Price (Low to High)',
            field: 'price',
            type: 'number',
            direction: 'asc'
        },
        {
            label: 'Price (High to Low)',
            value: 'Sort by: Price (High to Low)',
            field: 'price',
            type: 'number',
            direction: 'desc'
        },
        {
            label: 'Name (A-Z)',
            value: 'Sort by: Name (A-Z)',
            field: 'label',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Name (Z-A)',
            value: 'Sort by: Name (Z-A)',
            field: 'label',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Newest First',
            value: 'Sort by: Newest First',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest First',
            value: 'Sort by: Oldest First',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        },
        ...(typeof window !== 'undefined' && window.INCLUDE_POPULARITY_SORT ? [
            {
                label: 'Most Popular',
                value: 'Sort by: Popularity (Most Popular)',
                sortFunction: (a, b) => {
                    const aPopularity = (a.views_count || 0) + (a.orders_count || 0) * 3;
                    const bPopularity = (b.views_count || 0) + (b.orders_count || 0) * 3;
                    return bPopularity - aPopularity;
                }
            },
            {
                label: 'Least Popular',
                value: 'Sort by: Popularity (Least Popular)',
                sortFunction: (a, b) => {
                    const aPopularity = (a.views_count || 0) + (a.orders_count || 0) * 3;
                    const bPopularity = (b.views_count || 0) + (b.orders_count || 0) * 3;
                    return aPopularity - bPopularity;
                }
            }
        ] : [])
    ],
    filterOptions: [
        {
            key: 'category_id',
            label: 'Category',
            type: 'select',
            field: 'category_id'
        },
        {
            key: 'subcategory_id',
            label: 'Subcategory',
            type: 'select',
            field: 'subcategory_id'
        },
        {
            key: 'price_range',
            label: 'Price Range',
            type: 'range',
            field: 'price'
        },
        {
            key: 'in_stock',
            label: 'In Stock Only',
            type: 'custom',
            filterFunction: (item, value) => {
                return value ? (item.stock_quantity > 0) : true;
            }
        }
    ]
};

export const CUSTOMER_FILTER_CONFIG = {
    searchFields: ['first_name', 'last_name', 'email', 'phone'],
    sortOptions: [
        {
            label: 'Name (A-Z)',
            value: 'Sort by: Name (A-Z)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();
                return aName.localeCompare(bName);
            }
        },
        {
            label: 'Name (Z-A)',
            value: 'Sort by: Name (Z-A)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();
                return bName.localeCompare(aName);
            }
        },
        {
            label: 'Email (A-Z)',
            value: 'Sort by: Email (A-Z)',
            field: 'email',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Email (Z-A)',
            value: 'Sort by: Email (Z-A)',
            field: 'email',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Newest First',
            value: 'Sort by: Newest First',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest First',
            value: 'Sort by: Oldest First',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        }
    ],
    filterOptions: [
        {
            key: 'email_verified',
            label: 'Email Verified',
            type: 'boolean',
            field: 'email_verified'
        },
        {
            key: 'registration_date',
            label: 'Registration Date',
            type: 'date_range',
            field: 'created_at'
        }
    ]
};

export const ADMIN_FILTER_CONFIG = {
    searchFields: ['first_name', 'last_name', 'email', 'phone'],
    sortOptions: [
        {
            label: 'Name (A-Z)',
            value: 'Sort by: Name (A-Z)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();
                return aName.localeCompare(bName);
            }
        },
        {
            label: 'Name (Z-A)',
            value: 'Sort by: Name (Z-A)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().trim();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase().trim();
                return bName.localeCompare(aName);
            }
        },
        {
            label: 'Email (A-Z)',
            value: 'Sort by: Email (A-Z)',
            field: 'email',
            type: 'string',
            direction: 'asc'
        },
        {
            label: 'Email (Z-A)',
            value: 'Sort by: Email (Z-A)',
            field: 'email',
            type: 'string',
            direction: 'desc'
        },
        {
            label: 'Newest First',
            value: 'Sort by: Newest First',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest First',
            value: 'Sort by: Oldest First',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        }
    ],
    filterOptions: [
        {
            key: 'email_verified',
            label: 'Email Verified',
            type: 'boolean',
            field: 'email_verified'
        },
        {
            key: 'registration_date',
            label: 'Registration Date',
            type: 'date_range',
            field: 'created_at'
        }
    ]
};

export const AUDIT_FILTER_CONFIG = {
    searchFields: ['email', 'first_name', 'last_name', 'details'],
    sortOptions: [
        {
            label: 'Latest',
            value: 'Sort by: Latest',
            field: 'created_at',
            type: 'date',
            direction: 'desc'
        },
        {
            label: 'Oldest',
            value: 'Sort by: Oldest',
            field: 'created_at',
            type: 'date',
            direction: 'asc'
        },
        {
            label: 'User (A-Z)',
            value: 'Sort by: User (A-Z)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || '';
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email || '';
                return aName.localeCompare(bName);
            }
        },
        {
            label: 'User (Z-A)',
            value: 'Sort by: User (Z-A)',
            sortFunction: (a, b) => {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || '';
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email || '';
                return bName.localeCompare(aName);
            }
        },
        {
            label: 'Action Type (A-Z)',
            value: 'Sort by: Action Type (A-Z)',
            sortFunction: (a, b) => {
                const aAction = a.action_type || '';
                const bAction = b.action_type || '';
                return aAction.localeCompare(bAction);
            }
        },
        {
            label: 'Action Type (Z-A)',
            value: 'Sort by: Action Type (Z-A)',
            sortFunction: (a, b) => {
                const aAction = a.action_type || '';
                const bAction = b.action_type || '';
                return bAction.localeCompare(aAction);
            }
        }
    ],
    filterOptions: [
        {
            key: 'action_type',
            label: 'Action Type',
            type: 'select',
            field: 'action_type'
        },
        {
            key: 'user_id',
            label: 'User ID',
            type: 'text',
            field: 'user_id'
        },
        {
            key: 'user_role', // Add this new filter
            label: 'User Role',
            type: 'select',
            field: 'role',
            options: [
                { value: '', label: 'All Users' },
                { value: 'admin', label: 'Admin' },
                { value: 'customer', label: 'Customer' }
            ]
        },
        {
            key: 'date_range',
            label: 'Date Range',
            type: 'date_range',
            field: 'created_at'
        }
    ]
};

// Add role-specific action types
export const ADMIN_ACTION_TYPES = [
    'admin_product_create',
    'admin_product_update', 
    'admin_product_delete',
    'admin_category_create',
    'admin_category_update',
    'admin_category_delete',
    'admin_stock_update',
    'admin_stock_restock',
    'admin_settings_update',
    'admin_account_create',
    'admin_account_update',
    'admin_account_suspend',
    'admin_account_remove',
    'order_invoice_print',
    'order_invoice_report_print',
    'auth_signin',
    'auth_signout',
    'auth_password_change',
    'profile_update',
    'profile_preferences_update'
];

export const CUSTOMER_ACTION_TYPES = [
    'auth_signin',
    'auth_signup',
    'auth_signout',
    'auth_password_change',
    'profile_update',
    'profile_preferences_update',
    'product_view',
    'cart_add',
    'cart_remove',
    'cart_update',
    'wishlist_add',
    'wishlist_remove',
    'order_create',
    'order_update',
    'order_cancel',
    'customer_account_remove'
];

// Function to get filtered action types based on user role
export const getActionTypesByRole = (role) => {
    if (!role) return ACTION_TYPE_LABELS;
    
    const actionTypes = role === 'admin' ? ADMIN_ACTION_TYPES : CUSTOMER_ACTION_TYPES;
    return Object.fromEntries(
        Object.entries(ACTION_TYPE_LABELS).filter(([key]) => actionTypes.includes(key))
    );
};

export const ACTION_TYPE_LABELS = {
    'auth_signin': 'Sign In',
    'auth_signup': 'Sign Up',
    'auth_signout': 'Sign Out',
    'auth_password_change': 'Password Change',
    'profile_update': 'Profile Update',
    'profile_preferences_update': 'Update Preferences', 
    'account_suspension': 'Account Suspension',
    'account_deletion': 'Account Deletion',
    'product_view': 'Product View',
    'cart_add': 'Add to Cart',
    'cart_remove': 'Remove from Cart',
    'cart_update': 'Update Cart',
    'wishlist_add': 'Add to Wishlist',
    'wishlist_remove': 'Remove from Wishlist',
    'order_create': 'Create Order',
    'order_update': 'Update Order',
    'order_cancel': 'Cancel Order',
    'admin_product_create': 'Create Product',
    'admin_product_update': 'Update Product',
    'admin_product_delete': 'Delete Product',
    'admin_category_create': 'Create Category',
    'admin_category_update': 'Update Category',
    'admin_category_delete': 'Delete Category',
    'admin_stock_update': 'Update Stock',
    'admin_stock_restock': 'Restock Inventory', 
    'admin_settings_update': 'Update Settings',
    'admin_account_create': 'Admin Created An Account',
    'admin_account_update': 'Admin Updated An Account',
    'admin_account_suspend': 'Admin Suspended An Account',
    'order_invoice_print': 'Print Invoice',
    'order_invoice_report_print': 'Print Invoice Report',
    'admin_account_remove': 'Account Removed',
    'customer_account_remove': 'Account Removed',
};

