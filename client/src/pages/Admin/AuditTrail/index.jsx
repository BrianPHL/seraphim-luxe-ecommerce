import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth, useToast, useAuditTrail } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { Button, TableHeader, TableFooter, Modal } from '@components';
import { AUDIT_FILTER_CONFIG, ACTION_TYPE_LABELS, getActionTypesByRole } from '@utils/configs';
import styles from './audit-trail.module.css';

const ITEMS_PER_PAGE = 10;

const AuditTrail = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const {
        auditLogs,
        loading,
        stats,
        filters,
        fetchAuditLogs,
        fetchStats,
        updateFilters,
        clearFilters
    } = useAuditTrail();

    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const queryPage = parseInt(searchParams.get('page')) || 1;
    const querySort = searchParams.get('sort') || 'Sort by: Latest';
    const querySearch = searchParams.get('search') || '';

    const {
        data: filteredLogs,
        searchValue,
        sortValue,
        handleSearchChange,
        handleSortChange,
        sortOptions
    } = useDataFilter(auditLogs, AUDIT_FILTER_CONFIG);

    const {
        currentPage,
        totalPages,
        currentItems: paginatedLogs,
        handlePageChange,
        resetPagination,
    } = usePagination(filteredLogs, ITEMS_PER_PAGE, queryPage);

    const [selectedUserRole, setSelectedUserRole] = useState('');

    const getFilteredActionTypes = () => {
        return getActionTypesByRole(selectedUserRole);
    };
    
    // Load audit logs on mount and when filters change
    useEffect(() => {
        fetchAuditLogs({ search: searchValue });
    }, [filters, searchValue]);

    // Sync URL params
    useEffect(() => {
        if (searchValue !== querySearch) {
            handleSearchChange(querySearch);
        }
    }, [querySearch]);

    useEffect(() => {
        if (sortValue !== querySort) {
            handleSortChange(querySort);
        }
    }, [querySort]);

    useEffect(() => {
        if (currentPage !== queryPage) {
            handlePageChange(queryPage);
        }
    }, [queryPage]);

    const updateSearchParams = ({ page, sort, search, ...filterParams }) => {
        const params = new URLSearchParams(searchParams);
        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);
        
        Object.entries(filterParams).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        
        setSearchParams(params);
    };

    const handleSearchChangeWrapped = (value) => {
        handleSearchChange(value);
        resetPagination();
        updateSearchParams({ search: value, page: 1 });
    };

    const handleSortChangeWrapped = (sort) => {
        handleSortChange(sort);
        resetPagination();
        updateSearchParams({ sort, page: 1 });
    };

    const handlePageChangeWrapped = (page) => {
        handlePageChange(page);
        updateSearchParams({ page });
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { [key]: value };
        
        // If user role changes, reset action type filter
        if (key === 'user_role') {
            setSelectedUserRole(value);
            newFilters.action_type = ''; // Reset action type when role changes
        }
        
        updateFilters(newFilters);
        resetPagination();
        updateSearchParams({ page: 1, [key]: value });
    };

    const handleClearFilters = () => {
        clearFilters();
        setSelectedUserRole('');
        resetPagination();
        updateSearchParams({ 
            page: 1, 
            action_type: '', 
            start_date: '', 
            end_date: '', 
            user_id: '',
            user_role: '' 
        });
    };

    const viewLogDetails = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',  
            hour12: true,
            timeZone: 'Asia/Manila'
        });
    };

    const formatFieldName = (fieldName) => {
        const fieldMappings = {
            'label': 'Product Name',
            'price': 'Price',
            'category_id': 'Category',
            'subcategory_id': 'Subcategory',
            'description': 'Description',
            'stock_quantity': 'Stock Quantity',
            'stock_threshold': 'Stock Threshold',
            'is_featured': 'Featured Status',
            'image_url': 'Image URL'
        };
        return fieldMappings[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatFieldValue = (fieldName, value) => {
        if (value === null || value === undefined) return 'Not set';
        
        switch (fieldName) {
            case 'price':
                return `$${parseFloat(value).toFixed(2)}`;
            case 'is_featured':
                return value ? 'Yes' : 'No';
            case 'stock_quantity':
            case 'stock_threshold':
                return `${value} units`;
            default:
                return value.toString();
        }
    };

    const getActionIcon = (actionType) => {
        const iconMap = {
            'auth_signin': 'fa-solid fa-sign-in-alt',
            'auth_signup': 'fa-solid fa-user-plus',
            'auth_signout': 'fa-solid fa-sign-out-alt',
            'auth_password_change': 'fa-solid fa-key', 
            'profile_update': 'fa-solid fa-user-edit',
            'profile_preferences_update': 'fa-solid fa-cog', 
            'cart_add': 'fa-solid fa-shopping-cart',
            'cart_remove': 'fa-solid fa-cart-minus',
            'cart_update': 'fa-solid fa-cart-arrow-down',
            'wishlist_add': 'fa-solid fa-heart',
            'wishlist_remove': 'fa-solid fa-heart-broken',
            'order_create': 'fa-solid fa-shopping-bag',
            'order_update': 'fa-solid fa-edit',
            'order_cancel': 'fa-solid fa-times-circle',
            'admin_product_create': 'fa-solid fa-plus-circle',
            'admin_product_update': 'fa-solid fa-edit',
            'admin_product_delete': 'fa-solid fa-trash',
            'admin_category_create': 'fa-solid fa-folder-plus',
            'admin_category_update': 'fa-solid fa-folder-edit',
            'admin_category_delete': 'fa-solid fa-folder-minus',
            'admin_stock_update': 'fa-solid fa-boxes',
            'admin_stock_restock': 'fa-solid fa-truck-loading',
            'admin_settings_update': 'fa-solid fa-cog',
            'admin_account_create': 'fa-solid fa-user-plus',
            'admin_account_update': 'fa-solid fa-user-edit',
            'admin_account_suspend': 'fa-solid fa-user-lock',
            'order_invoice_print': 'fa-solid fa-print',
            'order_invoice_report_print': 'fa-solid fa-print',
            'admin_account_remove': 'fa-solid fa-user-minus'
        };
        return iconMap[actionType] || 'fa-solid fa-info-circle';
    };

    const getActionColor = (actionType) => {
        if (actionType.includes('delete') || actionType.includes('cancel') || actionType.includes('remove')) {
            return 'red';
        }
        if (actionType.includes('update')) {
            return 'green';
        }
        if (actionType.includes('create')) {
            return 'gray';
        }
        return 'gray';
    };

    if (loading && auditLogs.length === 0) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['section']}>
                    <div className={styles['empty-table']}>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading audit logs...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['wrapper']}>
            {/* Overview Section */}
            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Audit Trail Overview</h2>
                    <Button
                        type="secondary"
                        label="Refresh"
                        icon="fa-solid fa-refresh"
                        action={() => {
                            fetchAuditLogs({ search: searchValue });
                            fetchStats();
                        }}
                    />
                </div>
                
                {stats && (
                    <div className={styles['overview']}>
                        <div className={styles['overview-item']}>
                            <div className={styles['overview-item-header']}>
                                <h3>Recent Activity (24h)</h3>
                            </div>
                            <h2>{stats.recentActivityCount || 0}</h2>
                        </div>
                        <div className={styles['overview-item']}>
                            <div className={styles['overview-item-header']}>
                                <h3>Total Logs</h3>
                            </div>
                            <h2>{auditLogs.length}</h2>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles['divider']}></div>

            {/* Filters Section */}
            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Filters</h2>
                </div>
                
                <div className={styles['filters']}>
                    {/* User Role Filter */}
                    <div className={styles['filter-group']}>
                        <label>User Role:</label>
                        <select
                            value={filters.user_role || ''}
                            onChange={(e) => handleFilterChange('user_role', e.target.value)}
                            className={styles['filter-select']}
                        >
                            <option value="">All Users</option>
                            <option value="admin">Admin</option>
                            <option value="customer">Customer</option>
                        </select>
                    </div>

                    {/* Action Type Filter - now filtered based on user role */}
                    <div className={styles['filter-group']}>
                        <label>Action Type:</label>
                        <select
                            value={filters.action_type}
                            onChange={(e) => handleFilterChange('action_type', e.target.value)}
                            className={styles['filter-select']}
                        >
                            <option value="">All Actions</option>
                            {Object.entries(getFilteredActionTypes()).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className={styles['filter-group']}>
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            className={styles['filter-input']}
                        />
                    </div>
                    
                    <div className={styles['filter-group']}>
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            className={styles['filter-input']}
                        />
                    </div>
                    
                    <Button
                        type="secondary"
                        label="Clear Filters"
                        icon="fa-solid fa-times"
                        action={handleClearFilters}
                    />
                </div>
            </div>

            {/* Audit Logs Section */}
            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Audit Logs</h2>
                </div>

                <TableHeader
                    currentSort={sortValue}
                    searchInput={searchValue}
                    onSortChange={handleSortChangeWrapped}
                    onSearchChange={handleSearchChangeWrapped}
                    sortOptions={sortOptions}
                    searchPlaceholder="Search by user, email, or details..."
                    withPagination={true}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedLogs.length} out of ${filteredLogs.length} results`}
                    sortLabel={sortValue}
                    onPageChange={handlePageChangeWrapped}
                />

                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']}>
                            <div className={styles['table-cell']}>Action</div>
                            <div className={styles['table-cell']}>User</div>
                            <div className={styles['table-cell']}>Resource</div>
                            <div className={styles['table-cell']}>Date & Time</div>
                            <div className={styles['table-cell']}>Actions</div>
                        </div>
                        <div className={styles['table-body']}>
                            {paginatedLogs.map(log => (
                                <div key={log.id} className={styles['table-row']}>
                                    <div className={styles['table-cell']}>
                                        <div className={styles['action-info']}>
                                            <div className={`${styles['action-badge']} ${styles[getActionColor(log.action_type)]}`}>
                                                <i className={getActionIcon(log.action_type)}></i>
                                                <span>{ACTION_TYPE_LABELS[log.action_type] || log.action_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <div className={styles['user-info']}>
                                            {(() => {
                                                // First, try to get data from direct log properties (most reliable)
                                                let actorName = '';
                                                let actorEmail = '';
                                                let actorRole = '';

                                                // Priority 1: Direct log properties (from your previous structure)
                                                if (log.first_name && log.last_name) {
                                                    actorName = `${log.first_name} ${log.last_name}`;
                                                } else if (log.name) {
                                                    actorName = log.name;
                                                }

                                                if (log.email) {
                                                    actorEmail = log.email;
                                                }

                                                if (log.role) {
                                                    actorRole = log.role;
                                                }

                                                // Priority 2: For sign-up and other creation actions, check new_values first
                                                if ((!actorName || !actorEmail || !actorRole) && ['auth_signup', 'admin_account_create'].includes(log.action_type)) {
                                                    try {
                                                        const newValues = log.new_values ? JSON.parse(log.new_values) : null;
                                                        if (newValues) {
                                                            if (!actorName && newValues.name) {
                                                                actorName = newValues.name;
                                                            } else if (!actorName && newValues.first_name && newValues.last_name) {
                                                                actorName = `${newValues.first_name} ${newValues.last_name}`;
                                                            }
                                                            if (!actorEmail && newValues.email) {
                                                                actorEmail = newValues.email;
                                                            }
                                                            if (!actorRole && newValues.role) {
                                                                actorRole = newValues.role;
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.warn('Error parsing new_values:', e);
                                                    }
                                                }

                                                // Priority 3: Fallback to old_values for other actions
                                                if (!actorName || !actorEmail || !actorRole) {
                                                    try {
                                                        const oldValues = log.old_values ? JSON.parse(log.old_values) : null;
                                                        if (oldValues) {
                                                            if (!actorName && oldValues.name) {
                                                                actorName = oldValues.name;
                                                            } else if (!actorName && oldValues.first_name && oldValues.last_name) {
                                                                actorName = `${oldValues.first_name} ${oldValues.last_name}`;
                                                            }
                                                            if (!actorEmail && oldValues.email) {
                                                                actorEmail = oldValues.email;
                                                            }
                                                            if (!actorRole && oldValues.role) {
                                                                actorRole = oldValues.role;
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.warn('Error parsing old_values:', e);
                                                    }
                                                }

                                                // Priority 4: If still missing and not a sign-up, check new_values
                                                if ((!actorName || !actorEmail || !actorRole) && !['auth_signup', 'admin_account_create'].includes(log.action_type)) {
                                                    try {
                                                        const newValues = log.new_values ? JSON.parse(log.new_values) : null;
                                                        if (newValues) {
                                                            if (!actorName && newValues.name) {
                                                                actorName = newValues.name;
                                                            } else if (!actorName && newValues.first_name && newValues.last_name) {
                                                                actorName = `${newValues.first_name} ${newValues.last_name}`;
                                                            }
                                                            if (!actorEmail && newValues.email) {
                                                                actorEmail = newValues.email;
                                                            }
                                                            if (!actorRole && newValues.role) {
                                                                actorRole = newValues.role;
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.warn('Error parsing new_values:', e);
                                                    }
                                                }

                                                // Final fallbacks
                                                actorName = actorName || 'Unknown User';
                                                actorEmail = actorEmail || 'unknown@email.com';
                                                actorRole = actorRole || 'user';

                                                // For sign-up actions, we always have valid user data in new_values
                                                const hasValidUser = log.action_type === 'auth_signup' || 
                                                                    log.action_type === 'admin_account_create' || 
                                                                    (log.user_id && log.user_id !== 'null');

                                                return hasValidUser ? (
                                                    <>
                                                        <span className={styles['user-name']}>{actorName}</span>
                                                        <span className={styles['user-email']}>{actorEmail}</span>
                                                        <span className={`${styles['role-badge']} ${styles[actorRole.toLowerCase().replace(/\s+/g, '-')]}`}>
                                                            {actorRole}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className={styles['anonymous']}>Anonymous</span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {log.resource_type && (
                                            <span className={styles['resource']}>
                                                {log.resource_type} #{log.resource_id}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {formatDateTime(log.created_at)}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <Button
                                            type="secondary"
                                            label="View Details"
                                            icon="fa-solid fa-eye"
                                            action={() => viewLogDetails(log)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {paginatedLogs.length === 0 && (
                                <div className={styles['empty-state']}>
                                    <p>No audit logs found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <TableFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedLogs.length} out of ${filteredLogs.length} results`}
                    sortLabel={sortValue}
                    onPageChange={handlePageChangeWrapped}
                />
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <Modal
                    label="Audit Log Details"
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    size="large"
                >
                    <div className={styles['log-details']}>
                        <div className={styles['detail-section']}>
                            <h4>Action Information</h4>
                            <div className={styles['detail-grid']}>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Action Type:</span>
                                    <span className={styles['detail-value']}>
                                        {ACTION_TYPE_LABELS[selectedLog.action_type] || selectedLog.action_type}
                                    </span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Date & Time:</span>
                                    <span className={styles['detail-value']}>
                                        {formatDateTime(selectedLog.created_at)}
                                    </span>
                                </div>
                                {selectedLog.resource_type && (
                                    <div className={styles['detail-item']}>
                                        <span className={styles['detail-label']}>Resource:</span>
                                        <span className={styles['detail-value']}>
                                            {selectedLog.resource_type} #{selectedLog.resource_id}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles['detail-section']}>
                            <h4>User Information</h4>
                            <div className={styles['detail-grid']}>
                            <div className={styles['detail-item']}>
                                <span className={styles['detail-label']}>User:</span>
                                <span className={styles['detail-value']}>
                                    {(() => {
                                        // Same logic as above but for modal
                                        let actorName = '';
                                        let actorEmail = '';

                                        // Priority 1: Direct log properties
                                        if (selectedLog.first_name && selectedLog.last_name) {
                                            actorName = `${selectedLog.first_name} ${selectedLog.last_name}`;
                                        } else if (selectedLog.name) {
                                            actorName = selectedLog.name;
                                        }

                                        if (selectedLog.email) {
                                            actorEmail = selectedLog.email;
                                        }

                                        // Priority 2: Fallback to old_values
                                        if (!actorName || !actorEmail) {
                                            try {
                                                const oldValues = selectedLog.old_values ? JSON.parse(selectedLog.old_values) : null;
                                                if (oldValues) {
                                                    if (!actorName && oldValues.name) {
                                                        actorName = oldValues.name;
                                                    } else if (!actorName && oldValues.first_name && oldValues.last_name) {
                                                        actorName = `${oldValues.first_name} ${oldValues.last_name}`;
                                                    }
                                                    if (!actorEmail && oldValues.email) {
                                                        actorEmail = oldValues.email;
                                                    }
                                                }
                                            } catch (e) {
                                                console.warn('Error parsing old_values:', e);
                                            }
                                        }

                                        // Priority 3: Fallback to new_values
                                        if (!actorName || !actorEmail) {
                                            try {
                                                const newValues = selectedLog.new_values ? JSON.parse(selectedLog.new_values) : null;
                                                if (newValues) {
                                                    if (!actorName && newValues.name) {
                                                        actorName = newValues.name;
                                                    } else if (!actorName && newValues.first_name && newValues.last_name) {
                                                        actorName = `${newValues.first_name} ${newValues.last_name}`;
                                                    }
                                                    if (!actorEmail && newValues.email) {
                                                        actorEmail = newValues.email;
                                                    }
                                                }
                                            } catch (e) {
                                                console.warn('Error parsing new_values:', e);
                                            }
                                        }

                                        // Final fallbacks
                                        actorName = actorName || (selectedLog.user_id && selectedLog.user_id !== 'null' ? `User ID: ${selectedLog.user_id}` : 'Anonymous');
                                        actorEmail = actorEmail || 'unknown@email.com';

                                        return `${actorName} (${actorEmail})`;
                                    })()}
                                </span>
                            </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>Role:</span>
                                    <span className={styles['detail-value']}>
                                        {(() => {
                                            const actorRole =
                                                selectedLog.role ||
                                                (selectedLog.old_values && JSON.parse(selectedLog.old_values).role) ||
                                                (selectedLog.new_values && JSON.parse(selectedLog.new_values).role) ||
                                                "N/A";
                                            return actorRole;
                                        })()}
                                    </span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>IP Address:</span>
                                    <span className={styles['detail-value']}>{selectedLog.ip_address}</span>
                                </div>
                                <div className={styles['detail-item']}>
                                    <span className={styles['detail-label']}>User Agent:</span>
                                    <span className={styles['detail-value']}>{selectedLog.user_agent}</span>
                                </div>
                            </div>
                        </div>

                        {(selectedLog.old_values || selectedLog.new_values) && (
                            <div className={styles['detail-section']}>
                                <h4>Data Changes</h4>
                                {selectedLog.old_values && (
                                    <div className={styles['json-display']}>
                                        <h5>Old Values:</h5>
                                        <pre>{JSON.stringify(JSON.parse(selectedLog.old_values), null, 2)}</pre>
                                    </div>
                                )}
                                {selectedLog.new_values && (
                                    <div className={styles['json-display']}>
                                        <h5>New Values:</h5>
                                        <pre>{JSON.stringify(JSON.parse(selectedLog.new_values), null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedLog.details && (
                            <div className={styles['detail-section']}>
                                <h4>Additional Details</h4>
                                <p>{selectedLog.details}</p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AuditTrail;