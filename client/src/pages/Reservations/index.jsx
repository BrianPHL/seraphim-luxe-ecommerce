import { useNavigate } from 'react-router';
import { Button, Anchor, InputField, ReturnButton, Accordion, Modal } from '@components';
import styles from './Reservations.module.css';
import { useReservation, useAuth } from '@contexts';
import { useState, useEffect } from 'react';

const Reservations = ({}) => {

    const [ modalOpen, setModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ selectedItem, setSelectedItem ] = useState(null);
    const { reservationItems, addToReservations, cancelReservation, reactivateReservation, deleteReservation, refreshReservations } = useReservation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const pendingCount = reservationItems.filter(item => item['status'] === 'pending').length;
    const cancelledCount = reservationItems.filter(item => item['status'] === 'cancelled').length;
    const totalCount = reservationItems['length'];

    useEffect(() => {
        refreshReservations();
    }, []);

    return (
        <>
            <div className={ styles['wrapper'] }>
                <div className={ styles['banner'] }></div>
                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>Your Reservations</h1>
                </div>
                <div className={ styles['container'] }>
                    { reservationItems.length === 0 ? (
                        <div className={ styles['empty'] }>
                            <h3>Your Reservations is empty!</h3>
                            <p>Start browsing for items in <Anchor label="Motorcycles" link="/motorcycles" isNested={ false }/> or <Anchor label="Parts & Accessories" link="/parts-and-accessories" isNested={ false }/>.</p>
                            <p>or</p>
                            <p>Add items to <Anchor label="Cart" link="/cart" isNested={ false }/> to reserve by batch.</p>
                        </div>
                    ) : (
                        <div className={ styles['reservations'] }>
                            <div className={ styles['summary'] }>
                                <h2>Summary</h2>
                                <div className={ styles['divider'] }></div>
                                <div className={ styles['summary-container'] }>
                                    <div className={ styles['summary-item'] }>
                                        <h3>Pending Reservations</h3>
                                        <h3>{ pendingCount }</h3>
                                    </div>
                                    <div className={ styles['summary-item'] }>
                                        <h3>Cancelled Reservations</h3>
                                        <h3>{ cancelledCount }</h3>
                                    </div>
                                    <div className={ styles['summary-item'] }>
                                        <h3>Total Reservations</h3>
                                        <h3>{ totalCount }</h3>
                                    </div>
                                </div>
                            </div>
                            <div className={ styles['list'] }>
                                <div className={ styles['notice'] }>
                                    <i className='fa-solid fa-triangle-exclamation'></i>
                                    <p>
                                        All reservations made through this platform are stored for record-keeping purposes only and will remain in either Pending or Cancelled status even after the preferred reservation date has passed.
                                    <br /><br />
                                        This feature is part of a future system upgrade. For now, reservations do not guarantee product availability or fulfillment.
                                    </p>
                                </div>
                                { reservationItems.map(reservation => (
                                    <Accordion
                                        key={ reservation['reservation_id'] }
                                        label={` Reservation #${ reservation['reservation_id'] } `}
                                        externalStyles={ styles['reservation'] }
                                        isOpenByDefault={ true }
                                    >
                                        <div className={ styles['content'] }>
                                            <div className={ styles['details'] }>
                                                <span>
                                                    <h3>Reservation Details</h3>
                                                    <h4>{ reservation['status'].charAt(0).toUpperCase() + reservation['status'].slice(1) }</h4>
                                                </span>
                                                <div className={ styles['details-container'] }>
                                                    <div className={ styles['details-item'] }>
                                                        <h4>Account Id</h4>
                                                        <h4>{ user['account_id'] }</h4>
                                                    </div>
                                                    <div className={ styles['details-item'] }>
                                                        <h4>Full Name</h4>
                                                        <h4>{ user['first_name'] + ' ' + user['last_name'] }</h4>
                                                    </div>
                                                    <div className={ styles['details-item'] }>
                                                        <h4>Contact Number</h4>
                                                        <h4>{ user['contact_number'] }</h4>
                                                    </div>
                                                    <div className={ styles['details-item'] }>
                                                        <h4>Email Address</h4>
                                                        <h4>{ user['email'] }</h4>
                                                    </div>
                                                    <div className={ styles['details-item'] }>
                                                        <h4>Preferred Date</h4>
                                                        <h4>{new Date(reservation['preferred_date']).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long', 
                                                            day: 'numeric'
                                                        })}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={ styles['divider'] }></div>
                                            <div className={ styles['products'] }>
                                                <h3>Reserved Products</h3>
                                                <div className={ styles['products-container'] }>
                                                    { reservation['products'] && reservation['products'].map(product => (
                                                        <div
                                                            key={['product_id']}
                                                            className={ styles['product'] }
                                                            onClick={ () => {
                                                                product['category'].toLowerCase() === 'motorcycles'
                                                                ? navigate(`/motorcycles/${ product['product_id'] }`)
                                                                : navigate(`/parts-and-accessories/${ product['product_id'] }`)
                                                            }}
                                                        >
                                                            <span>
                                                                <img src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${ product['image_url'] }`} alt="" />
                                                                <div className={ styles['product-details'] }>
                                                                    <span>
                                                                        <h3>{ product['label'] }</h3>
                                                                        <h4>₱{ parseFloat(product['price']).toLocaleString('en-PH', {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2
                                                                            })}
                                                                        </h4>
                                                                    </span>
                                                                    <h4>{`Qty.: ${ product['quantity'] }`}</h4>
                                                                </div>
                                                            </span>
                                                            <i className='fa-solid fa-square-up-right'></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={ styles['divider'] }></div>
                                            <div className={ styles['ctas'] }>
                                                { reservation['status'] === 'pending' ? (
                                                    <>
                                                        <Button
                                                            type='primary'
                                                            label='Checkout'
                                                            disabled
                                                        />
                                                        <Button
                                                            type='secondary'
                                                            label='Cancel'
                                                            action={ () => {
                                                                setSelectedItem(reservation);
                                                                setModalType('cancel-confirmation')
                                                                setModalOpen(true);
                                                            }}
                                                            externalStyles={ styles['reservation-warn'] }
                                                        />
                                                    </>
                                                ) : reservation['status'] === 'cancelled' ? (
                                                    <>
                                                        <Button
                                                            type='primary'
                                                            label='Checkout'
                                                            disabled
                                                        />
                                                        <Button
                                                            type='secondary'
                                                            label='Reactivate'
                                                            action={ () => {
                                                                setSelectedItem(reservation);
                                                                setModalType('reactivate-confirmation')
                                                                setModalOpen(true);
                                                            }}
                                                        />
                                                        <Button
                                                            type='secondary'
                                                            label='Delete'
                                                            action={ () => {
                                                                setSelectedItem(reservation);
                                                                setModalType('delete-confirmation')
                                                                setModalOpen(true);
                                                            }}
                                                            externalStyles={ styles['reservation-warn'] }
                                                        />
                                                    </>
                                                ) : reservation['status'] === 'pending_approval' ? (
                                                    <Button
                                                        type='secondary'
                                                        label='Cancel'
                                                        action={ () => {
                                                            setSelectedItem(reservation);
                                                            setModalType('cancel-confirmation')
                                                            setModalOpen(true);
                                                        }}
                                                        externalStyles={ styles['reservation-warn'] }
                                                    />
                                                ) : reservation['status'] === 'rejected' && (
                                                    <Button
                                                        type='secondary'
                                                        label='Delete'
                                                        action={ () => {
                                                            setSelectedItem(reservation);
                                                            setModalType('delete-confirmation')
                                                            setModalOpen(true);
                                                        }}
                                                        externalStyles={ styles['reservation-warn'] }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </Accordion>
                                ))}
                            </div>
                        </div>
                    )
                    }
                </div>
            </div>
            { modalType === 'cancel-confirmation' ? (
                <Modal label='Cancel Reservation Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to cancel <strong>Reservation #{ selectedItem['reservation_id'] }</strong> from your reservations? You'll be able to reserve it again afterwards.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                cancelReservation(selectedItem['reservation_id']);
                                setModalOpen(false);
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'reactivate-confirmation' ? (
                <Modal label='Cancelled Reservation Reactivation Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to reactivate <strong>Reservation #{ selectedItem['reservation_id'] }</strong> from your reservations?</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                reactivateReservation(selectedItem['reservation_id']);
                                setModalOpen(false);
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'delete-confirmation' ? (
                <Modal label='Delete Cancelled Reservation Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to delete <strong>Reservation #{ selectedItem['reservation_id'] }</strong> from your reservations? You will never see it again, ever!</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                deleteReservation(selectedItem['reservation_id']);
                                setModalOpen(false);
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : null }
        </>
    );
};

export default Reservations;