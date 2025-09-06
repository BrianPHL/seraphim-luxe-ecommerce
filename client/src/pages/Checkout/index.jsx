import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, ReturnButton } from '@components';
import { useAuth, useCart, useCheckout, useToast, useSettings } from '@contexts';
import styles from './Checkout.module.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedCartItems } = useCart();
    const { createOrder, updateCheckoutData, checkoutData, loading, directCheckoutItem } = useCheckout();
    const { showToast } = useToast();
    const { settings, convertPrice, formatPrice } = useSettings();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [convertedItems, setConvertedItems] = useState([]);
    
    const checkoutItems = directCheckoutItem ? [directCheckoutItem] : selectedCartItems;

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

    useEffect(() => {
        const convertItemPrices = async () => {
            if (!checkoutItems.length) {
                setConvertedItems([]);
                return;
            }

            try {
                const itemsWithConvertedPrices = await Promise.all(
                    checkoutItems.map(async (item) => {
                        let convertedPrice = item.price;
                        
                        if (settings?.currency && settings.currency !== 'PHP' && convertPrice) {
                            try {
                                convertedPrice = await convertPrice(item.price, settings.currency);
                            } catch (error) {
                                console.error('Error converting price for item:', item.product_id, error);
                                convertedPrice = item.price; 
                            }
                        }
                        
                        return {
                            ...item,
                            displayPrice: convertedPrice
                        };
                    })
                );
                
                setConvertedItems(itemsWithConvertedPrices);
            } catch (error) {
                console.error('Error converting checkout item prices:', error);
                setConvertedItems(checkoutItems.map(item => ({
                    ...item,
                    displayPrice: item.price
                })));
            }
        };

        if (settings) {
            convertItemPrices();
        }
    }, [checkoutItems, settings?.currency, convertPrice, settings]);

    const subtotal = convertedItems.reduce((sum, item) => {
        const priceValue = parseFloat(item.displayPrice || item.price);
        return sum + (priceValue * parseInt(item.quantity));
    }, 0);

    const shippingFee = 0;
    const tax = 0;
    const discount = 0;
    const total = subtotal + shippingFee + tax - discount;

    useEffect(() => {
        if (settings?.preferred_payment_method && settings.preferred_payment_method.trim() !== '') {
            setPaymentMethod(settings.preferred_payment_method);
        } else if (user?.payment_method && user.payment_method.trim() !== '') {
            setPaymentMethod(user.payment_method);
        } else {
            setPaymentMethod('cash_on_delivery');
        }
    }, [settings, user]);

    const handlePlaceOrder = async () => {
        if (!user || checkoutItems.length === 0) return;

        if (!subtotal || subtotal <= 0 || isNaN(subtotal)) {
            showToast('Invalid order total. Please refresh and try again.', 'error');
            return;
        }

        setIsPlacingOrder(true);
        
        try {
            const shippingAddress = user.address;
                
            const orderData = {
                items: checkoutItems.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.price), 
                    total: parseFloat(item.price) * parseInt(item.quantity)
                })),
                paymentMethod,
                subtotal: parseFloat(checkoutItems.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0).toFixed(2)), 
                shippingFee: parseFloat(shippingFee.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                discount: parseFloat(discount.toFixed(2)),
                totalAmount: parseFloat((checkoutItems.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0) + shippingFee + tax - discount).toFixed(2)),
                notes: notes.trim(),
                shippingAddress: shippingAddress
            };

            const result = await createOrder(orderData);
            
            if (result.success)
                navigate('/collections');

        } catch (err) {
            console.error("Error placing order:", err);
            showToast('Failed to place order. Please try again.', 'error');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (!checkoutItems || checkoutItems.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles['wrapper']}>
            <div className={styles['banner']}></div>
            <div className={styles['header']}>
                <ReturnButton />
                <h1>Checkout</h1>
            </div>
            
            <div className={styles['container']}>

                <div className={styles['checkout-main']}>

                    <div className={styles['checkout-section']}>
                        <div className={ styles['checkout-section-header'] }>
                            <h2>Shipping Address</h2>
                            <Button
                                type='secondary'
                                label='Edit'
                                icon='fa-solid fa-pen'
                                iconPosition='left'
                                action={ () => {} }
                            />
                        </div>
                        <div className={styles['address-display']}>
                            <div className={styles['address-line']}>
                                <strong>{user?.first_name} {user?.last_name}</strong>
                            </div>
                            <div className={ styles['address-line'] }>
                                { user?.address }
                            </div>
                            <div className={ styles['address-line'] }>
                                { user?.contact_number }
                            </div>
                            <div className={styles['address-line']}>
                                Philippines
                            </div>
                        </div>
                    </div>

                    <div className={styles['checkout-section']}>
                        <div className={ styles['checkout-section-header'] }>
                            <h2>Order Items ({checkoutItems.length})</h2>
                        </div>
                        <div className={styles['checkout-items']}>
                            {convertedItems.map(item => (
                                <div key={item.product_id} className={styles['checkout-item']}>
                                    <div className={styles['checkout-item-content']}>
                                        <img
                                            src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                            alt={`${item.label}. Price: ${item.price}`}
                                        />
                                        <div className={styles['checkout-item-details']}>
                                            <div className={styles['checkout-item-details-left']}>
                                                <span>
                                                    <h3>{ item.label }</h3>
                                                    <h4>{ safeFormatPrice(item.displayPrice || item.price) }</h4>
                                                </span>
                                                <h4><b>Category:</b> {item.category} | <b>Sub-category:</b> {item.subcategory}</h4>
                                            </div>
                                            <div className={styles['checkout-item-details-right']}>
                                                <div className={styles['checkout-item-quantity']}>
                                                    <span className={styles['quantity-label']}>Qty: {item.quantity}</span>
                                                </div>
                                                <div className={styles['checkout-item-total']}>
                                                    <h4>{ safeFormatPrice((parseFloat(item.displayPrice || item.price) * item.quantity)) }</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles['checkout-sidebar']}>
                    
                    <div className={styles['checkout-section']}>
                        <div className={ styles['checkout-section-header'] }>
                            <h2>Payment Method</h2>
                        </div>
                        <div className={styles['payment-methods']}>
                            <label className={styles['payment-option']}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="cash_on_delivery"
                                    checked={paymentMethod === 'cash_on_delivery'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <div className={styles['payment-content']}>
                                    <div className={styles['payment-title']}>Cash on Delivery</div>
                                    <div className={styles['payment-description']}>Pay when you receive your order</div>
                                </div>
                            </label>
                            
                            <label className={styles['payment-option']}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="bank_transfer"
                                    checked={paymentMethod === 'bank_transfer'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <div className={styles['payment-content']}>
                                    <div className={styles['payment-title']}>Bank Transfer</div>
                                    <div className={styles['payment-description']}>Direct bank account transfer</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className={styles['checkout-section']}>
                        <div className={ styles['checkout-section-header'] }>
                            <h2>Order Notes (Optional)</h2>
                        </div>
                        <textarea
                            className={styles['checkout-notes']}
                            placeholder="Any special instructions for your order..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className={ styles['summary'] }>
                        <h2>Order Summary</h2>
                        <div className={ styles['summary-wrapper'] }>
                            <span>
                                <div className={ styles['summary-item'] }>
                                    <h3>Subtotal ({checkoutItems.length} items)</h3>
                                    <h3>{ safeFormatPrice(subtotal) }</h3>
                                </div>
                                <div className={styles['summary-item']}>
                                    <h3>Shipping Fee</h3>
                                    <h3>Free</h3>
                                </div>
                            </span>
                            <div className={ styles['divider'] }></div>
                            <div className={styles['summary-item-total']}>
                                <h3>Total</h3>
                                <h3>{ safeFormatPrice(total) }</h3>
                            </div>
                        </div>
                        
                        <Button
                            type="primary"
                            label={isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                            disabled={isPlacingOrder || loading}
                            action={handlePlaceOrder}
                            externalStyles={styles['place-order-button']}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;