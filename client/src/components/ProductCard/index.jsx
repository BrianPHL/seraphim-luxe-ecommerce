import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './ProductCard.module.css';
import { InputField, Button, Modal } from '@components';
import { useAuth, useCart, useReservation, useToast } from '@contexts';

const ProductCard = ({ product_id, category, subcategory, image_url, label, price, stock_quantity = 0 }) => {
    
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ reservePreferredDate, setReservePreferredDate ] = useState('');
    const [ reserveNotes, setReserveNotes ] = useState('');
    const [ paymentMethod, setPaymentMethod ] = useState('cash');
    const [ installmentAmount, setInstallmentAmount ] = useState('');
    const [ installmentPaymentDate, setInstallmentPaymentDate ] = useState('');
    const [ installmentNotes, setInstallmentNotes ] = useState('');
    const [ productQuantity, setProductQuantity ] = useState(1);
    const [ isOutOfStock, setIsOutOfStock ] = useState(false);
    const [ isLowStock, setIsLowStock ] = useState(false);
    const { addToCart } = useCart();
    const { addToReservations } = useReservation();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const formattedPrice = parseFloat(price).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const requireAuth = (action) => {
        if (!user) {
            showToast('You must be signed in to perform this action!', 'error');
            return;
        }
        action();
    };

    const handleAddToCart = async () => {
        if (isOutOfStock) {
            showToast(`Sorry, ${label} is currently out of stock.`, 'error');
            return;
        }
        
        try {
            await addToCart({ 
                product_id: product_id, 
                category: category, 
                subcategory: subcategory, 
                image_url: image_url, 
                label: label, 
                price: price,
                quantity: productQuantity
            });
            showToast(`Successfully added ${ label } to your cart!`, 'success');
            setModalOpen(false);
        } catch (err) {
            showToast(`Uh oh! An error occurred during the addition of ${ label } to your cart! Please try again later. ${ err }`, 'error');
        }
    };

    const handleAddToReservations = async () => {
        if (isOutOfStock) {
            showToast(`Sorry, ${label} is currently out of stock.`, 'error');
            return;
        }
        
        try {
            const product = { 
                product_id, category, subcategory, image_url, 
                label, price, quantity: productQuantity
            };
            
            let installmentDetails = null;
            if (paymentMethod === 'cash_installment') {
                installmentDetails = {
                    amount: parseFloat(installmentAmount),
                    payment_date: installmentPaymentDate || new Date(),
                    notes: installmentNotes
                };
            }
            
            await addToReservations({
                product,
                preferredDate: reservePreferredDate,
                notes: reserveNotes,
                paymentMethod,
                installmentDetails
            });
            
            setModalOpen(false);
            clearReservationForm();

        } catch (err) {
            showToast(`Uh oh! An error occurred during the addition of ${ label } to your cart! Please try again later. ${ err }`, 'error');
        }
    };

    const clearReservationForm = () => {
        setReservePreferredDate('');
        setReserveNotes('');
        setPaymentMethod('cash');
        setInstallmentAmount('');
        setInstallmentPaymentDate('');
        setInstallmentNotes('');
    };

    useEffect(() => {
        setIsOutOfStock(stock_quantity <= 0);
        setIsLowStock(stock_quantity > 0 && stock_quantity <= 5);
    }, [stock_quantity]);

    return (
        <>
            <div className={ styles['wrapper'] }>
                { isOutOfStock && (
                    <div className={styles['out-of-stock-badge']}>
                        Out of Stock
                    </div>
                )}
                { isLowStock && !isOutOfStock && (
                    <div className={styles['low-stock-badge']}>
                        Low Stock
                    </div>
                )}
                <img
                    className={ styles['product-img'] }
                    src={ `https://res.cloudinary.com/dfvy7i4uc/image/upload/${ image_url }` }
                    alt={ `${ label }. Price: ${ price }` } />
                <div className={ styles['divider'] }></div>
                <div className={ styles['details'] }>
                    <div className={ styles['text'] }>
                        <h2>{ label }</h2>
                        <h3>₱{ formattedPrice }</h3>
                        <p>Available Stocks: { stock_quantity }</p>
                    </div>
                    <Button
                        type='icon'
                        icon='fa-solid fa-square-arrow-up-right'
                        action={ () => {
                            category.toLowerCase() === 'motorcycles'
                            ? navigate(`/motorcycles/${ product_id }`)
                            : navigate(`/parts-and-accessories/${ product_id }`)
                        }}
                    />
                </div>
                <div className={ styles['divider'] }></div>
                <div className={ styles['ctas'] }>
                    <Button
                        type='secondary'
                        label='Reserve'
                        icon='fa-solid fa-calendar-check'
                        iconPosition='left'
                        externalStyles={ styles['reserve'] }
                        disabled={isOutOfStock}
                        action={() => {
                            requireAuth(() => {
                                setModalType('reservation');
                                setModalOpen(true);
                            });
                        }}
                    />
                    <Button
                        type='icon-outlined'
                        icon='fa-solid fa-cart-plus'         
                        externalStyles={ styles['cart'] }
                        disabled={isOutOfStock}
                        action={() => {
                            requireAuth(() => {
                                setModalType('cart');
                                setModalOpen(true);
                            });
                        }}
                    />
                </div>
            </div>

            <Modal
                label={ `Add ${ label } to Cart` }
                isOpen={ modalOpen && modalType === 'cart' }
                onClose={ () => setModalOpen(false) }
            >
                <h3 className={ styles['modal-info'] }>Are you sure you want to add this product to your cart?</h3>

                <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                    <h3>{ label }</h3>
                    <p>Stock Available: <strong>{stock_quantity}</strong></p>
                </div>

                <div className={ styles['modal-infos'] } style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    
                    <span style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-minus'
                            action={ () => setProductQuantity(prevQuantity => prevQuantity - 1) }
                            disabled={ productQuantity <= 1 }
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-plus'
                            action={ () => setProductQuantity(prevQuantity => prevQuantity + 1) }
                            disabled={ productQuantity >= stock_quantity }
                        />
                    </span>

                    <p style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--tg-primary)' }}>{ productQuantity }x</p>

                </div>
                <div className={ styles['modal-ctas'] }>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={ () => setModalOpen(false) } 
                    />
                    <Button 
                        type="primary" 
                        label="Add to Cart" 
                        action={ () => { 
                            handleAddToCart(); 
                            setModalOpen(false);
                        }}
                    />
                </div>
            </Modal>
            <Modal
                label={ `Reserve ${ label }` }
                isOpen={ modalOpen && modalType === 'reservation' }
                onClose={ () => setModalOpen(false) }
            >
                <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                    <h3>{ label }</h3>
                    <span>
                        <p>Fill out the form below to reserve <strong>{ label }</strong></p>
                        <p>Stock Available: <strong>{stock_quantity}</strong></p>
                    </span>
                </div>

                <div className={ styles['inputs-container'] }>
                    <div className={ styles['input-wrapper'] }>
                        <label htmlFor="preferred_date">
                            Preferred Date
                        </label>
                        <InputField
                            hint='Your preferred date...'
                            type='date'
                            value={ reservePreferredDate }
                            onChange={ (e) => setReservePreferredDate(e.target.value) }
                            isSubmittable={ false }
                        />
                    </div>

                    <div className={ styles['input-wrapper'] }>
                        <label htmlFor="notes">
                            Notes (Optional)
                        </label>
                        <textarea
                            placeholder="Additional information..."
                            value={ reserveNotes }
                            onChange={ (e) => setReserveNotes(e.target.value) }
                        ></textarea>
                    </div>

                    <div className={ styles['input-wrapper'] }>
                        <label>Payment Method</label>
                        <div className={ styles['modal-payment'] }>
                            <label className={ styles['modal-payment-option'] }>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cash"
                                    checked={paymentMethod === 'cash'}
                                    onChange={() => setPaymentMethod('cash')}
                                />
                                <p>Cash Payment</p>
                            </label>
                            <label className={ styles['modal-payment-option'] }>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cash_installment"
                                    checked={paymentMethod === 'cash_installment'}
                                    onChange={() => setPaymentMethod('cash_installment')}
                                />
                                <p>Cash Installment</p>
                            </label>
                        </div>
                    </div>

                    {paymentMethod === 'cash_installment' && (
                        <>
                            <div className={ styles['divider'] } style={{ marginTop: '1rem' }}></div>
                            <h3 style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--tg-primary)', marginBottom: '1rem' }} >Installment Details</h3>
                            
                            <div className={ styles['input-wrapper'] }>
                                <label htmlFor="installment_amount">
                                    Installment Amount (₱)
                                </label>
                                <InputField
                                    hint='Enter amount (e.g., 1000)'
                                    type='number'
                                    value={ installmentAmount }
                                    onChange={ (e) => setInstallmentAmount(e.target.value) }
                                    isSubmittable={ false }
                                />
                                <span style={{ fontSize: '0.875rem' }} className={styles['modal-info']}>
                                    Total price: ₱{formattedPrice}
                                </span>
                            </div>
                            
                            <div className={ styles['input-wrapper'] }>
                                <label htmlFor="installment_date">
                                    Payment Date
                                </label>
                                <InputField
                                    hint='Payment date...'
                                    type='date'
                                    value={ installmentPaymentDate }
                                    onChange={ (e) => setInstallmentPaymentDate(e.target.value) }
                                    isSubmittable={ false }
                                />
                            </div>
                            
                            <div className={ styles['input-wrapper'] }>
                                <label htmlFor="installment_notes">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    placeholder="Additional information about your installment..."
                                    value={ installmentNotes }
                                    onChange={ (e) => setInstallmentNotes(e.target.value) }
                                ></textarea>
                            </div>
                        </>
                    )}
                </div>

                <div className={ styles['modal-ctas'] }>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={ () => {
                            clearReservationForm() 
                            setModalOpen(false)
                        }}
                    />
                    <Button 
                        type="primary" 
                        label={paymentMethod === 'cash_installment' ? "Submit Installment Request" : "Reserve"}
                        action={handleAddToReservations}
                        disabled={!reservePreferredDate || (paymentMethod === 'cash_installment' && !installmentAmount)}
                    />
                </div>
            </Modal>
        </>
    );
};

export default ProductCard;
