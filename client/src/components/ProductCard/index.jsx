import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './ProductCard.module.css';
import { InputField, Button, Modal } from '@components';
import { useAuth, useCart, useReservation, useToast, useCheckout } from '@contexts';

const ProductCard = ({ id, category, subcategory, image_url, label, price, stock_quantity = 0 }) => {
    
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
    const [ isCheckingOut, setIsCheckingOut ] = useState(false);
    const { addToCart } = useCart();
    const { addToReservations } = useReservation();
    const { setDirectCheckout } = useCheckout();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const formattedPrice = parseFloat(price).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const getImageSrc = () => {
        if (!image_url || image_url.trim() === '') {
            return null;
        }
        return `https://res.cloudinary.com/dfvy7i4uc/image/upload/products/${image_url}`;
    };

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
                product_id: id,
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
            console.error("ProductCard component handleAddToCart error: ", err);
        }
    };

    const handleBuyNow = () => {
        if (isOutOfStock) {
            showToast(`Sorry, ${label} is currently out of stock.`, 'error');
            return;
        }

        try {
            
            const directItem = {
                product_id: id,
                category: category,
                subcategory: subcategory,
                image_url: image_url,
                label: label,
                price: price,
                quantity: productQuantity
            };

            setDirectCheckout(directItem);
            
            setModalOpen(false);
            navigate('/checkout');
            
        } catch (err) {
            console.error("Error during buy now:", err);
            showToast(`Failed to process ${label}. Please try again.`, 'error');
        }
    };

    useEffect(() => {
        setIsOutOfStock(stock_quantity <= 0);
        setIsLowStock(stock_quantity > 0 && stock_quantity <= 5);
    }, [stock_quantity]);

    const imageSrc = getImageSrc();

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
                {imageSrc ? (
                    <img
                        className={ styles['product-img'] }
                        src={ imageSrc }
                        alt={ `${ label }. Price: ${ price }` }
                    />
                ) : (
                    <div className={ styles['product-img-placeholder'] }>
                        <i className="fa-solid fa-image" style={{ fontSize: '2rem', color: 'var(--tg-secondary)' }}></i>
                        <span style={{ fontSize: '0.75rem', color: 'var(--tg-secondary)' }}>No Image</span>
                    </div>
                )}
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
                        action={ () => navigate(`/collections/${ id }`) }
                    />
                </div>
                <div className={ styles['divider'] }></div>
                <div className={ styles['ctas'] }>
                    <Button
                        type='secondary'
                        label='Buy now'
                        icon='fa-solid fa-credit-card'
                        iconPosition='left'
                        externalStyles={ styles['checkout'] }
                        disabled={isOutOfStock}
                        action={() => {
                            requireAuth(() => {
                                setModalType('checkout');
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
                        action={handleAddToCart}
                    />
                </div>
            </Modal>

            <Modal
                label={ `Buy ${ label } Now` }
                isOpen={ modalOpen && modalType === 'checkout' }
                onClose={ () => setModalOpen(false) }
            >
                <h3 className={ styles['modal-info'] }>This will take you directly to checkout.</h3>

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

                <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                    <h3>Total: ₱{(parseFloat(price) * productQuantity).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</h3>
                </div>

                <div className={ styles['modal-ctas'] }>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={ () => setModalOpen(false) } 
                    />
                    <Button 
                        type="primary" 
                        label="Buy Now"
                        action={handleBuyNow}
                    />
                </div>
            </Modal>
        </>
    );
};

export default ProductCard;
