import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Reservations.module.css';
import { Button, Modal, TableHeader, TableFooter, InputField } from '@components';
import { useReservation, useToast } from '@contexts';

const Reservations = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Latest';
    const querySearch = searchParams.get('search') || '';
    
    const [currentPage, setCurrentPage] = useState(queryPage);
    const [totalPages, setTotalPages] = useState(1);
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [paginatedReservations, setPaginatedReservations] = useState([]);
    const [searchInput, setSearchInput] = useState(querySearch);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
    const ITEMS_PER_PAGE = 10;

    const { recentReservations, refreshReservations } = useReservation();
    const { showToast } = useToast();

    useEffect(() => {
        const loadReservations = async () => {
            try {
                await refreshReservations();
            } catch (error) {
                showToast("Failed to load reservations", "error");
            }
        };
        
        loadReservations();
    }, []);

    useEffect(() => {
        if (!recentReservations) return;
        
        let result = [...recentReservations];

        if (querySearch) {
            const searchLower = querySearch.toLowerCase();
            result = result.filter(res => 
                res.first_name?.toLowerCase().includes(searchLower) ||
                res.last_name?.toLowerCase().includes(searchLower) ||
                res.email?.toLowerCase().includes(searchLower) ||
                res.reservation_id?.toString().includes(searchLower) ||
                res.status?.toLowerCase().includes(searchLower)
            );
        }

        switch(querySort) {
            case 'Sort by: Latest':
                result.sort((a, b) => new Date(b.created_at || b.preferred_date) - new Date(a.created_at || a.preferred_date));
                break;
            case 'Sort by: Oldest':
                result.sort((a, b) => new Date(a.created_at || a.preferred_date) - new Date(b.created_at || b.preferred_date));
                break;
            case 'Sort by: Status (Pending First)':
                result.sort((a, b) => {
                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                    if (a.status !== 'pending' && b.status === 'pending') return 1;
                    return 0;
                });
                break;
            case 'Sort by: Status (Cancelled First)':
                result.sort((a, b) => {
                    if (a.status === 'cancelled' && b.status !== 'cancelled') return -1;
                    if (a.status !== 'cancelled' && b.status === 'cancelled') return 1;
                    return 0;
                });
                break;
            default:
                break;
        }
        
        setFilteredReservations(result);
        setTotalPages(Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE)));
        
    }, [recentReservations, querySearch, querySort]);

    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedReservations(filteredReservations.slice(startIndex, endIndex));
    }, [filteredReservations, currentPage]);

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
        updateSearchParams({ search: searchInput, page: 1 });
    };

    const handleSortChange = (sort) => {
        setCurrentPage(1);
        updateSearchParams({ sort, page: 1 });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        updateSearchParams({ search: '', page: 1 });
    };

    const handleViewReservation = async (reservation) => {

        setSelectedReservation(reservation);
        setModalType('view');
        setIsModalOpen(true);
        loadReservationProducts(reservation.reservation_id);

    };

    const loadReservationProducts = async (reservationId) => {
        
        try {
            const response = await fetch(`/api/reservations/${reservation.reservation_id}/products`);

            if (!response.ok) {
                throw new Error('Failed to fetch reservation products');
            }
            const productsData = await response.json();
           
            setSelectedReservation(prev => ({
                ...prev,
                products: productsData
            }));
        } catch (error) {
            console.error("Error fetching reservation products:", error);
            showToast(`Could not load reservation products ${ error }`, "error");
            setSelectedReservation(prev => ({
                ...prev,
                products: []
            }));
        }

    };

    const handleUpdateStatus = (reservation, newStatus) => {
        setSelectedReservation(reservation);
        setStatusUpdateNotes('');
        setModalType(newStatus === 'cancelled' ? 'cancel' : 'complete');
        setIsModalOpen(true);
    };

    const handleConfirmStatusUpdate = async () => {
        if (!selectedReservation) return;
        
        const newStatus = modalType === 'cancel' ? 'cancelled' : 'completed';
        
        try {
            const response = await fetch(`/api/reservations/${selectedReservation.reservation_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    status: newStatus,
                    notes: statusUpdateNotes
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update reservation status');
            }
            
            await refreshReservations();
            
            showToast(`Reservation status updated to ${newStatus}`, 'success');
            setIsModalOpen(false);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    return (
        <div className={styles['wrapper']}>
            <div className={styles['section']}>
                <h2>Overview</h2>
                <div className={styles['overview']}>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Pending Reservations</h3>
                        </div>
                        <h2>{recentReservations?.filter(r => r.status === 'pending').length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Completed Reservations</h3>
                        </div>
                        <h2>{recentReservations?.filter(r => r.status === 'completed').length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Cancelled Reservations</h3>
                        </div>
                        <h2>{recentReservations?.filter(r => r.status === 'cancelled').length || 0}</h2>
                    </div>
                </div>
            </div>
            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Reservations</h2>
                </div>
                
                <TableHeader
                    tableName="reservations"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedReservations.length} out of ${filteredReservations.length} reservations`}
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
                            <h3>reservation_id</h3>
                            <h3>customer_name</h3>
                            <h3>email</h3>
                            <h3>status</h3>
                            <h3>preferred_date</h3>
                            <h3>modified_at</h3>
                            <h3>actions</h3>
                        </div>
                        
                        {!recentReservations ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedReservations.length > 0 ? (
                            paginatedReservations.map(reservation => (
                                <div 
                                    key={reservation.reservation_id} 
                                    className={styles['table-rows']} 
                                    style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>{reservation.reservation_id}</div>
                                    <div className={styles['table-cell']}>
                                        {reservation.first_name} {reservation.last_name}
                                    </div>
                                    <div className={styles['table-cell']}>{reservation.email}</div>
                                    <div className={styles['table-cell']}>
                                        <span className={styles[`status-${reservation.status}`]}>
                                            {reservation.status}
                                        </span>
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(reservation.preferred_date).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(reservation.modified_at || reservation.created_at).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-eye"
                                            action={() => handleViewReservation(reservation)}
                                        />
                                        {reservation.status === 'pending' && (
                                            <>
                                                <Button
                                                    type="icon"
                                                    icon="fa-solid fa-check"
                                                    action={() => handleUpdateStatus(reservation, 'completed')}
                                                />
                                                <Button
                                                    type="icon"
                                                    icon="fa-solid fa-ban"
                                                    action={() => handleUpdateStatus(reservation, 'cancelled')}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['empty-table']}>
                                {querySearch ? (
                                    <div className={styles['empty']}>
                                        <h3>No reservations found matching "{querySearch}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={handleClearSearch}
                                        />
                                    </div>
                                ) : (
                                    <p>No reservations found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <TableFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedReservations.length} out of ${filteredReservations.length} reservations`}
                    sortLabel={querySort}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* View Reservation Modal */}
            <Modal
                label="Reservation Details"
                isOpen={isModalOpen && modalType === 'view'}
                onClose={() => setIsModalOpen(false)}
            >
                {selectedReservation && (
                    <>
                        <div className={styles['modal-infos']}>
                            <h3>Reservation #{selectedReservation.reservation_id}</h3>
                            <span>
                                <p><strong>Customer:</strong> {selectedReservation.first_name} {selectedReservation.last_name}</p>
                                <p><strong>Email:</strong> {selectedReservation.email}</p>
                                <p><strong>Status:</strong> {selectedReservation.status}</p>
                                <p><strong>Preferred Date:</strong> {new Date(selectedReservation.preferred_date).toLocaleDateString()}</p>
                                <p><strong>Notes:</strong> {selectedReservation.notes || 'None'}</p>
                            </span>
                        </div>
                        
                        <div className={styles['divider']}></div>
                        
                        <h3>Reserved Products</h3>
                        {selectedReservation.products && selectedReservation.products.length > 0 ? (
                            selectedReservation.products.map((product, index) => (
                                <div key={index} className={styles['modal-product']}>
                                    <img 
                                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`}
                                        alt={product.label}
                                    />
                                    <div className={styles['product-details']}>
                                        <h4>{product.label}</h4>
                                        <p>₱{parseFloat(product.price).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</p>
                                        <p>Qty: {product.quantity || 1}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No products found for this reservation</p>
                        )}
                        
                        <div className={styles['modal-ctas']}>
                            <Button
                                type="secondary"
                                label="Close"
                                action={() => setIsModalOpen(false)}
                            />
                            {selectedReservation.status === 'pending' && (
                                <>
                                    <Button
                                        type="primary"
                                        label="Mark as Completed"
                                        action={() => {
                                            setIsModalOpen(false);
                                            handleUpdateStatus(selectedReservation, 'completed');
                                        }}
                                    />
                                    <Button
                                        type="secondary"
                                        label="Cancel Reservation"
                                        action={() => {
                                            setIsModalOpen(false);
                                            handleUpdateStatus(selectedReservation, 'cancelled');
                                        }}
                                        externalStyles={styles['modal-warn']}
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* Status Update Confirmation Modal */}
            <Modal
                label={modalType === 'cancel' ? 'Cancel Reservation' : 'Complete Reservation'}
                isOpen={isModalOpen && (modalType === 'cancel' || modalType === 'complete')}
                onClose={() => setIsModalOpen(false)}
            >
                {selectedReservation && (
                    <>
                        <p className={styles['modal-info']}>
                            Are you sure you want to {modalType === 'cancel' ? 'cancel' : 'mark as completed'}{' '}
                            <strong>Reservation #{selectedReservation.reservation_id}</strong>?
                        </p>
                        
                        <div className={styles['inputs-container']}>
                            <div className={styles['input-wrapper']}>
                                <label>Add Notes (Optional)</label>
                                <textarea
                                    value={statusUpdateNotes}
                                    onChange={(e) => setStatusUpdateNotes(e.target.value)}
                                    placeholder="Add any additional notes about this status change..."
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
                                label="Confirm"
                                action={handleConfirmStatusUpdate}
                                externalStyles={modalType === 'cancel' ? styles['modal-warn'] : ''}
                            />
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default Reservations;
