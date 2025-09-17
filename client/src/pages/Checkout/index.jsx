import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button, ReturnButton, Modal, InputField } from '@components';
import { useAuth, useCart, useCheckout, useToast, useSettings } from '@contexts';
import styles from './Checkout.module.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { user, addressBook, getAddressBook, addAddress } = useAuth();
    const { selectedCartItems } = useCart();
    const { createOrder, loading, directCheckoutItem } = useCheckout();
    const { showToast } = useToast();
    const { settings, fetchSettings, fetchEnabledPaymentMethods, enabledPaymentMethods, convertPrice, formatPrice } = useSettings();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [convertedItems, setConvertedItems] = useState([]);
    const [paypalClientId, setPaypalClientId] = useState(null);
    const [paypalLoading, setPaypalLoading] = useState(false);
    const [paypalScriptLoading, setPaypalScriptLoading] = useState(false);
    const [paypalScriptError, setPaypalScriptError] = useState(false);
    const [paypalRetryCount, setPaypalRetryCount] = useState(0);

    const [selectedShippingAddress, setSelectedShippingAddress] = useState(null);
    const [selectedBillingAddress, setSelectedBillingAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);
    const [currentAddressType, setCurrentAddressType] = useState('shipping');

    const [newAddressForm, setNewAddressForm] = useState({
        full_name: '',
        phone_number: '',
        province: '',
        city: '',
        barangay: '',
        postal_code: '',
        street_address: '',
        is_default_billing: false,
        is_default_shipping: false,
    });
    
    const checkoutItems = directCheckoutItem ? [directCheckoutItem] : selectedCartItems;

    useEffect(() => {
        const init = async () => {
            await fetchSettings();
            await fetchEnabledPaymentMethods();
            await initializePayPal();
        };
        init();
    }, []);

    const initializePayPal = async () => {
        try {
            setPaypalScriptLoading(true);
            setPaypalScriptError(false);
            
            const response = await fetch('/api/paypal/get-client-id');
            if (!response.ok) {
                throw new Error('Failed to fetch PayPal client ID');
            }
            
            const data = await response.json();
            setPaypalClientId(data.clientId);
            
        } catch (error) {
            console.error('Failed to get PayPal client ID:', error);
            setPaypalScriptError(true);
            showToast('Failed to load PayPal. Please try again.', 'error');
        } finally {
            setPaypalScriptLoading(false);
        }
    };

    const retryPayPalInitialization = () => {
        setPaypalRetryCount(prev => prev + 1);
        setPaypalClientId(null);
        initializePayPal();
    };

    const paypalOptions = paypalClientId ? {
        "client-id": paypalClientId,
        currency: settings?.currency === 'PHP' ? "USD" : (settings?.currency || "USD"),
        intent: "capture",
        "data-sdk-integration-source": "react-paypal-js",
        "buyer-country": "US",
        "disable-funding": "venmo",
        "enable-funding": "",
        "data-page-type": "checkout",
    } : null;

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
        if (user && !addressBook) {
            getAddressBook();
        }
    }, [user, addressBook, getAddressBook]);

    useEffect(() => {
        if (addressBook?.addresses) {
            const defaultShipping = addressBook.addresses.find(addr => 
                addr.id === addressBook.defaults?.default_shipping_address
            );
            const defaultBilling = addressBook.addresses.find(addr => 
                addr.id === addressBook.defaults?.default_billing_address
            );
            
            if (defaultShipping && !selectedShippingAddress) {
                setSelectedShippingAddress(defaultShipping);
            }
            if (defaultBilling && !selectedBillingAddress) {
                setSelectedBillingAddress(defaultBilling);
            }
        }
    }, [addressBook, selectedShippingAddress, selectedBillingAddress]);

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

        convertItemPrices();
    }, [settings?.currency, convertPrice, checkoutItems]);

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

    const handleAddressSelection = (addressType) => {
        setCurrentAddressType(addressType);
        setShowAddressModal(true);
    };

    const handleSelectAddress = (address) => {
        if (currentAddressType === 'shipping') {
            setSelectedShippingAddress(address);
        } else {
            setSelectedBillingAddress(address);
        }
        setShowAddressModal(false);
    };

    const handleNewAddressFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAddressForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetNewAddressForm = () => {
        setNewAddressForm({
            full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
            phone_number: user?.phone_number || '',
            province: '',
            city: '',
            barangay: '',
            postal_code: '',
            street_address: '',
            is_default_billing: false,
            is_default_shipping: false,
        });
    };

    const handleCreateNewAddress = async () => {
        try {
            await addAddress(newAddressForm);
            await getAddressBook();
            
            const newAddress = addressBook?.addresses?.find(addr => 
                addr.street_address === newAddressForm.street_address &&
                addr.full_name === newAddressForm.full_name
            );
            
            if (newAddress) {
                if (currentAddressType === 'shipping') {
                    setSelectedShippingAddress(newAddress);
                } else {
                    setSelectedBillingAddress(newAddress);
                }
            }
            
            showToast('Address added successfully!', 'success');
            setShowNewAddressModal(false);
            resetNewAddressForm();
        } catch (error) {
            console.error('Error creating address:', error);
            showToast('Failed to add address. Please try again.', 'error');
        }
    };

    const convertDisplayPricesToPHP = (items) => {
        const displayCurrency = settings?.currency || 'PHP';
        
        if (displayCurrency === 'PHP') {
            return items; 
        }

        return items.map(item => {
            let phpPrice = item.price; 
            
            if (item.displayPrice) {
                switch (displayCurrency?.toUpperCase()) {
                    case 'USD':
                        phpPrice = item.displayPrice / 0.018;
                        break;
                    case 'EUR':
                        phpPrice = item.displayPrice / 0.016; 
                        break;
                    case 'JPY':
                        phpPrice = item.displayPrice / 2.70;
                        break;
                    case 'CAD':
                        phpPrice = item.displayPrice / 0.024; 
                        break;
                    default:
                        phpPrice = item.price;
                }
            }
            
            return {
                ...item,
                price: phpPrice,
                displayPrice: item.displayPrice 
            };
        });
    };

    const handlePlaceOrder = async () => {
        if (!user || checkoutItems.length === 0 || !selectedShippingAddress) {
            showToast('Please complete all required fields', 'error');
            return;
        }

        setIsPlacingOrder(true);

        const itemsInPHP = convertDisplayPricesToPHP(convertedItems);
        
        const totalInPHP = itemsInPHP.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        try {
            const orderData = {
                items: itemsInPHP.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.price),
                    total: parseFloat(item.price) * parseInt(item.quantity)
                })),
                payment_method: paymentMethod,
                subtotal: parseFloat(subtotal.toFixed(2)),
                shippingFee: parseFloat(shippingFee.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                discount: parseFloat(discount.toFixed(2)),
                totalAmount: totalInPHP,
                total_Amount: totalInPHP,
                currency: 'PHP',
                display_currency: settings?.currency || 'PHP',
                notes: notes.trim(),
                shipping_address_id: selectedShippingAddress.id,
                billing_address_id: selectedBillingAddress?.id || selectedShippingAddress.id
            };

            const result = await createOrder(orderData);

            if (result.success) {
                navigate('/orders');
            }

        } catch (err) {
            console.error("Error placing order:", err);
            showToast('Failed to place order. Please try again.', 'error');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const createPayPalOrder = async () => {
        try {
            setPaypalLoading(true);
            
            const totalAmountInDisplayCurrency = convertedItems.reduce((sum, item) => {
                const priceValue = parseFloat(item.displayPrice || item.price);
                return sum + (priceValue * parseInt(item.quantity));
            }, 0);

            const userCurrency = settings?.currency || "PHP";
            
            const response = await fetch("/api/paypal/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currency: userCurrency,
                    displayCurrency: userCurrency,
                    amount: totalAmountInDisplayCurrency.toFixed(2)
                }),
            });
        
            const orderData = await response.json();
        
            if (orderData.id) {
                return orderData.id;
            } else {
                throw new Error("Failed to create PayPal order");
            }
        } catch (error) {
            console.error("PayPal order creation failed:", error);
            showToast('PayPal order creation failed', 'error');
            throw error;
        } finally {
            setPaypalLoading(false);
        }
    };

    const onPayPalApprove = async (data, actions) => {
        try {
            setPaypalLoading(true);

            const response = await fetch(`/api/paypal/orders/${data.orderID}/capture`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const orderData = await response.json();

            if (orderData.status === 'COMPLETED') {
                const itemsInPHP = convertDisplayPricesToPHP(convertedItems);
                
                const totalInPHP = itemsInPHP.reduce((sum, item) => {
                    return sum + (parseFloat(item.price) * item.quantity);
                }, 0);

                const orderPayload = {
                    items: itemsInPHP.map(item => ({
                        product_id: parseInt(item.product_id),
                        quantity: parseInt(item.quantity),
                        price: parseFloat(item.price),
                        total: parseFloat(item.price) * parseInt(item.quantity)
                    })),
                    payment_method: 'paypal',
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    shippingFee: parseFloat(shippingFee.toFixed(2)),
                    tax: parseFloat(tax.toFixed(2)),
                    discount: parseFloat(discount.toFixed(2)),
                    totalAmount: totalInPHP,
                    total_Amount: totalInPHP,
                    currency: 'PHP',
                    display_currency: settings?.currency || 'PHP',
                    notes: notes.trim(),
                    shipping_address_id: selectedShippingAddress.id,
                    billing_address_id: selectedBillingAddress?.id || selectedShippingAddress.id,
                    paypal_transaction_id: data.orderID
                };

                const result = await createOrder(orderPayload);

                if (result.success) {
                    showToast('Payment successful!', 'success');
                    navigate('/orders');
                }
            } else {
                throw new Error('PayPal payment not completed');
            }
        } catch (error) {
            console.error("PayPal approval failed:", error);
            showToast('Payment processing failed', 'error');
        } finally {
            setPaypalLoading(false);
        }
    };

    const onPayPalError = (error) => {
        console.error("PayPal error:", error);
        setPaypalScriptError(true);
        showToast('PayPal encountered an error. Please try again.', 'error');
    };

    const renderPayPalButtons = () => {
        if (paypalScriptLoading) {
            return (
                <div className={styles['paypal-loading-state']}>
                    <div className={styles['paypal-loader']}>
                        <div className={styles['spinner']}></div>
                        <p>Loading PayPal...</p>
                    </div>
                </div>
            );
        }

        if (paypalScriptError || !paypalClientId) {
            return (
                <div className={styles['paypal-error-state']}>
                    <div className={styles['paypal-error']}>
                        <i className="fa-solid fa-exclamation-triangle"></i>
                        <p>Failed to load PayPal</p>
                        <Button
                            type="secondary"
                            label="Try Again"
                            icon="fa-solid fa-refresh"
                            iconPosition="left"
                            action={retryPayPalInitialization}
                            disabled={paypalScriptLoading}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className={styles['paypal-payment-section']}>
                <PayPalScriptProvider 
                    options={paypalOptions}
                    onError={onPayPalError}
                >
                    <PayPalButtons
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onError={onPayPalError}
                        disabled={!selectedShippingAddress || paypalLoading}
                        style={{
                            shape: "rect",
                            layout: "vertical"
                        }}
                    />
                </PayPalScriptProvider>
                {paypalLoading && (
                    <div className={styles['paypal-processing']}>
                        <div className={styles['spinner']}></div>
                        <p>Processing payment...</p>
                    </div>
                )}
            </div>
        );
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
                        <div className={styles['checkout-section-header']}>
                            <h2>Shipping Address</h2>
                            <Button
                                type='secondary'
                                label={selectedShippingAddress ? 'Change' : 'Select'}
                                icon='fa-solid fa-pen'
                                iconPosition='left'
                                action={() => handleAddressSelection('shipping')}
                            />
                        </div>
                        {selectedShippingAddress ? (
                            <div className={styles['address-display']}>
                                <div className={styles['address-item-content']}>
                                    <div className={styles['address-main']}>
                                        <span className={styles['address-name']}>
                                            <strong>{selectedShippingAddress.full_name}</strong>
                                        </span>
                                        <span className={styles['address-phone']}>
                                            {selectedShippingAddress.phone_number && (
                                                <>
                                                    {"|"}
                                                    <span>(+63) {selectedShippingAddress.phone_number}</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles['address-details']}>
                                        <div>
                                            {selectedShippingAddress.street_address}
                                            <br />
                                            {selectedShippingAddress.barangay}, {selectedShippingAddress.city}, {selectedShippingAddress.province}, {selectedShippingAddress.postal_code}
                                        </div>
                                    </div>
                                    <div className={styles['address-tags']}>
                                        {addressBook?.defaults?.default_shipping_address === selectedShippingAddress.id && (
                                            <span className={styles['address-tag']}>Default Shipping</span>
                                        )}
                                        {addressBook?.defaults?.default_billing_address === selectedShippingAddress.id && (
                                            <span className={styles['address-tag']}>Default Billing</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles['address-display']}>
                                <div className={styles['address-line']}>
                                    No shipping address selected
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className={styles['checkout-section']}>
                        <div className={styles['checkout-section-header']}>
                            <h2>Billing Address</h2>
                            <Button
                                type='secondary'
                                label={selectedBillingAddress ? 'Change' : 'Select'}
                                icon='fa-solid fa-pen'
                                iconPosition='left'
                                action={() => handleAddressSelection('billing')}
                            />
                        </div>
                        {selectedBillingAddress ? (
                            <div className={styles['address-display']}>
                                <div className={styles['address-item-content']}>
                                    <div className={styles['address-main']}>
                                        <span className={styles['address-name']}>
                                            <strong>{selectedBillingAddress.full_name}</strong>
                                        </span>
                                        <span className={styles['address-phone']}>
                                            {selectedBillingAddress.phone_number && (
                                                <>
                                                    {"|"}
                                                    <span>(+63) {selectedBillingAddress.phone_number}</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles['address-details']}>
                                        <div>
                                            {selectedBillingAddress.street_address}
                                            <br />
                                            {selectedBillingAddress.barangay}, {selectedBillingAddress.city}, {selectedBillingAddress.province}, {selectedBillingAddress.postal_code}
                                        </div>
                                    </div>
                                    <div className={styles['address-tags']}>
                                        {addressBook?.defaults?.default_billing_address === selectedBillingAddress.id && (
                                            <span className={styles['address-tag']}>Default Billing</span>
                                        )}
                                        {addressBook?.defaults?.default_shipping_address === selectedBillingAddress.id && (
                                            <span className={styles['address-tag']}>Default Shipping</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles['address-display']}>
                                <div className={styles['address-line']}>
                                    Same as shipping address
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles['checkout-section']}>
                        <div className={styles['checkout-section-header']}>
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
                                                    <h3>{item.label}</h3>
                                                    <h4>{safeFormatPrice(item.displayPrice || item.price)}</h4>
                                                </span>
                                                <h4><b>Category:</b> {item.category} | <b>Sub-category:</b> {item.subcategory}</h4>
                                            </div>
                                            <div className={styles['checkout-item-details-right']}>
                                                <div className={styles['checkout-item-quantity']}>
                                                    <span className={styles['quantity-label']}>Qty: {item.quantity}</span>
                                                </div>
                                                <div className={styles['checkout-item-total']}>
                                                    <h4>{safeFormatPrice((parseFloat(item.displayPrice || item.price) * item.quantity))}</h4>
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
                        <div className={styles['checkout-section-header']}>
                            <h2>Payment Method</h2>
                        </div>
                        <div className={styles['payment-methods']}>
                            {enabledPaymentMethods.cash_on_delivery && (
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
                            )}
                            
                            {enabledPaymentMethods.bank_transfer && (
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
                            )}
                            
                            {enabledPaymentMethods.paypal && (
                                <label className={styles['payment-option']}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="paypal"
                                        checked={paymentMethod === 'paypal'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className={styles['payment-content']}>
                                        <div className={styles['payment-title']}>PayPal</div>
                                        <div className={styles['payment-description']}>Pay securely with PayPal</div>
                                    </div>
                                </label>
                            )}

                            {enabledPaymentMethods.credit_card && (
                                <label className={styles['payment-option']}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="credit_card"
                                        checked={paymentMethod === 'credit_card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className={styles['payment-content']}>
                                        <div className={styles['payment-title']}>Credit Card</div>
                                        <div className={styles['payment-description']}>Pay using credit or debit card</div>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles['checkout-section']}>
                        <div className={styles['checkout-section-header']}>
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

                    <div className={styles['summary']}>
                        <h2>Order Summary</h2>
                        <div className={styles['summary-wrapper']}>
                            <span>
                                <div className={styles['summary-item']}>
                                    <h3>Subtotal ({checkoutItems.length} items)</h3>
                                    <h3>{safeFormatPrice(subtotal)}</h3>
                                </div>
                                <div className={styles['summary-item']}>
                                    <h3>Shipping Fee</h3>
                                    <h3>Free</h3>
                                </div>
                            </span>
                            <div className={styles['divider']}></div>
                            <div className={styles['summary-item-total']}>
                                <h3>Total</h3>
                                <h3>{safeFormatPrice(total)}</h3>
                            </div>
                        </div>
                        
                        {paymentMethod === 'paypal' && enabledPaymentMethods.paypal ? (
                            renderPayPalButtons()
                        ) : (
                            <Button
                                type="primary"
                                label={isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                                disabled={isPlacingOrder || loading || !selectedShippingAddress}
                                action={handlePlaceOrder}
                                externalStyles={styles['place-order-button']}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal 
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                title={`Select ${currentAddressType === 'shipping' ? 'Shipping' : 'Billing'} Address`}
            >
                <div className={styles['modal-content']}>
                    {addressBook?.addresses && addressBook.addresses.length > 0 ? (
                        <div className={styles['address-list']}>
                            {addressBook.addresses.map((address) => (
                                <div 
                                    key={address.id} 
                                    className={styles['address-option']}
                                    onClick={() => handleSelectAddress(address)}
                                >
                                    <div className={styles['address-item-content']}>
                                        <div className={styles['address-main']}>
                                            <span className={styles['address-name']}>
                                                <strong>{address.full_name}</strong>
                                            </span>
                                            <span className={styles['address-phone']}>
                                                {address.phone_number && (
                                                    <>
                                                        {"|"}
                                                        <span>(+63) {address.phone_number}</span>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className={styles['address-details']}>
                                            <div>
                                                {address.street_address}
                                                <br />
                                                {address.barangay}, {address.city}, {address.province}, {address.postal_code}
                                            </div>
                                        </div>
                                        <div className={styles['address-tags']}>
                                            {addressBook?.defaults?.default_billing_address === address.id && (
                                                <span className={styles['address-tag']}>Default Billing</span>
                                            )}
                                            {addressBook?.defaults?.default_shipping_address === address.id && (
                                                <span className={styles['address-tag']}>Default Shipping</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles['no-addresses']}>
                            No saved addresses found.
                        </div>
                    )}

                    <div className={styles['modal-actions']}>
                        <Button
                            type="secondary"
                            label="Add New Address"
                            icon="fa-solid fa-plus"
                            iconPosition="left"
                            action={() => {
                                setShowAddressModal(false);
                                resetNewAddressForm();
                                setShowNewAddressModal(true);
                            }}
                        />
                    </div>
                </div>
            </Modal>
                        
            <Modal 
                isOpen={showNewAddressModal}
                onClose={() => setShowNewAddressModal(false)}
                title="Add New Address"
            >
                <div className={styles['modal-content']}>
                    
                    <div className={styles['notice']}>
                        <i className='fa-solid fa-triangle-exclamation'></i>
                        <p>Setting this address as your default billing or shipping will replace your current default. Only one address can be set as default for each.</p>
                    </div>

                    <div className={styles['inputs-container']}>

                        <div className={styles['input-wrapper-horizontal']}>
                            <div className={styles['input-wrapper']}>
                                <label>Full name</label>
                                <InputField
                                    name="full_name"
                                    hint="Your full name..."
                                    value={newAddressForm.full_name}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>

                            <div className={styles['input-wrapper']} style={{ width: '24rem' }}>
                                <label>Phone number</label>
                                <InputField
                                    name="phone_number"
                                    hint="Your phone number..."
                                    value={newAddressForm.phone_number}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className={styles['input-wrapper-horizontal']}>
                            <div className={styles['input-wrapper']}>
                                <label>Province</label>
                                <InputField
                                    name="province"
                                    hint="Your province..."
                                    value={newAddressForm.province}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>

                            <div className={styles['input-wrapper']}>
                                <label>City</label>
                                <InputField
                                    name="city"
                                    hint="Your city..."
                                    value={newAddressForm.city}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>

                            <div className={styles['input-wrapper']}>
                                <label>Barangay</label>
                                <InputField
                                    name="barangay"
                                    hint="Your barangay..."
                                    value={newAddressForm.barangay}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className={styles['input-wrapper-horizontal']}>
                            <div className={styles['input-wrapper']}>
                                <label>Street address</label>
                                <InputField
                                    name="street_address"
                                    hint="Your street address..."
                                    value={newAddressForm.street_address}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>

                            <div className={styles['input-wrapper']} style={{ width: '8rem' }}>
                                <label>Postal code</label>
                                <InputField
                                    name="postal_code"
                                    hint=" "
                                    value={newAddressForm.postal_code}
                                    onChange={handleNewAddressFormChange}
                                    isSubmittable={false}
                                    type="text"
                                />
                            </div>
                        </div>

                        <label className={styles['checkbox-container']}>
                            <input
                                type="checkbox"
                                name="is_default_billing"
                                checked={newAddressForm.is_default_billing}
                                onChange={handleNewAddressFormChange}
                                className={styles['checkbox']}
                            />
                            <span className={styles['checkmark']}></span>
                            Set as default billing address
                        </label>

                        <label className={styles['checkbox-container']}>
                            <input
                                type="checkbox"
                                name="is_default_shipping"
                                checked={newAddressForm.is_default_shipping}
                                onChange={handleNewAddressFormChange}
                                className={styles['checkbox']}
                            />
                            <span className={styles['checkmark']}></span>
                            Set as default shipping address
                        </label>
                        
                    </div>
                    
                    <div className={styles['modal-ctas']}>
                        <Button 
                            type="secondary" 
                            label="Cancel" 
                            action={() => {
                                setShowNewAddressModal(false);
                                resetNewAddressForm();
                            }} 
                        />
                        <Button 
                            type="primary" 
                            label="Add new address" 
                            action={handleCreateNewAddress}
                            disabled={
                                !newAddressForm.full_name ||
                                !newAddressForm.province ||
                                !newAddressForm.city ||
                                !newAddressForm.barangay ||
                                !newAddressForm.street_address ||
                                !newAddressForm.phone_number ||
                                !newAddressForm.postal_code
                            }
                        />
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Checkout;
