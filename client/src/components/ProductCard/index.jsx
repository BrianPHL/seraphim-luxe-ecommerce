import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './ProductCard.module.css';
import { InputField, Button, Modal } from '@components';
import { useAuth, useCart, useToast, useCheckout, useCategories, useSettings, useWishlist } from '@contexts';

const ProductCard = ({ id, category_id, subcategory_id, category, subcategory, image_url, label, price, stock_quantity = 0 }) => {
    
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
    const { setDirectCheckout } = useCheckout();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { getCategoryById, getActiveSubcategories } = useCategories();
    const navigate = useNavigate();

    const { settings, convertPrice, formatPrice } = useSettings();
    const [displayPrice, setDisplayPrice] = useState(price);

    const safeFormatPrice = (price, currency = null) => {
        try {
            if (formatPrice && typeof formatPrice === 'function') {
                return formatPrice(price, currency);
            }

            const numPrice = Number(price);
            if (isNaN(numPrice)) {
                return 'Price unavailable';
            }

            const currentCurrency = currency || settings?.currency || 'PHP';
            
            switch (currentCurrency?.toUpperCase()) {
                case 'USD':
                    return `$${numPrice.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
                case 'EUR':
                    return `€${numPrice.toLocaleString('en-EU', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
                case 'JPY':
                    return `¥${Math.round(numPrice).toLocaleString('ja-JP')}`;
                case 'CAD':
                    return `C$${numPrice.toLocaleString('en-CA', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
                case 'PHP':
                default:
                    return `₱${numPrice.toLocaleString('en-PH', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                    })}`;
            }
        } catch (error) {
            console.error('Error formatting price:', error);
            return `₱${Number(price).toFixed(2)}`;
        }
    };

    const getCategoryDisplayName = () => {
        try {
            if (category) return category;
            if (category_id) {
                const categoryData = getCategoryById(category_id);
                return categoryData?.name || 'Unknown';
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error getting category name:', error);
            return 'Unknown';
        }
    };

    const getSubcategoryDisplayName = () => {
        try {
            if (subcategory) return subcategory;
            if (category_id && subcategory_id) {
                const subcategories = getActiveSubcategories(category_id);
                const subcategoryData = subcategories.find(sub => sub.id === subcategory_id);
                return subcategoryData?.name || 'Unknown';
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error getting subcategory name:', error);
            return 'Unknown';
        }
    };

    const finalCategoryName = getCategoryDisplayName();
    const finalSubcategoryName = getSubcategoryDisplayName();

    const getImageSrc = () => {
        if (!image_url || image_url.trim() === '') {
            return null;
        }
        return `https://res.cloudinary.com/dfvy7i4uc/image/upload/${image_url}`;
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
                category: finalCategoryName, 
                subcategory: finalSubcategoryName, 
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
                category: finalCategoryName,
                subcategory: finalSubcategoryName,
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

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        if (e.target.nextSibling) {
            e.target.nextSibling.style.display = 'flex';
        }
    };

    useEffect(() => {
        setIsOutOfStock(stock_quantity <= 0);
        setIsLowStock(stock_quantity > 0 && stock_quantity <= 5);
    }, [stock_quantity]);

    useEffect(() => {
        const updatePrice = async () => {
            try {
                if (settings?.currency && settings.currency !== 'PHP' && convertPrice) {
                    const converted = await convertPrice(price, settings.currency);
                    setDisplayPrice(converted);
                } else {
                    setDisplayPrice(price);
                }
            } catch (error) {
                console.error('Error converting price:', error);
                setDisplayPrice(price);
            }
        };
        
        if (settings) {
            updatePrice();
        }
    }, [price, settings?.currency, convertPrice, settings]);

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
                        onError={handleImageError}
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
                        <h3>{ safeFormatPrice(displayPrice) }</h3>
                        <p>Available Stocks: { stock_quantity }</p>
                    </div>
                    <Button
                        type='icon'
                        icon={ isInWishlist(id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart' }
                        disabled={ !user }
                        action={ () => {
                            isInWishlist(id) ? removeFromWishlist(id) : addToWishlist(id)
                        }}
                    />
                </div>
                <div className={ styles['divider'] }></div>
                <div className={ styles['ctas'] }>
                    <Button
                        type='secondary'
                        label='Buy now'
                        externalStyles={ styles['checkout'] }
                        disabled={isOutOfStock || !user }
                        action={() => {
                            setModalType('checkout');
                            setModalOpen(true);
                        }}
                    />
                    <Button
                        type='icon-outlined'
                        icon='fa-solid fa-square-arrow-up-right'
                        action={ () => navigate(`/collections/${ id }`) }
                    />
                    <Button
                        type='icon-outlined'
                        icon='fa-solid fa-cart-plus'         
                        externalStyles={ styles['cart'] }
                        disabled={ isOutOfStock || !user }
                        action={() => {
                            setModalType('cart');
                            setModalOpen(true);
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

                <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                    <h3>Total: {safeFormatPrice(displayPrice * productQuantity)}</h3>
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
                    <h3>Total: {safeFormatPrice(displayPrice * productQuantity)}</h3>
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