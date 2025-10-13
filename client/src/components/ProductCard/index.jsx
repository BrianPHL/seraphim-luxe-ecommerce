import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import styles from './ProductCard.module.css';
import { InputField, Button, Modal } from '@components';
import { useAuth, useCart, useToast, useCheckout, useCategories, useSettings, useWishlist, usePromotions } from '@contexts';

const ProductCard = ({ id, category_id, subcategory_id, category, subcategory, image_url, label, price, stock_quantity = 0, externalStyles }) => {
    
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ productQuantity, setProductQuantity ] = useState(1);
    const [ isOutOfStock, setIsOutOfStock ] = useState(false);
    const [ isLowStock, setIsLowStock ] = useState(false);
    const [ timeLeft, setTimeLeft ] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    
    const { addToCart } = useCart();
    const { promotions } = usePromotions();
    const { setDirectCheckout } = useCheckout();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { user, setIsPopupOpen } = useAuth();
    const { showToast } = useToast();
    const { getCategoryById, getActiveSubcategories } = useCategories();
    const navigate = useNavigate();

    const { settings, convertPrice, formatPrice } = useSettings();
    const [displayPrice, setDisplayPrice] = useState(price);

    const getActivePromotion = () => {

        if (!promotions || promotions.length === 0) return null;

        const now = new Date();
        const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().replace('Z', '');

        return promotions.find(promotion => {
            
            if (promotion.is_active !== 1) return false;

            const startDate = promotion.start_date.replace('Z', '');
            const endDate = promotion.end_date.replace('Z', '');

            if (today < startDate || today > endDate) return false;

            if (!promotion.products || promotion.products.length === 0) return true;
        
            return promotion.products.some(product => parseInt(product.id) === parseInt(id));
        });
    };

    const requireAuth = (action) => {
        
        if (!user) {
            setIsPopupOpen(true);
            return;
        }

        action();

    };

    const activePromotion = getActivePromotion();
    
    // Calculate discounted price
    const discountedPrice = activePromotion ? 
        price * (1 - parseFloat(activePromotion.discount) / 100) : 
        price;

    // Calculate time left for promotion
    const calculateTimeLeft = (promotion) => {
        if (!promotion) return null;
        
        const now = new Date();
        const endDate = new Date(promotion.end_date.replace('Z', ''));
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) return null;
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    };

    // Format countdown display
    const formatCountdown = (timeObj) => {
        if (!timeObj) return null;
        
        const { days, hours, minutes, seconds } = timeObj;
        
        if (days > 0) {
            return `${days}d, ${hours.toString().padStart(2, '0')}h, ${minutes.toString().padStart(2, '0')}m, ${seconds.toString().padStart(2, '0')}s left`;
        } else if (hours > 0) {
            return `${hours}h, ${minutes.toString().padStart(2, '0')}m, ${seconds.toString().padStart(2, '0')}s left`;
        } else if (minutes > 0) {
            return `${minutes}m, ${seconds.toString().padStart(2, '0')}s left`;
        } else {
            return `${seconds}s left`;
        }
    };

    // Update countdown timer every second
    useEffect(() => {
        if (!activePromotion) {
            setTimeLeft(null);
            return;
        }
        
        const updateTimer = () => {
            const newTimeLeft = calculateTimeLeft(activePromotion);
            setTimeLeft(newTimeLeft);
        };
        
        updateTimer(); // Initial calculation
        const interval = setInterval(updateTimer, 1000); // Update every second for smooth countdown
        
        return () => clearInterval(interval);
    }, [activePromotion]);

    const safeFormatPrice = (price, currency = null) => {
        try {
            const numPrice = Number(price);
            if (isNaN(numPrice)) return 'Price unavailable';

            const currentCurrency = currency || settings?.currency || 'PHP';
            
            switch (currentCurrency?.toUpperCase()) {
                case 'USD': return `$${numPrice.toFixed(2)}`;
                case 'EUR': return `€${numPrice.toFixed(2)}`;
                case 'JPY': return `¥${Math.round(numPrice)}`;
                case 'CAD': return `C$${numPrice.toFixed(2)}`;
                case 'PHP':
                default: return `₱${numPrice.toFixed(2)}`;
            }
        } catch (error) {
            console.error('Error formatting price:', error);
            return `₱${Number(price).toFixed(2)}`;
        }
    };

    const getCategoryDisplayName = () => {
        if (category) return category;
        if (category_id) {
            const categoryData = getCategoryById(category_id);
            return categoryData?.name || 'Unknown';
        }
        return 'Unknown';
    };

    const getSubcategoryDisplayName = () => {
        if (subcategory) return subcategory;
        if (category_id && subcategory_id) {
            const subcategories = getActiveSubcategories(category_id);
            const subcategoryData = subcategories.find(sub => sub.id === subcategory_id);
            return subcategoryData?.name || 'Unknown';
        }
        return 'Unknown';
    };

    const finalCategoryName = getCategoryDisplayName();
    const finalSubcategoryName = getSubcategoryDisplayName();

    const getImageSrc = () => {
        if (!image_url || image_url.trim() === '') return null;
        return `https://res.cloudinary.com/dfvy7i4uc/image/upload/${image_url}`;
    };

    const handleAddToCart = async () => {
        if (!user) {
            showToast('You must be signed in to add items to cart!', 'error');
            return;
        }
        
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
                price: activePromotion ? discountedPrice : price,
                original_price: price,
                promotion_code: activePromotion?.code || null,
                quantity: productQuantity
            });
            showToast(`Successfully added ${ label } to your cart!`, 'success');
            setModalOpen(false);
        } catch (err) {
            showToast(`Failed to add ${ label } to cart. Please try again.`, 'error');
            console.error("ProductCard handleAddToCart error:", err);
        }
    };

    const handleBuyNow = () => {
        if (!user) {
            showToast('You must be signed in to make a purchase!', 'error');
            return;
        }
        
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
                price: activePromotion ? discountedPrice : price,
                original_price: price,
                promotion_code: activePromotion?.code || null,
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
        e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
    };

    useEffect(() => {
        setIsOutOfStock(stock_quantity <= 0);
        setIsLowStock(stock_quantity > 0 && stock_quantity <= 5);
    }, [stock_quantity]);

    useEffect(() => {
        const updatePrice = async () => {
            try {
                const priceToConvert = activePromotion ? discountedPrice : price;
                if (settings?.currency && settings.currency !== 'PHP' && convertPrice) {
                    const converted = await convertPrice(priceToConvert, settings.currency);
                    setDisplayPrice(converted);
                } else {
                    setDisplayPrice(priceToConvert);
                }
            } catch (error) {
                console.error('Error converting price:', error);
                setDisplayPrice(activePromotion ? discountedPrice : price);
            }
        };
        
        if (settings) {
            updatePrice();
        }
    }, [price, discountedPrice, activePromotion, settings?.currency, convertPrice, settings]);

    const imageSrc = getImageSrc();

    return (
        <>
            <div className={`${styles.wrapper} ${externalStyles}`}>
                <div className={styles.badges}>
                    <div className={styles.status}>
                        {activePromotion && timeLeft && (
                            <p className={styles.promotion}>
                                {activePromotion.discount}% off • {formatCountdown(timeLeft)}
                            </p>
                        )}
                        {isOutOfStock && (
                            <p className={styles.outOfStock}>Unavailable</p>
                        )}
                        {isLowStock && !isOutOfStock && (
                            <p className={styles.lowStock}>Low Stocks</p>
                        )}
                    </div>
                </div>

                {imageSrc ? (
                    <img
                        className={styles.productImg}
                        src={imageSrc}
                        alt={`${label}. Price: ${price}`}
                        onError={handleImageError}
                    />
                ) : (
                    <div className={styles.productImgPlaceholder}>
                        <i className="fa-solid fa-image"></i>
                        <span>No Image</span>
                    </div>
                )}

                <div className={styles.divider}></div>

                <div className={styles.details}>
                    <div className={styles.text}>
                        <h2>{label}</h2>
                        <div className={styles.priceContainer}>
                            {activePromotion ? (
                                <>
                                    <h3 className={styles.discountedPrice}>{safeFormatPrice(displayPrice)}</h3>
                                    <span className={styles.originalPrice}>{safeFormatPrice(price)}</span>
                                </>
                            ) : (
                                <h3>{safeFormatPrice(displayPrice)}</h3>
                            )}
                        </div>
                        <p>Available Stocks: {stock_quantity}</p>
                    </div>
                    <Button
                        type='icon'
                        icon={isInWishlist(id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
                        action={() => {
                            requireAuth(() => {
                                isInWishlist(id) ? removeFromWishlist(id) : addToWishlist(id)
                            });
                        }}
                    />
                </div>

                <div className={styles.divider}></div>

                <div className={styles.ctas}>
                    <Button
                        type='secondary'
                        label='Buy now'
                        externalStyles={styles.checkout}
                        action={() => {
                            requireAuth(() => {
                                setModalType('checkout');
                                setModalOpen(true);
                            });
                        }}
                    />
                    <Button
                        type='icon-outlined'
                        icon='fa-solid fa-square-arrow-up-right'
                        action={() => navigate(`/collections/${id}`)}
                    />
                    <Button
                        type='icon-outlined'
                        icon='fa-solid fa-cart-plus'
                        externalStyles={styles.cart}
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
                label={`Add ${label} to Cart`}
                isOpen={modalOpen && modalType === 'cart'}
                onClose={() => setModalOpen(false)}
            >
                <h3 className={styles.modalInfo}>Are you sure you want to add this product to your cart?</h3>

                <div className={styles.modalInfos}>
                    <h3>{label}</h3>
                    <p>Stock Available: <strong>{stock_quantity}</strong></p>
                    {activePromotion && (
                        <div className={styles.modalPromotion}>
                            <p className={styles.promotionBadge}>
                                🎉 {activePromotion.discount}% OFF with code: <strong>{activePromotion.code}</strong>
                            </p>
                            {timeLeft && (
                                <p className={styles.promotionTimer}>
                                    ⏰ Expires in: {formatCountdown(timeLeft)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.modalInfos} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-minus'
                            action={() => setProductQuantity(prev => Math.max(1, prev - 1))}
                            disabled={productQuantity <= 1}
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-plus'
                            action={() => setProductQuantity(prev => Math.min(stock_quantity, prev + 1))}
                            disabled={productQuantity >= stock_quantity}
                        />
                    </span>
                    <p style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--tg-primary)' }}>
                        {productQuantity}x
                    </p>
                </div>

                <div className={styles.modalInfos}>
                    {activePromotion ? (
                        <div className={styles.priceBreakdown}>
                            <p className={styles.originalTotal}>
                                Original: {safeFormatPrice(price * productQuantity)}
                            </p>
                            <p className={styles.discountAmount}>
                                Discount ({activePromotion.discount}%): -{safeFormatPrice((price - discountedPrice) * productQuantity)}
                            </p>
                            <h3 className={styles.finalTotal}>
                                Total: {safeFormatPrice(displayPrice * productQuantity)}
                            </h3>
                        </div>
                    ) : (
                        <h3>Total: {safeFormatPrice(displayPrice * productQuantity)}</h3>
                    )}
                </div>

                <div className={styles.modalCtas}>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={() => setModalOpen(false)} 
                    />
                    <Button 
                        type="primary" 
                        label="Add to Cart" 
                        action={handleAddToCart}
                    />
                </div>
            </Modal>

            <Modal
                label={`Buy ${label} Now`}
                isOpen={modalOpen && modalType === 'checkout'}
                onClose={() => setModalOpen(false)}
            >
                <h3 className={styles.modalInfo}>This will take you directly to checkout.</h3>

                <div className={styles.modalInfos}>
                    <h3>{label}</h3>
                    <p>Stock Available: <strong>{stock_quantity}</strong></p>
                    {activePromotion && (
                        <div className={styles.modalPromotion}>
                            <p className={styles.promotionBadge}>
                                🎉 {activePromotion.discount}% OFF with code: <strong>{activePromotion.code}</strong>
                            </p>
                            {timeLeft && (
                                <p className={styles.promotionTimer}>
                                    ⏰ Expires in: {formatCountdown(timeLeft)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.modalInfos} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-minus'
                            action={() => setProductQuantity(prev => Math.max(1, prev - 1))}
                            disabled={productQuantity <= 1}
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-plus'
                            action={() => setProductQuantity(prev => Math.min(stock_quantity, prev + 1))}
                            disabled={productQuantity >= stock_quantity}
                        />
                    </span>
                    <p style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--tg-primary)' }}>
                        {productQuantity}x
                    </p>
                </div>

                <div className={styles.modalInfos}>
                    {activePromotion ? (
                        <div className={styles.priceBreakdown}>
                            <p className={styles.originalTotal}>
                                Original: {safeFormatPrice(price * productQuantity)}
                            </p>
                            <p className={styles.discountAmount}>
                                Discount ({activePromotion.discount}%): -{safeFormatPrice((price - discountedPrice) * productQuantity)}
                            </p>
                            <h3 className={styles.finalTotal}>
                                Total: {safeFormatPrice(displayPrice * productQuantity)}
                            </h3>
                        </div>
                    ) : (
                        <h3>Total: {safeFormatPrice(displayPrice * productQuantity)}</h3>
                    )}
                </div>

                <div className={styles.modalCtas}>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={() => setModalOpen(false)} 
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
