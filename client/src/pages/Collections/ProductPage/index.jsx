import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './ProductPage.module.css';
import { Button, ReturnButton, Modal, Counter } from '@components';
import ProductReviews from '@components/ProductReviews';
import { useProducts, useAuth, useCart, useCheckout, useToast, useSettings, useWishlist, usePromotions } from '@contexts';

const ProductPage = () => {
    // Router and state management
    const { product_id } = useParams();
    const [ product, setProduct ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ productQuantity, setProductQuantity ] = useState(1);
    const [ paymentMethod, setPaymentMethod ] = useState('cash');
    const [ selectedImageIdx, setSelectedImageIdx ] = useState(0);
    const [ displayPrice, setDisplayPrice] = useState(0);
    const [ timeLeft, setTimeLeft ] = useState(null);
    const [ reviewStats, setReviewStats ] = useState({
        averageRating: 0,
        totalReviews: 0
    });

    // Contexts
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { products } = useProducts();
    const { promotions } = usePromotions();
    const { user, setIsPopupOpen } = useAuth();
    const { addToCart } = useCart();
    const { setDirectCheckout } = useCheckout();
    const { showToast } = useToast();
    const { settings, convertPrice, formatPrice } = useSettings(); 
    const navigate = useNavigate();

    // Get active promotion for this product (same logic as ProductCard)
    const getActivePromotion = () => {
        if (!promotions || promotions.length === 0 || !product) return null;
        
        const now = new Date();
        const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().replace('Z', '');
        
        return promotions.find(promotion => {
            // Check if promotion is active
            if (promotion.is_active !== 1) return false;
            
            // Check dates with better validation (same as ProductCard)
            try {

                const startDate = promotion.start_date.replace('Z', '');
                const endDate = promotion.end_date.replace('Z', '');
    
                if (today < startDate || today > endDate) {
                    return false;
                }
                
            } catch (error) {
                console.error('Date validation error:', error);
                return false;
            }
            
            // If promotion has no products, it applies to all products
            if (!promotion.products || promotion.products.length === 0) {
                return true;
            }
            
            // Check if this product is in the promotion
            const productArray = Array.isArray(promotion.products) ? promotion.products : [];
            return productArray.some(p => parseInt(p.id) === parseInt(product.id));
        });
    };

    const activePromotion = getActivePromotion();
    
    // Calculate discounted price
    const getDiscountedPrice = (originalPrice) => {
        if (!activePromotion) return originalPrice;
        const discount = parseFloat(activePromotion.discount) / 100;
        return originalPrice * (1 - discount);
    };

    const discountedPrice = activePromotion && product ? getDiscountedPrice(product.price) : (product?.price || 0);

    // Calculate time left for promotion (same logic as ProductCard)
    const calculateTimeLeft = (promotion) => {
        if (!promotion || !promotion.end_date) return null;
        
        try {
        const now = new Date();
        const endDate = new Date(promotion.end_date.replace('Z', ''));
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) return null;
            
            if (timeDiff <= 0) return null;
            
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            return { days, hours, minutes, seconds };
        } catch (error) {
            console.error('Error calculating time left:', error);
            return null;
        }
    };

    // Format countdown display (same logic as ProductCard)
    const formatCountdown = (timeObj) => {
        if (!timeObj || typeof timeObj !== 'object') return '';
        
        const { days, hours, minutes, seconds } = timeObj;
        
        if (isNaN(days) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return '';
        }
        
        if (days > 0) {
            return `${days}d, ${hours.toString().padStart(2, '0')}h, ${minutes.toString().padStart(2, '0')}m, ${seconds.toString().padStart(2, '0')}s`;
        } else if (hours > 0) {
            return `${hours}h, ${minutes.toString().padStart(2, '0')}m, ${seconds.toString().padStart(2, '0')}s`;
        } else if (minutes > 0) {
            return `${minutes}m, ${seconds.toString().padStart(2, '0')}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // Update countdown timer every second (same logic as ProductCard)
    useEffect(() => {
        if (!activePromotion) {
            setTimeLeft(null);
            return;
        }
        
        const updateTimer = () => {
            const newTimeLeft = calculateTimeLeft(activePromotion);
            setTimeLeft(newTimeLeft);
            
            if (!newTimeLeft) {
                return false;
            }
            return true;
        };
        
        if (!updateTimer()) return;
        
        const interval = setInterval(() => {
            if (!updateTimer()) {
                clearInterval(interval);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [activePromotion]);

    // Fetch product from products context
    useEffect(() => {
        if (products && products.length > 0) {
            const foundProduct = products.find(p => p.id === parseInt(product_id));
            if (foundProduct) {
                setProduct(foundProduct);
            }
            setLoading(false);
        }
    }, [products, product_id]);

    // Convert price based on currency settings
    useEffect(() => {
        const updatePrice = async () => {
            if (!product?.price) return;
            
            try {
                const priceToConvert = activePromotion ? discountedPrice : product.price;
                if (settings?.currency && settings.currency !== 'PHP' && convertPrice) {
                    const converted = await convertPrice(priceToConvert, settings.currency);
                    setDisplayPrice(converted);
                } else {
                    setDisplayPrice(priceToConvert);
                }
            } catch (error) {
                console.error('Error converting price:', error);
                setDisplayPrice(activePromotion ? discountedPrice : product.price);
            }
        };
        
        if (settings && product) {
            updatePrice();
        }
    }, [product?.price, discountedPrice, activePromotion, settings?.currency, convertPrice, settings, product]);

    // Helper Functions
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

    const getProductImageUrls = (product) => {
        if (product?.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
            return product.product_images
                .sort((a, b) => a.display_order - b.display_order)
                .map(img => img.image_url);
        }
        
        return product?.image_url ? [product.image_url] : [];
    };

    // Event handlers
    const handleQuantityChange = (newValue) => {
        setProductQuantity(newValue);
    };

    const handleMinimumReached = () => {
        // Keep quantity at 1 for product page
        setProductQuantity(1);
    };

    const handleAddToCart = async () => {
        if (product['stock_quantity'] <= 0) {
            showToast(`Sorry, ${product['label']} is currently out of stock.`, 'error');
            return;
        }
        
        try {
            await addToCart({ 
                product_id: product['id'],
                category: product['category'],
                subcategory: product['subcategory'],
                image_url: product['image_url'], 
                label: product['label'], 
                price: activePromotion ? discountedPrice : product['price'], // Use discounted price if promotion exists
                original_price: product['price'], // Keep track of original price
                promotion_code: activePromotion?.code || null, // Include promotion code if applicable
                quantity: productQuantity
            });
            showToast(`Successfully added ${ product['label'] } to your cart${activePromotion ? ` with ${activePromotion.discount}% discount applied!` : '!'}`, 'success');
            setModalOpen(false);
        } catch (err) {
            showToast(`Uh oh! An error occurred during the addition of ${ product['label'] } to your cart! Please try again later. ${ err }`, 'error');
            console.error("ProductPage component handleAddToCart error: ", err);
        }
    };
    
    const handleBuyNow = () => {
        if (product['stock_quantity'] <= 0) {
            showToast(`Sorry, ${product['label']} is currently out of stock.`, 'error');
            return;
        }
    
        try {
            const directItem = {
                product_id: product['id'],
                category: product['category'],
                subcategory: product['subcategory'],
                image_url: product['image_url'],
                label: product['label'],
                price: activePromotion ? discountedPrice : product['price'], // Use discounted price if promotion exists
                original_price: product['price'], // Keep track of original price
                promotion_code: activePromotion?.code || null, // Include promotion code if applicable
                quantity: productQuantity
            };
        
            setDirectCheckout(directItem);
            setModalOpen(false);
            navigate('/checkout');
        } catch (err) {
            console.error("Error during buy now:", err);
            showToast(`Failed to process ${product['label']}. Please try again.`, 'error');
        }
    };

    // Stock status indicators
    const isOutOfStock = product && product['stock_quantity'] <= 0;
    const isLowStock = product && product['stock_quantity'] > 0 && product['stock_quantity'] <= 5;

    // For review functionality
    const canUserReview = !!user;
    
    // Generate list of image URLs
    const imageUrls = product ? getProductImageUrls(product) : [];

    const requireAuth = (action) => {
        
        if (!user) {
            setIsPopupOpen(true);
            return;
        }

        action();

    };

    // Loading state
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

    return (
        <>
            <div className={styles['wrapper']}>
                <div className={styles['header']}>
                    <ReturnButton />
                    <h1>Product Details</h1>
                </div>
                <div className={styles['product']}>
                    <div className={styles['product-image-gallery']}>
                        {/* Vertical Thumbnails on the Left */}
                        {imageUrls.length > 1 && (
                            <div className={styles['product-thumbnails-vertical']}>
                                {imageUrls.map((img, idx) => (
                                    <img
                                        key={`${img}-${idx}`}
                                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${img}`}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className={selectedImageIdx === idx ? styles['active-thumbnail'] : styles['thumbnail']}
                                        onClick={() => setSelectedImageIdx(idx)}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* Main Product Image */}
                        <div className={styles['main-image-container']}>
                            <img
                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${imageUrls[selectedImageIdx] || product['image_url']}`}
                                alt={`${product['label']}. Price: ${product['price']}`} 
                                className={styles['product-image']}
                            />
                        </div>
                    </div>
                    
                    <div className={styles['product-details']}>
                        <div className={styles['product-details-header']}>
                            <h2>{product['label']}</h2>
                            <h3 className={styles['product-category']}>
                                <strong>Category:</strong> {product['category']} | <strong>Sub-category:</strong> {product['subcategory']}
                            </h3>
                            <h3 className={styles['product-availability']}>
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

                        {/* Promotion Banner - Updated to use same logic as ProductCard */}
                        {activePromotion && timeLeft && formatCountdown(timeLeft) && (
                            <div className={styles['promotion-banner']}>
                                <div className={styles['promotion-content']}>
                                    <div className={styles['promotion-icon']}>🎉</div>
                                    <div className={styles['promotion-details']}>
                                        <h4>{activePromotion.title}</h4>
                                        <p>Save {activePromotion.discount}% - Discount automatically applied!</p>
                                        <p className={styles['promotion-timer']}>⏰ Ends in: {formatCountdown(timeLeft)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles['product-details-info']}>
                            <span>
                                <h4>Description</h4>
                                <p>{product['description']}</p>
                            </span>
                            <span>
                                <h4>Price</h4>
                                {activePromotion ? (
                                    <div className={styles['price-display']}>
                                        <h3 className={styles['discounted-price']}>{safeFormatPrice(displayPrice)}</h3>
                                        <span className={styles['original-price']}>{safeFormatPrice(product['price'])}</span>
                                        <span className={styles['savings']}>
                                            You save: {safeFormatPrice(product['price'] - discountedPrice)}
                                        </span>
                                    </div>
                                ) : (
                                    <h3>{safeFormatPrice(displayPrice)}</h3>
                                )}
                            </span>
                            
                            {/* Stars and review count */}
                            <div className={styles['product-rating']}>
                                {[...Array(5)].map((_, i) => (
                                    <i
                                        key={i}
                                        className={`fa-solid fa-star ${i < Math.round(reviewStats.averageRating) ? styles['filled-star'] : styles['empty-star']}`}
                                    ></i>
                                ))}
                                <span className={styles['review-count']}>
                                    ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
                                </span>
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className={styles['quantity-selector']}>
                            <h4>Quantity</h4>
                            <Counter
                                value={productQuantity}
                                max={product ? product['stock_quantity'] : 0}
                                onChange={handleQuantityChange}
                                onMinimumReached={handleMinimumReached}
                                disabled={isOutOfStock}
                            />
                        </div>

                        <div className={styles['product-details-ctas']}>
                            <Button
                                type='secondary'
                                label='Buy now'
                                icon='fa-solid fa-credit-card'
                                iconPosition='left'
                                externalStyles={styles['checkout']}
                                action={ () => requireAuth(() => {
                                    setModalType('checkout');
                                    setModalOpen(true);
                                })}
                            />
                            <Button
                                type='primary'
                                label='Add to Cart'
                                icon='fa-solid fa-cart-plus'
                                iconPosition='left'
                                externalStyles={styles['cart']}
                                action={ () => requireAuth(() => {
                                    setModalType('cart');
                                    setModalOpen(true);
                                })}
                            />
                            <Button
                                type='icon-outlined'
                                icon={isInWishlist(product_id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
                                action={ () => requireAuth(() => {
                                    isInWishlist(product_id) ? removeFromWishlist(product_id) : addToWishlist(product_id);
                                })}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Reviews Section */}
                <ProductReviews
                    productId={product?.id}
                    productName={product?.name}
                    currentUserId={user?.id}
                    canUserReview={!!user}
                    onStatsUpdate={setReviewStats}
                />
            </div>
            
            {/* Add to Cart Modal */}
            <Modal
                label={`Add ${product ? product['label'] : 'Product'} to Cart`}
                isOpen={modalOpen && modalType === 'cart'}
                onClose={() => setModalOpen(false)}
            >
                <h3 className={styles['modal-info']}>Are you sure you want to add this product to your cart?</h3>

                <div className={`${styles['modal-infos']} ${styles['modal-align-start']}`}>
                    <h3>{product ? product['label'] : 'Product'}</h3>
                    <p>Stock Available: <strong>{product ? product['stock_quantity'] : 0}</strong></p>
                    {activePromotion && (
                        <div className={styles['modal-promotion']}>
                            <p className={styles['promotion-badge']}>
                                🎉 {activePromotion.discount}% OFF - Automatically Applied!
                            </p>
                            {timeLeft && formatCountdown(timeLeft) && (
                                <p className={styles['promotion-timer']}>
                                    ⏰ Expires in: {formatCountdown(timeLeft)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className={`${styles['modal-infos']} ${styles['modal-row']}`}>
                    <span className={styles['quantity-buttons']}>
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-minus'
                            action={() => setProductQuantity(prevQuantity => prevQuantity - 1)}
                            disabled={productQuantity <= 1}
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-plus'
                            action={() => setProductQuantity(prevQuantity => prevQuantity + 1)}
                            disabled={productQuantity >= (product ? product['stock_quantity'] : 0)}
                        />
                    </span>

                    <p className={styles['quantity-label']}>{productQuantity}x</p>
                </div>

                <div className={`${styles['modal-infos']} ${styles['modal-align-start']}`}>
                    {activePromotion ? (
                        <div className={styles['price-breakdown']}>
                            <p className={styles['original-total']}>
                                Original: {safeFormatPrice(product['price'] * productQuantity)}
                            </p>
                            <p className={styles['discount-amount']}>
                                Discount ({activePromotion.discount}%): -{safeFormatPrice((product['price'] - discountedPrice) * productQuantity)}
                            </p>
                            <h3 className={styles['final-total']}>
                                Total: {safeFormatPrice(displayPrice * productQuantity)}
                            </h3>
                        </div>
                    ) : (
                        <h3>Total: {safeFormatPrice(displayPrice * productQuantity)}</h3>
                    )}
                </div>
                
                <div className={styles['modal-ctas']}>
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

            {/* Buy Now Modal */}
            <Modal
                label={`Buy ${product ? product['label'] : 'Product'} Now`}
                isOpen={modalOpen && modalType === 'checkout'}
                onClose={() => setModalOpen(false)}
            >
                <h3 className={styles['modal-info']}>This will take you directly to checkout.</h3>

                <div className={`${styles['modal-infos']} ${styles['modal-align-start']}`}>
                    <h3>{product ? product['label'] : 'Product'}</h3>
                    <p>Stock Available: <strong>{product ? product['stock_quantity'] : 0}</strong></p>
                    {activePromotion && (
                        <div className={styles['modal-promotion']}>
                            <p className={styles['promotion-badge']}>
                                🎉 {activePromotion.discount}% OFF - Automatically Applied!
                            </p>
                            {timeLeft && formatCountdown(timeLeft) && (
                                <p className={styles['promotion-timer']}>
                                    ⏰ Expires in: {formatCountdown(timeLeft)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className={`${styles['modal-infos']} ${styles['modal-row']}`}>
                    <span className={styles['quantity-buttons']}>
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-minus'
                            action={() => setProductQuantity(prevQuantity => prevQuantity - 1)}
                            disabled={productQuantity <= 1}
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-solid fa-plus'
                            action={() => setProductQuantity(prevQuantity => prevQuantity + 1)}
                            disabled={productQuantity >= (product ? product['stock_quantity'] : 0)}
                        />
                    </span>

                    <p className={styles['quantity-label']}>{productQuantity}x</p>
                </div>

                <div className={`${styles['modal-infos']} ${styles['modal-align-start']}`}>
                    {activePromotion ? (
                        <div className={styles['price-breakdown']}>
                            <p className={styles['original-total']}>
                                Original: {safeFormatPrice(product['price'] * productQuantity)}
                            </p>
                            <p className={styles['discount-amount']}>
                                Discount ({activePromotion.discount}%): -{safeFormatPrice((product['price'] - discountedPrice) * productQuantity)}
                            </p>
                            <h3 className={styles['final-total']}>
                                Total: {safeFormatPrice(displayPrice * productQuantity)}
                            </h3>
                        </div>
                    ) : (
                        <h3>Total: {safeFormatPrice(displayPrice * productQuantity)}</h3>
                    )}
                </div>

                <div className={styles['modal-ctas']}>
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

export default ProductPage;
