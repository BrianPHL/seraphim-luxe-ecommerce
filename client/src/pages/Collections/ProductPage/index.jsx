import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './ProductPage.module.css';
import { Button, ReturnButton, InputField, Modal, Counter } from '@components';
import { useProducts, useAuth, useCart, useCheckout, useToast, useCategories, useSettings, useWishlist } from '@contexts';

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
    const [ selectedImageIdx, setSelectedImageIdx ] = useState(0);
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { products } = useProducts();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { setDirectCheckout } = useCheckout();
    const { showToast } = useToast();
    const { getCategoryById, getSubcategoriesByCategory } = useCategories();
    const { settings, convertPrice, formatPrice } = useSettings(); 
    const navigate = useNavigate();

    const handleQuantityChange = (newValue) => {
        setProductQuantity(newValue);
    };

    const handleMinimumReached = () => {
        // Keep quantity at 1 for product page (different from cart behavior)
        setProductQuantity(1);
    };

    const [ displayPrice, setDisplayPrice] = useState(0);

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

    useEffect(() => {
        if (products && products.length > 0) {
            const foundProduct = products.find(p => p.id === parseInt(product_id));
            if (foundProduct) {
                setProduct(foundProduct);
            }
            setLoading(false);
        }
    }, [products, product_id]);

    //Use Effect for Price Conversion
    useEffect(() => {
        const updatePrice = async () => {
            if (!product?.price) return;
            
            try {
                if (settings?.currency && settings.currency !== 'PHP' && convertPrice) {
                    const converted = await convertPrice(product.price, settings.currency);
                    setDisplayPrice(converted);
                } else {
                    setDisplayPrice(product.price);
                }
            } catch (error) {
                console.error('Error converting price:', error);
                setDisplayPrice(product.price);
            }
        };
        
        if (settings && product) {
            updatePrice();
        }
    }, [product?.price, settings?.currency, convertPrice, settings, product]);

    const requireAuth = (action) => {
        if (!user) {
            showToast('You must be signed in to perform this action!', 'error');
            return;
        }
        action();
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
                price: product['price'],
                quantity: productQuantity
            });
            showToast(`Successfully added ${ product['label'] } to your cart!`, 'success');
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
                price: product['price'],
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

    const isOutOfStock = product && product['stock_quantity'] <= 0;
    const isLowStock = product && product['stock_quantity'] > 0 && product['stock_quantity'] <= 5;

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

    const imageUrls = product ? getProductImageUrls(product) : [];

    return (
        <>
            <div className={ styles['wrapper'] }>
                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>Product Details</h1>
                </div>
                <div className={ styles['product'] }>
                    <div className={ styles['product-image-gallery'] }>
                        {/* Vertical Thumbnails on the Left */}
                        {imageUrls.length > 1 && (
                            <div className={ styles['product-thumbnails-vertical'] }>
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
                        <div className={ styles['main-image-container'] }>
                            <img
                                src={ `https://res.cloudinary.com/dfvy7i4uc/image/upload/${ imageUrls[selectedImageIdx] || product['image_url'] }` }
                                alt={ `${ product['label'] }. Price: ${ product['price'] }` } 
                                className={ styles ['product-image'] }
                            />
                        </div>
                    </div>
                    
                    <div className={ styles['product-details'] }>
                        <div className={ styles['product-details-header'] }>
                            <h2>{ product['label'] }</h2>
                            <h3 style={{ marginTop: '2rem' }}>
                                <strong>Category:</strong> { product['category'] } | <strong>Sub-category:</strong> { product['subcategory'] }
                            </h3>
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
                                <h4 style={{ color: 'var(--tg-primary)' }}>Description</h4>
                                <p>{ product['description'] }</p>
                            </span>
                            <span>
                                <h4 style={{ color: 'var(--tg-primary)' }}>Price</h4>
                                <h3 style={{ color: 'var(--tg-primary)' }}>{ safeFormatPrice(displayPrice) }</h3>
                            </span>
                        </div>

                        {/* Quantity Selector */}
                        <div className={ styles['quantity-selector'] }>
                            <h4 style={{ color: 'var(--tg-primary)' }}>Quantity</h4>
                            <Counter
                                value={productQuantity}
                                max={product ? product['stock_quantity'] : 0}
                                onChange={handleQuantityChange}
                                onMinimumReached={handleMinimumReached}
                                disabled={isOutOfStock}
                            />
                        </div>

                        <div className={ styles['product-details-ctas'] }>
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
                                type='primary'
                                label='Add to Cart'
                                icon='fa-solid fa-cart-plus'
                                iconPosition='left'
                                externalStyles={ styles['cart'] }
                                disabled={isOutOfStock}
                                action={() => {
                                    requireAuth(() => {
                                        setModalType('cart');
                                        setModalOpen(true);
                                    });
                                }}
                            />
                            <Button
                                type='icon-outlined'
                                icon={ isInWishlist(product_id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart' }
                                action={ () => {
                                    requireAuth(() => {
                                        isInWishlist(product_id) ? removeFromWishlist(product_id) : addToWishlist(product_id);
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                label={ `Add ${ product ? product['label'] : 'Product' } to Cart` }
                isOpen={ modalOpen && modalType === 'cart' }
                onClose={ () => setModalOpen(false) }
            >
                <h3 className={ styles['modal-info'] }>Are you sure you want to add this product to your cart?</h3>

                <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                    <h3>{ product ? product['label'] : 'Product' }</h3>
                    <p>Stock Available: <strong>{product ? product['stock_quantity'] : 0}</strong></p>
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
                            disabled={ productQuantity >= (product ? product['stock_quantity'] : 0) }
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
                label={ `Buy ${ product ? product['label'] : 'Product' } Now` }
                isOpen={ modalOpen && modalType === 'checkout' }
                onClose={ () => setModalOpen(false) }
            >
                <h3 className={ styles['modal-info'] }>This will take you directly to checkout.</h3>

                <div style={{ alignItems: 'flex-start' }} className={ styles['modal-infos'] }>
                    <h3>{ product ? product['label'] : 'Product' }</h3>
                    <p>Stock Available: <strong>{product ? product['stock_quantity'] : 0}</strong></p>
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
                            disabled={ productQuantity >= (product ? product['stock_quantity'] : 0) }
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

export default ProductPage;