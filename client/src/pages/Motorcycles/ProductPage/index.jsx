import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './ProductPage.module.css';
import { Button, ReturnButton, InputField, Modal } from '@components';
import { useProducts, useAuth, useCart, useReservation, useToast } from '@contexts';

const ProductPage = () => {

    const { product_id } = useParams();
    const [ product, setProduct ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ productQuantity, setProductQuantity ] = useState(1);
    const [ paymentMethod, setPaymentMethod ] = useState('cash');
    const [ installmentAmount, setInstallmentAmount ] = useState('');
    const [ installmentPaymentDate, setInstallmentPaymentDate ] = useState('');
    const [ installmentNotes, setInstallmentNotes ] = useState('');
    const [ formattedPrice, setFormattedPrice ] = useState('');
    const [ isOutOfStock, setIsOutOfStock ] = useState(false);
    const [ isLowStock, setIsLowStock ] = useState(false);
    const [ reservePreferredDate, setReservePreferredDate ] = useState('');
    const [ reserveNotes, setReserveNotes ] = useState('');
    const { products } = useProducts();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { addToReservations } = useReservation();
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (products && products['length'] > 0) {
            
            const foundProduct = products.find(product => product.product_id.toString() === product_id);
            if (foundProduct) {
                setProduct(foundProduct);
                setIsOutOfStock(foundProduct['stock_quantity'] <= 0);
                setIsLowStock(foundProduct['stock_quantity'] > 0 && foundProduct['stock_quantity'] <= 5);
            } else {
                showToast('Product not found!', 'error');
                navigate('/motorcycles');
            }
            
            setLoading(false);

        }
    }, [ product_id, products, navigate, showToast ]);

    const requireAuth = (action) => {
        if (!user) {
            showToast('You must be signed in to perform this action!', 'error')
            return;
        }
        action();
    };

    const handleAddToCart = async () => {
        if (isOutOfStock) {
            showToast(`Sorry, ${product.label} is currently out of stock.`, 'error');
            return;
        }
        
        try {
            await addToCart({ 
                product_id: product['product_id'], 
                category: product['category'],
                subcategory: product['subcategory'],
                image_url: product['image_url'],
                label: product['label'],
                price: product['price'],
                quantity: productQuantity
            });
            showToast(`Successfully added ${ product['label'] } to your cart!`, 'success');
        } catch (err) {
            showToast(`Uh oh! An error occurred during the addition of ${ product['label'] } to your cart! Please try again later. ${ err }`, 'error');
        }
    };

    const handleAddToReservations = async () => {
        if (isOutOfStock) {
            showToast(`Sorry, ${product.label} is currently out of stock.`, 'error');
            return;
        }
        
        try {
            await addToReservations({
                product: { 
                    product_id: product['product_id'], 
                    category: product['category'], 
                    subcategory: product['subcategory'], 
                    image_url: product['image_url'], 
                    label: product['label'], 
                    price: product['price'] 
                },
                preferredDate: reservePreferredDate,
                notes: reserveNotes
            });
            showToast(`Successfully reserved ${ product['label'] }!`, 'success');
            clearReservationForm();
        } catch (err) {
            showToast(`Uh oh! An error occured during the reservation of ${ product['label'] }! Please try again later. ${ err }`, 'error');
        }
    };

    if (loading) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['header']}>
                    <ReturnButton />
                    <h1>Product Details</h1>
                </div>
                <div className={styles['loading']}>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading product, please wait...</p>
                </div>
            </div>
        );
    };

    const clearReservationForm = () => {
        setReservePreferredDate('');
        setReserveNotes('');
        setPaymentMethod('cash');
        setInstallmentAmount('');
        setInstallmentPaymentDate('');
        setInstallmentNotes('');
    };

    return (
        <>
            <div className={ styles['wrapper'] }>
                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>Product Details</h1>
                </div>
                <div className={ styles['product'] }>
                    <div className={ styles['product-image'] }>
                        <img
                            src={ `https://res.cloudinary.com/dfvy7i4uc/image/upload/${ product['image_url'] }` }
                            alt={ `${ product['label'] }. Price: ${ product['price'] }` } 
                        />
                    </div>
                    <div className={ styles['product-details'] }>
                        <div className={ styles['product-details-header'] }>
                            <h2>{ product['label'] }</h2>
                            <h3 style={{ marginTop: '2rem' }}><strong>Category:</strong> { product['category'] } | <strong>Sub-category:</strong> { product['subcategory'] }</h3>
                                <h3 style={{ marginTop: '1rem' }}>
                                    <strong>Availability:</strong>{' '}
                                    <span className={
                                        isOutOfStock 
                                            ? styles['out-of-stock'] 
                                            : isLowStock 
                                                ? styles['low-stock'] 
                                                : styles['in-stock']
                                    }>
                                        {isOutOfStock 
                                            ? 'Out of stock' 
                                            : isLowStock 
                                                ? `Low Stock (${product['stock_quantity']} available)` 
                                                : `${product['stock_quantity']} available`
                                        }
                                    </span>
                                </h3>
                        </div>

                        <div className={ styles['product-details-info'] }>
                            <span>
                                <h4><strong>Description</strong></h4>
                                <p>{ product['description'] }</p>
                            </span>
                            <h3>₱{ parseFloat(product['price']).toLocaleString('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </h3>
                        </div>
                        <div className={ styles['product-details-ctas'] }>
                            <Button
                                type='primary'
                                label='Reserve'
                                icon='fa-solid fa-calendar-check'
                                iconPosition='left'
                                externalStyles={ styles['reserve'] }
                                action={
                                    () => { 
                                        requireAuth(() => {
                                            setModalType('reservation');
                                            setModalOpen(true);
                                        })
                                    } 
                                }
                            />
                            <Button
                                type='secondary'
                                icon='fa-solid fa-cart-plus'
                                iconPosition='left'
                                label='Add to Cart'
                                action={
                                    () => { 
                                        requireAuth(() => {
                                            setModalType('cart');
                                            setModalOpen(true);
                                        })
                                    } 
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
            { modalType === 'reservation' ? (
                <Modal
                    label={ `Reserve ${ product['label'] }` }
                    isOpen={ modalOpen && modalType === 'reservation' }
                    onClose={ () => setModalOpen(false) }
                >
                    <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                        <h3>{ product['label'] }</h3>
                        <span>
                            <p>Fill out the form below to reserve <strong>{ product['label'] }</strong></p>
                            <p>Stock Available: <strong>{ product['stock_quantity'] }</strong></p>
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
            ) : modalType === 'cart' ? (
                <Modal
                    label={ `Add ${ product['label'] } to Cart` }
                    isOpen={ modalOpen && modalType === 'cart' }
                    onClose={ () => setModalOpen(false) }
                >
                    <h3 className={ styles['modal-info'] }>Are you sure you want to add this product to your cart?</h3>
                
                    <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                        <h3>{ product['label'] }</h3>
                        <p>Stock Available: <strong>{ product['stock_quantity'] }</strong></p>
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
                                disabled={ productQuantity >= product['stock_quantity'] }
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
            ) : null }
        </>
    );
};

export default ProductPage;
