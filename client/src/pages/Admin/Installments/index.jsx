import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Installments.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useReservation, useToast, useAuth } from '@contexts';

const AdminInstallments = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const [ installments, setInstallments ] = useState([]);
    const [ filteredInstallments, setFilteredInstallments ] = useState([]);
    const [ paginatedInstallments, setPaginatedInstallments ] = useState([]);
    const [ selectedInstallment, setSelectedInstallment ] = useState(null);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ processingNotes, setProcessingNotes ] = useState('');
    const [ loading, setLoading ] = useState(true);
    const [ currentPage, setCurrentPage ] = useState(parseInt(searchParams.get('page')) || 1);
    const [ totalPages, setTotalPages ] = useState(1);
    const [ searchInput, setSearchInput ] = useState(searchParams.get('search') || '');
    const [ querySearch, setQuerySearch ] = useState(searchParams.get('search') || '');
    const [ querySort, setQuerySort ] = useState(searchParams.get('sort') || 'Sort by: Latest');
    
    const ITEMS_PER_PAGE = 10;
    const { showToast } = useToast();
    const { user } = useAuth();
    const { processInstallment } = useReservation();
    
    const fetchInstallments = async () => {

        try {
            setLoading(true);

            const response = await fetch('/api/installments/pending');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error('Failed to fetch installment requests');
            }
            
            setInstallments(data);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!installments) return;
        
        let result = [...installments];
        
        if (querySearch) {
            const searchLower = querySearch.toLowerCase();
            result = result.filter(req => 
                req.first_name?.toLowerCase().includes(searchLower) ||
                req.last_name?.toLowerCase().includes(searchLower) ||
                req.email?.toLowerCase().includes(searchLower) ||
                req.installment_id?.toString().includes(searchLower) ||
                req.reservation_id?.toString().includes(searchLower)
            );
        }
        
        // Sort results
        switch(querySort) {
            case 'Sort by: Latest':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'Sort by: Oldest':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'Sort by: Amount (High to Low)':
                result.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
                break;
            case 'Sort by: Amount (Low to High)':
                result.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
                break;
            default:
                break;
        }
        
        setFilteredInstallments(result);
        setTotalPages(Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE)));
    }, [installments, querySearch, querySort]);
    
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedInstallments(filteredInstallments.slice(startIndex, endIndex));
    }, [filteredInstallments, currentPage]);
    
    const updateSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);
        
        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);
        
        setSearchParams(params);
    };
    
    const handlePageChange = (page) => {
        setCurrentPage(page);
        updateSearchParams({ page });
    };
    
    const handleSearchChange = (e) => {
        setSearchInput(e.target.value);
    };
    
    const handleSearch = () => {
        setCurrentPage(1);
        setQuerySearch(searchInput);
        updateSearchParams({ search: searchInput, page: 1 });
    };
    
    const handleSortChange = (sort) => {
        setQuerySort(sort);
        setCurrentPage(1);
        updateSearchParams({ sort, page: 1 });
    };
    
    const handleClearSearch = () => {
        setSearchInput('');
        setQuerySearch('');
        setCurrentPage(1);
        updateSearchParams({ search: '', page: 1 });
    };
    
    const handleOpenApproveModal = (installment) => {
        setSelectedInstallment(installment);
        setModalType('approve');
        setProcessingNotes('');
        setIsModalOpen(true);
    };
    
    const handleOpenRejectModal = (installment) => {
        setSelectedInstallment(installment);
        setModalType('reject');
        setProcessingNotes('');
        setIsModalOpen(true);
    };
    
    const handleApproveInstallment = async () => {
        if (!selectedInstallment) return;
        
        const success = await processInstallment(
            selectedInstallment.installment_id,
            'completed',
            processingNotes
        );
        
        if (success) {
            setIsModalOpen(false);
            await fetchInstallments();
        }
    };
    
    const handleRejectInstallment = async () => {
        if (!selectedInstallment) return;
        
        const success = await processInstallment(
            selectedInstallment.installment_id,
            'rejected',
            processingNotes
        );
        
        if (success) {
            setIsModalOpen(false);
            await fetchInstallments();
        }
    };
    
    useEffect(() => {
        if (user?.role === 'admin') {
            fetchInstallments();
        }
    }, [user]);
    
    if (user?.role !== 'admin') {
        return <div className={styles['unauthorized']}>Unauthorized Access</div>;
    }
    
    return (
        <div className={styles['wrapper']}>
            <div className={styles['section']}>
                <h2>Pending Installment Requests</h2>
                
                <TableHeader
                    tableName="installments"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedInstallments.length} out of ${filteredInstallments.length} installment requests`}
                    sortLabel={querySort}
                    searchValue={searchInput}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearch}
                />
                
                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                            <h3>ID</h3>
                            <h3>Customer</h3>
                            <h3>Email</h3>
                            <h3>Amount</h3>
                            <h3>Payment Date</h3>
                            <h3>Reservation ID</h3>
                            <h3>Actions</h3>
                        </div>
                        
                        {loading ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedInstallments.length > 0 ? (
                            paginatedInstallments.map(installment => (
                                <div 
                                    key={installment.installment_id} 
                                    className={styles['table-rows']}
                                    style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>{installment.installment_id}</div>
                                    <div className={styles['table-cell']}>
                                        {installment.first_name} {installment.last_name}
                                    </div>
                                    <div className={styles['table-cell']}>{installment.email}</div>
                                    <div className={styles['table-cell']}>
                                        ₱{parseFloat(installment.amount).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(installment.payment_date).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {installment.reservation_id}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-check"
                                            title="Approve"
                                            action={() => handleOpenApproveModal(installment)}
                                        />
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-times"
                                            title="Reject"
                                            action={() => handleOpenRejectModal(installment)}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['empty-table']}>
                                {querySearch ? (
                                    <div className={styles['empty']}>
                                        <h3>No installment requests found matching "{querySearch}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={handleClearSearch}
                                        />
                                    </div>
                                ) : (
                                    <p>No pending installment requests</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <TableFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedInstallments.length} out of ${filteredInstallments.length} installment requests`}
                    sortLabel={querySort}
                    onPageChange={handlePageChange}
                />
            </div>
            
            {/* Approve Modal */}
            <Modal
                label="Approve Installment Request"
                isOpen={isModalOpen && modalType === 'approve'}
                onClose={() => setIsModalOpen(false)}
            >
                {selectedInstallment && (
                    <>
                        <div className={styles['modal-infos']}>
                            <h3>Installment Request #{selectedInstallment.installment_id}</h3>
                            <span>
                                <p><strong>Customer:</strong> {selectedInstallment.first_name} {selectedInstallment.last_name}</p>
                                <p><strong>Email:</strong> {selectedInstallment.email}</p>
                                <p><strong>Amount:</strong> ₱{parseFloat(selectedInstallment.amount).toLocaleString('en-PH')}</p>
                                <p><strong>Payment Date:</strong> {new Date(selectedInstallment.payment_date).toLocaleDateString()}</p>
                                <p><strong>Reservation ID:</strong> {selectedInstallment.reservation_id}</p>
                                
                                <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                                    Approving this request will reserve the product(s) and reduce inventory stock.
                                </p>
                            </span>
                        </div>
                        
                        <div className={styles['inputs-container']}>
                            <div className={styles['input-wrapper']}>
                                <label>Add Notes (Optional)</label>
                                <textarea
                                    value={processingNotes}
                                    onChange={(e) => setProcessingNotes(e.target.value)}
                                    placeholder="Add any additional notes about this approval..."
                                />
                            </div>
                        </div>
                        
                        <div className={styles['modal-ctas']}>
                            <Button
                                type="secondary"
                                label="Cancel"
                                action={() => setIsModalOpen(false)}
                            />
                            <Button
                                type="primary"
                                label="Approve Installment"
                                action={handleApproveInstallment}
                            />
                        </div>
                    </>
                )}
            </Modal>
            
            {/* Reject Modal */}
            <Modal
                label="Reject Installment Request"
                isOpen={isModalOpen && modalType === 'reject'}
                onClose={() => setIsModalOpen(false)}
            >
                {selectedInstallment && (
                    <>
                        <div className={styles['modal-infos']}>
                            <h3>Installment Request #{selectedInstallment.installment_id}</h3>
                            <span>
                                <p><strong>Customer:</strong> {selectedInstallment.first_name} {selectedInstallment.last_name}</p>
                                <p><strong>Email:</strong> {selectedInstallment.email}</p>
                                <p><strong>Amount:</strong> ₱{parseFloat(selectedInstallment.amount).toLocaleString('en-PH')}</p>
                                <p><strong>Payment Date:</strong> {new Date(selectedInstallment.payment_date).toLocaleDateString()}</p>
                                <p><strong>Reservation ID:</strong> {selectedInstallment.reservation_id}</p>
                                
                                <p style={{ marginTop: '1rem', fontWeight: 'bold', color: 'var(--error-foreground)' }}>
                                    Rejecting this request will delete the associated reservation.
                                </p>
                            </span>
                        </div>
                        
                        <div className={styles['inputs-container']}>
                            <div className={styles['input-wrapper']}>
                                <label>Rejection Reason</label>
                                <textarea
                                    value={processingNotes}
                                    onChange={(e) => setProcessingNotes(e.target.value)}
                                    placeholder="Provide a reason for rejecting this installment request..."
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className={styles['modal-ctas']}>
                            <Button
                                type="secondary"
                                label="Cancel"
                                action={() => setIsModalOpen(false)}
                            />
                            <Button
                                type="primary"
                                label="Reject Installment"
                                action={handleRejectInstallment}
                                externalStyles={styles['modal-warn']}
                                disabled={!processingNotes}
                            />
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default AdminInstallments;
