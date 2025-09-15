import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Accounts.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useAuth, useToast } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { CUSTOMER_FILTER_CONFIG, ADMIN_FILTER_CONFIG, getErrorMessage } from '@utils';

const ITEMS_PER_PAGE = 10;

const Accounts = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryCustomerPage = parseInt(searchParams.get('customerPage') || '1', 10);
    const queryCustomerSort = searchParams.get('customerSort') || 'Sort by: Name (A-Z)';
    const queryCustomerSearch = searchParams.get('customerSearch') || '';
    const queryAdminPage = parseInt(searchParams.get('adminPage') || '1', 10);
    const queryAdminSort = searchParams.get('adminSort') || 'Sort by: Name (A-Z)';
    const queryAdminSearch = searchParams.get('adminSearch') || '';
    const { user, userList, fetchUsers, suspendAccount, editAccount, signUp, remove, updatePersonalInfo } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountDetails, setAccountDetails] = useState({
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        role: 'customer',
        password: ''
    });

    const customerAccounts = userList.filter(account => account.role === 'customer');
    const adminAccounts = userList.filter(account => account.role === 'admin');

    // Customer table data filtering and pagination
    const {
        data: filteredCustomers,
        searchValue: customerSearchValue,
        sortValue: customerSortValue,
        handleSearchChange: handleCustomerSearchChange,
        handleSortChange: handleCustomerSortChange,
        sortOptions: customerSortOptions,
        totalItems: totalCustomers,
        filteredItems: filteredCustomersCount
    } = useDataFilter(customerAccounts, CUSTOMER_FILTER_CONFIG);

    const {
        data: filteredAdmins,
        searchValue: adminSearchValue,
        sortValue: adminSortValue,
        handleSearchChange: handleAdminSearchChange,
        handleSortChange: handleAdminSortChange,
        sortOptions: adminSortOptions,
        totalItems: totalAdmins,
        filteredItems: filteredAdminsCount
    } = useDataFilter(adminAccounts, ADMIN_FILTER_CONFIG);

    const {
        currentPage: customerCurrentPage,
        totalPages: customerTotalPages,
        currentItems: paginatedCustomers,
        handlePageChange: handleCustomerPageChange,
        resetPagination: resetCustomerPagination,
    } = usePagination(filteredCustomers, ITEMS_PER_PAGE, queryCustomerPage);

    const {
        currentPage: adminCurrentPage,
        totalPages: adminTotalPages,
        currentItems: paginatedAdmins,
        handlePageChange: handleAdminPageChange,
        resetPagination: resetAdminPagination,
    } = usePagination(filteredAdmins, ITEMS_PER_PAGE, queryAdminPage);

    const handleSuspendAccount = async (accountId, isSuspended) => {
        await fetchUsers();
        await suspendAccount(accountId, isSuspended);
        closeModal();
    };

    const handleEditAccount = async () => {
        await updatePersonalInfo(accountDetails);
        await fetchUsers();
        closeModal();
    };

    const handleAddAdmin = async () => {

            const result = await signUp({
                email: accountDetails.email,
                firstName: accountDetails.first_name,
                lastName: accountDetails.last_name,
                phoneNumber: accountDetails.phone_number,
                password: accountDetails.password,
                role: accountDetails.role
            });
            
            if (result.error)
                showToast(getErrorMessage(result.error.code), 'error');
            
            closeModal();
    };

    const handleDeleteAdmin = async () => {
        if (selectedAccount) {
            await remove(selectedAccount.id);
            await fetchUsers();
            closeModal();
        }
    };

    useEffect(() => {
        if (customerSearchValue !== queryCustomerSearch) {
            handleCustomerSearchChange(queryCustomerSearch);
        }
    }, [queryCustomerSearch]);

    useEffect(() => {
        if (customerSortValue !== queryCustomerSort) {
            handleCustomerSortChange(queryCustomerSort);
        }
    }, [queryCustomerSort]);

    useEffect(() => {
        if (customerCurrentPage !== queryCustomerPage) {
            handleCustomerPageChange(queryCustomerPage);
        }
    }, [queryCustomerPage]);

    useEffect(() => {
        if (adminSearchValue !== queryAdminSearch) {
            handleAdminSearchChange(queryAdminSearch);
        }
    }, [queryAdminSearch]);

    useEffect(() => {
        if (adminSortValue !== queryAdminSort) {
            handleAdminSortChange(queryAdminSort);
        }
    }, [queryAdminSort]);

    useEffect(() => {
        if (adminCurrentPage !== queryAdminPage) {
            handleAdminPageChange(queryAdminPage);
        }
    }, [queryAdminPage]);

    const updateCustomerSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);
        if (page !== undefined) params.set('customerPage', page);
        if (sort !== undefined) params.set('customerSort', sort);
        if (search !== undefined) params.set('customerSearch', search);
        setSearchParams(params);
    };

    const updateAdminSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);
        if (page !== undefined) params.set('adminPage', page);
        if (sort !== undefined) params.set('adminSort', sort);
        if (search !== undefined) params.set('adminSearch', search);
        setSearchParams(params);
    };

    const handleCustomerSearch = (searchValue) => {
        handleCustomerSearchChange(searchValue);
        resetCustomerPagination();
        updateCustomerSearchParams({ page: 1, search: searchValue });
    };

    const handleCustomerSort = (sortValue) => {
        handleCustomerSortChange(sortValue);
        resetCustomerPagination();
        updateCustomerSearchParams({ page: 1, sort: sortValue });
    };

    const handleCustomerPagination = (page) => {
        handleCustomerPageChange(page);
        updateCustomerSearchParams({ page });
    };

    const handleAdminSearch = (searchValue) => {
        handleAdminSearchChange(searchValue);
        resetAdminPagination();
        updateAdminSearchParams({ page: 1, search: searchValue });
    };

    const handleAdminSort = (sortValue) => {
        handleAdminSortChange(sortValue);
        resetAdminPagination();
        updateAdminSearchParams({ page: 1, sort: sortValue });
    };

    const handleAdminPagination = (page) => {
        handleAdminPageChange(page);
        updateAdminSearchParams({ page });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Modal handlers - Fixed to ensure all values are strings
    const openModal = (type, account = null) => {
        setModalType(type);
        setSelectedAccount(account);
        if (account) {
            setAccountDetails({
                id: Number(account.id) || '',
                first_name: account.first_name || '',
                last_name: account.last_name || '',
                email: account.email || '',
                phone_number: account.phone_number || '',
                role: account.role || 'customer',
                password: ''
            });
        } else {
            setAccountDetails({
                id: '',
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                role: 'admin',
                password: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType('');
        setSelectedAccount(null);
        setAccountDetails({
            id: '',
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            role: 'customer',
            password: ''
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderModal = () => {
        if (!isModalOpen) return null;

        const isViewMode = modalType === 'view-customer' || modalType === 'view-admin';
        const isEditMode = modalType === 'edit-customer' || modalType === 'edit-admin';
        const isAddMode = modalType === 'add-admin';
        const isDeleteMode = modalType === 'delete-admin-confirmation';

        if (isDeleteMode) {
            return (
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    label="Delete Admin Account Confirmation"
                >
                    <div className={styles['modal-infos']}>
                        <p className={styles['modal-info']}>
                            You are about to <strong>permanently delete the admin account for {selectedAccount?.first_name} {selectedAccount?.last_name}</strong>. 
                            This action cannot be reversed. Are you absolutely sure you want to proceed?
                        </p>
                    </div>
                    <div className={styles['modal-ctas']}>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={handleDeleteAdmin}
                            externalStyles={styles['modal-warn']}
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={closeModal}
                        />
                    </div>
                </Modal>
            );
        }

        return (
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                label={
                    modalType === 'view-customer' ? 'Customer Details' :
                    modalType === 'view-admin' ? 'Admin Details' :
                    modalType === 'edit-customer' ? 'Edit Customer' :
                    modalType === 'edit-admin' ? 'Edit Admin' :
                    modalType === 'add-admin' ? 'Add Admin Account' : ''
                }
            >
                <div className={styles['inputs-container']}>
                    {isViewMode && selectedAccount && (
                        <div className={styles['modal-infos']}>
                            <h3>Account Information</h3>
                            <span>
                                <p><strong>Account ID:</strong> {selectedAccount.id}</p>
                                <p><strong>Full Name:</strong> {selectedAccount.first_name} {selectedAccount.last_name}</p>
                                <p><strong>Email:</strong> {selectedAccount.email}</p>
                                <p><strong>Phone:</strong> {selectedAccount.phone_number || 'Not provided'}</p>
                                <p><strong>Role:</strong> {selectedAccount.role}</p>
                                <p><strong>Email Verified:</strong> {selectedAccount.email_verified ? 'Yes' : 'No'}</p>
                                <p><strong>Registration Date:</strong> {formatDate(selectedAccount.created_at)}</p>
                                {selectedAccount.last_login && (
                                    <p><strong>Last Login:</strong> {formatDate(selectedAccount.last_login)}</p>
                                )}
                                {selectedAccount.is_suspended && (
                                    <p><strong>Status:</strong> <span style={{color: 'var(--error-foreground)'}}>Suspended</span></p>
                                )}
                            </span>
                        </div>
                    )}

                    {(isEditMode || isAddMode) && (
                        <>

                            <div className={styles['input-wrapper']}>
                                <label>First Name</label>
                                <InputField
                                    name="first_name"
                                    hint="Enter first name..."
                                    value={accountDetails.first_name}
                                    onChange={(e) => setAccountDetails({
                                        ...accountDetails,
                                        first_name: e.target.value
                                    })}
                                    isSubmittable={false}
                                />
                            </div>

                            <div className={styles['input-wrapper']}>
                                <label>Last Name</label>
                                <InputField
                                    name="last_name"
                                    hint="Enter last name..."
                                    value={accountDetails.last_name}
                                    onChange={(e) => setAccountDetails({
                                        ...accountDetails,
                                        last_name: e.target.value
                                    })}
                                    isSubmittable={false}
                                />
                            </div>

                            <div className={styles['input-wrapper']}>
                                <label>Email Address</label>
                                <InputField
                                    type="email"
                                    name="email"
                                    hint="Enter email address..."
                                    value={accountDetails.email}
                                    onChange={(e) => setAccountDetails({
                                        ...accountDetails,
                                        email: e.target.value
                                    })}
                                    isSubmittable={false}
                                />
                            </div>

                            <div className={styles['input-wrapper']}>
                                <label>Phone Number (Optional)</label>
                                <InputField
                                    type="tel"
                                    name="phone_number"
                                    hint="Enter phone number..."
                                    value={accountDetails.phone_number}
                                    onChange={(e) => setAccountDetails({
                                        ...accountDetails,
                                        phone_number: e.target.value
                                    })}
                                    isSubmittable={false}
                                />
                            </div>

                            {isAddMode && (
                                <div className={styles['input-wrapper']}>
                                    <label>Temporary Password</label>
                                    <InputField
                                        type="password"
                                        name="password"
                                        hint="Enter temporary password..."
                                        value={accountDetails.password}
                                        onChange={(e) => setAccountDetails({
                                            ...accountDetails,
                                            password: e.target.value
                                        })}
                                        isSubmittable={false}
                                    />
                                    <p className={styles['modal-info']}>
                                        The admin will need to change this password on first login.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={styles['modal-ctas']}>
                    {isViewMode && (
                        <>
                            <Button
                                type="secondary"
                                label="Edit"
                                action={() => {
                                    setModalType(modalType === 'view-customer' ? 'edit-customer' : 'edit-admin');
                                }}
                            />
                            {
                                userList.filter(user => user.id === selectedAccount.id)[0].is_suspended === 0 ? (
                                    <Button
                                        type="secondary"
                                        label="Suspend Account"
                                        action={() => {
                                            handleSuspendAccount(selectedAccount.id, true);
                                            closeModal();
                                        }}
                                        externalStyles={styles['modal-warn']}
                                    />
                                ) : (
                                    <Button
                                        type="secondary"
                                        label="Activate Account"
                                        action={() => {
                                            handleSuspendAccount(selectedAccount.id, false);
                                            closeModal();
                                        }}
                                    />
                                )
                            }
                            {modalType === 'view-admin' && (
                                <Button
                                    type="secondary"
                                    label="Delete Account"
                                    action={() => setModalType('delete-admin-confirmation')}
                                    externalStyles={styles['modal-warn']}
                                />
                            )}
                            <Button
                                type="primary"
                                label="Close"
                                action={closeModal}
                            />
                        </>
                    )}
                    {isEditMode && (
                        <>
                            <Button
                                type="secondary"
                                label="Cancel"
                                action={closeModal}
                            />
                            <Button
                                type="primary"
                                label="Save Changes"
                                action={handleEditAccount}
                                disabled={!accountDetails.first_name || !accountDetails.last_name || !accountDetails.email}
                            />
                        </>
                    )}
                    {isAddMode && (
                        <>
                            <Button
                                type="secondary"
                                label="Cancel"
                                action={closeModal}
                            />
                            <Button
                                type="primary"
                                label="Create Admin"
                                action={handleAddAdmin}
                                disabled={!accountDetails.first_name || !accountDetails.last_name || !accountDetails.email || !accountDetails.password}
                            />
                        </>
                    )}
                </div>
            </Modal>
        );
    };

    const renderAccountRow = (account, isAdmin = false) => (
        <div key={account.id} className={styles['table-row']}>
            <div className={styles['table-cell']}>{account.id}</div>
            <div className={styles['table-cell']}>
                {account.first_name} {account.last_name}
            </div>
            <div className={styles['table-cell']}>{account.email}</div>
            <div className={styles['table-cell']}>{account.phone_number || 'N/A'}</div>
            <div className={styles['table-cell']}>
                <span className={`${styles['status']} ${styles[account.email_verified ? 'verified' : 'unverified']}`}>
                    {account.email_verified ? 'Verified' : 'Unverified'}
                </span>
            </div>
            <div className={styles['table-cell']}>{formatDate(account.created_at)}</div>
            <div className={styles['table-cell']}>
                <div className={styles['actions']}>
                    <Button
                        type="icon"
                        icon="fa-solid fa-eye"
                        action={() => openModal(isAdmin ? 'view-admin' : 'view-customer', account)}
                        title="View account details"
                    />
                    <Button
                        type="icon"
                        icon="fa-solid fa-edit"
                        action={() => openModal(isAdmin ? 'edit-admin' : 'edit-customer', account)}
                        title="Edit account details"
                    />
                    {
                        userList.filter(user => user.id === account.id)[0].is_suspended === 0 ? (
                            <Button
                                type="icon"
                                icon="fa-solid fa-ban"
                                action={() => handleSuspendAccount(account.id, true) }
                                externalStyles={styles['modal-warn']}
                                title="Suspend account"
                                disabled={ user.email === account.email }
                            />
                        ) : (
                            <Button
                                type="icon"
                                icon="fa-solid fa-circle-check"
                                action={() => handleSuspendAccount(account.id, false) }
                                title="Re-activate account"
                                disabled={ user.email === account.email }
                            />
                        )

                    }
                    {isAdmin && (
                        <Button
                            type="icon"
                            icon="fa-solid fa-trash-can"
                            action={() => openModal('delete-admin-confirmation', account)}
                            title="Delete admin account"
                            externalStyles={styles['modal-warn']}
                            disabled={ user.email === account.email }
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles['wrapper']}>

            <div className={ styles['section'] }>

                <h2>Overview</h2>

                <div className={ styles['overview'] }>

                    <div className={ styles['overview-item'] }>
                        <div className={ styles['overview-item-header'] }>
                            <h3>Accounts</h3>
                        </div>
                        <h2>{ userList.length }</h2>
                    </div>

                    <div className={ styles['overview-item'] }>
                        <div className={ styles['overview-item-header'] }>
                            <h3>Customers</h3>
                        </div>
                        <h2>{ userList.filter(user => user.role === 'customer').length }</h2>
                    </div>

                    <div className={ styles['overview-item'] }>
                        <div className={ styles['overview-item-header'] }>
                            <h3>Admins</h3>
                        </div>
                        <h2>{ userList.filter(user => user.role === 'admin').length }</h2>
                    </div>

                </div>

            </div>

            <div className={ styles['divider-horizontal'] }></div>

            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Customers</h2>
                </div>

                <TableHeader
                    id='customers-table'
                    searchPlaceholder="Search customers..."
                    searchValue={customerSearchValue}
                    onSearchChange={handleCustomerSearch}
                    onSearchSubmit={() => handleCustomerSearch(customerSearchValue)}
                    currentSort={customerSortValue}
                    onSortChange={handleCustomerSort}
                    sortOptions={customerSortOptions}
                    loading={loading}
                    totalItems={totalCustomers}
                    filteredItems={filteredCustomersCount}
                />

                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']}>
                            <div className={styles['table-cell']}>ID</div>
                            <div className={styles['table-cell']}>Name</div>
                            <div className={styles['table-cell']}>Email</div>
                            <div className={styles['table-cell']}>Phone</div>
                            <div className={styles['table-cell']}>Status</div>
                            <div className={styles['table-cell']}>Registration Date</div>
                            <div className={styles['table-cell']}>Actions</div>
                        </div>
                        <div className={styles['table-body']}>
                            {paginatedCustomers.map(account => renderAccountRow(account, false))}
                            {paginatedCustomers.length === 0 && (
                                <div className={styles['empty-state']}>
                                    <p>No customers found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <TableFooter
                    currentPage={customerCurrentPage}
                    totalPages={customerTotalPages}
                    onPageChange={handleCustomerPagination}
                    totalItems={totalCustomers}
                    filteredItems={filteredCustomersCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>

            <div className={ styles['divider-horizontal'] }></div>

            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Admins</h2>
                    <Button
                        type="primary"
                        label="Add Admin Account"
                        icon="fa-solid fa-plus"
                        iconPosition="left"
                        action={() => openModal('add-admin')}
                    />
                </div>
                        
                <TableHeader
                    id='admins-table'
                    searchPlaceholder="Search admins..."
                    searchValue={adminSearchValue}
                    onSearchChange={handleAdminSearch}
                    onSearchSubmit={() => handleAdminSearch(adminSearchValue)}
                    currentSort={adminSortValue}
                    onSortChange={handleAdminSort}
                    sortOptions={adminSortOptions}
                    loading={loading}
                    totalItems={totalAdmins}
                    filteredItems={filteredAdminsCount}
                    currentPage={adminCurrentPage}
                    totalPages={adminTotalPages}
                    onPageChange={handleAdminPagination}
                />

                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']}>
                            <div className={styles['table-cell']}>ID</div>
                            <div className={styles['table-cell']}>Name</div>
                            <div className={styles['table-cell']}>Email</div>
                            <div className={styles['table-cell']}>Phone</div>
                            <div className={styles['table-cell']}>Status</div>
                            <div className={styles['table-cell']}>Registration Date</div>
                            <div className={styles['table-cell']}>Actions</div>
                        </div>
                        <div className={styles['table-body']}>
                            {paginatedAdmins.map(account => renderAccountRow(account, true))}
                            {paginatedAdmins.length === 0 && (
                                <div className={styles['empty-state']}>
                                    <p>No admins found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <TableFooter
                    currentPage={adminCurrentPage}
                    totalPages={adminTotalPages}
                    onPageChange={handleAdminPagination}
                    totalItems={totalAdmins}
                    filteredItems={filteredAdminsCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>

            {renderModal()}
        </div>
    );
};

export default Accounts;
