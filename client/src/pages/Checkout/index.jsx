import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, ReturnButton } from '@components';
import { useAuth, useCart, useCheckout, useToast } from '@contexts';
import styles from './Checkout.module.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedCartItems } = useCart();
    const { createOrder, updateCheckoutData, checkoutData, loading, directCheckoutItem } = useCheckout();
    const { showToast } = useToast();

    const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
    const [notes, setNotes] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {

        console.log("isPlacingOrder: ", isPlacingOrder);
        console.log("loading: ", loading);
        console.log("directCheckoutItem: ", directCheckoutItem);
        console.log("selectedCartItems: ", selectedCartItems);
        console.log("checkoutItems: ", checkoutItems);

    }, []);

    const checkoutItems = directCheckoutItem ? [directCheckoutItem] : selectedCartItems;
    const subtotal = checkoutItems?.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0) || 0;

    const shippingFee = 0;
    const tax = 0;
    const discount = 0;
    const total = subtotal + shippingFee + tax - discount;

    const handlePlaceOrder = async () => {
        if (!user || checkoutItems.length === 0) return;

        if (!subtotal || subtotal <= 0 || isNaN(subtotal)) {
            showToast('Invalid order total. Please refresh and try again.', 'error');
            return;
        }

        setIsPlacingOrder(true);
        
        try {
                `${user.street || ''}, ${user.city || ''}, ${user.province || ''}, ${user.postal_code || ''}`.replace(/,\s*,/g, ',').trim();
            const shippingAddress = user.address;
                
            const orderData = {
                items: checkoutItems.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.price),
                    total: parseFloat(item.price) * parseInt(item.quantity)
                })),
                paymentMethod,
                subtotal: parseFloat(subtotal.toFixed(2)),
                shippingFee: parseFloat(shippingFee.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                discount: parseFloat(discount.toFixed(2)),
                totalAmount: parseFloat(total.toFixed(2)),
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
                        {/* <h2 className={styles['checkout-section-header']}>Shipping Address</h2> */}
                        <div className={styles['address-display']}>
                            <div className={styles['address-line']}>
                                <strong>{user?.first_name} {user?.last_name}</strong>
                            </div>
                            {/* <div className={styles['address-line']}>
                                {user?.street || 'No street address provided'}
                            </div>
                            <div className={styles['address-line']}>
                                {user?.city}, {user?.province} {user?.postal_code}
                            </div> */}
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
                            {checkoutItems.map(item => (
                                <div key={item.product_id} className={styles['checkout-item']}>
                                    <div className={styles['checkout-item-content']}>
                                        <img
                                            src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/products/${item.image_url}`}
                                            alt={`${item.label}. Price: ${item.price}`}
                                        />
                                        <div className={styles['checkout-item-details']}>
                                            <div className={styles['checkout-item-details-left']}>
                                                <span>
                                                    <h3>{ item.label }</h3>
                                                    <h4>₱{parseFloat(item.price).toLocaleString('en-PH', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}</h4>
                                                </span>
                                                <h4><b>Category:</b> {item.category} | <b>Sub-category:</b> {item.subcategory}</h4>
                                            </div>
                                            <div className={styles['checkout-item-details-right']}>
                                                <div className={styles['checkout-item-quantity']}>
                                                    <span className={styles['quantity-label']}>Qty: {item.quantity}</span>
                                                </div>
                                                <div className={styles['checkout-item-total']}>
                                                    <h4>₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-PH', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}</h4>
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
                                    <h3>₱{ subtotal.toLocaleString('en-PH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</h3>
                                </div>
                                <div className={styles['summary-item']}>
                                    <h3>Shipping Fee</h3>
                                    <h3>Free</h3>
                                </div>
                            </span>
                            <div className={ styles['divider'] }></div>
                            <div className={styles['summary-item-total']}>
                                <h3>Total</h3>
                                <h3>₱{ total.toLocaleString('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</h3>
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
