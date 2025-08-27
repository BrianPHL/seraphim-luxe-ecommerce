import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, Anchor, ReturnButton, Modal, Counter } from '@components';
import styles from './Cart.module.css';
import { useCart, useToast } from '@contexts';

const Cart = () => {

    const { 
        cartItems, 
        selectedCartItems, 
        updateQuantity, 
        removeFromCart, 
        clearCart,
        toggleItemSelection,
        selectAllItems,
        clearSelectedItems,
        isItemSelected
    } = useCart();
    const { showToast } = useToast();
    const [ modalType, setModalType ] = useState('');
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ selectedItem, setSelectedItem ] = useState(null);
    const [ stockInfo, setStockInfo ] = useState({});
    const navigate = useNavigate();

    const subtotal = cartItems.reduce(
        (sum, item) => {
            const priceValue = parseFloat(item.price);
            return sum + (priceValue * item.quantity);
        }, 0);

    const selectedSubtotal = selectedCartItems.reduce((sum, item) => {
        const priceValue = parseFloat(item.price);
        return sum + (priceValue * item.quantity);
    }, 0);

    const tax = 0;
    const deductions = 0;
    const total = subtotal + tax - deductions;
    const selectedTotal = selectedSubtotal + tax - deductions;

    useEffect(() => {
        const fetchStockInfo = async () => {

            const stockData = {};
            
            for (const item of cartItems) {
                try {
                    const response = await fetch(`/api/stocks/${item.product_id}/stock`);
                    if (response.ok) {
                        const data = await response.json();
                        stockData[item.product_id] = data.stock_quantity;
                    }
                } catch (error) {
                    console.error(`Failed to fetch stock for product ${item.product_id}:`, error);
                    stockData[item.product_id] = null;
                }
            }
            
            setStockInfo(stockData);
        };
        
        if (cartItems.length > 0) {
            fetchStockInfo();
        }
    }, [ cartItems ]);

    const handleItemSelect = (productId, isSelected) => {
        toggleItemSelection(productId);
    };

    const handleSelectAll = () => {
        if (selectedCartItems.length === cartItems.length) {
            clearSelectedItems();
        } else {
            selectAllItems();
        }
    };

    const handleBatchRemove = () => {
        if (selectedCartItems.length === 0) return;
        setModalType('batch-remove-confirmation');
        setModalOpen(true);
    };

    const handleSelectedCheckout = () => {
        if (selectedCartItems.length === 0) {
            showToast('Please select items to checkout', 'error');
            return;
        }
        navigate('/checkout');
    };

    return (
        <>
            <div className={ styles['wrapper'] }>
                <div className={ styles['banner'] }></div>
                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>Your Cart</h1>
                </div>
                <div className={ styles['container'] }>
                    { cartItems.length === 0 ? (
                        <div className={ styles['empty'] }>
                            <h3>Your cart is empty!</h3>
                            <p>Start browsing for items in <Anchor label="Jewelry" link="/jewelry" isNested={ false }/> or <Anchor label="Accessories" link="/accessories" isNested={ false }/>.</p>
                        </div>
                    ) : (
                        <>
                            <div className={ styles['cart'] }>
                                <div className={ styles['selection-controls'] }>
                                    <div className={ styles['select-all'] }>
                                        <label className={ styles['checkbox-container'] }>
                                            <input
                                                type="checkbox"
                                                checked={cartItems.length > 0 && selectedCartItems.length === cartItems.length}
                                                onChange={handleSelectAll}
                                                className={ styles['checkbox'] }
                                            />
                                            <span className={ styles['checkmark'] }></span>
                                            <b>Select All ({cartItems.length} items)</b>
                                        </label>
                                    </div>
                                    <Button
                                        type='secondary'
                                        label={ selectedCartItems.length <= 1 ? 'Remove Selected' : `Remove Selected (${selectedCartItems.length})` }
                                        icon='fa-solid fa-trash-can'
                                        iconPosition='left'
                                        action={ handleBatchRemove }
                                        externalStyles={ styles['batch-remove'] }
                                        disabled={ selectedCartItems.length <= 0 }
                                    />
                                </div>
                                { cartItems.map(item => {

                                    const availableStock = stockInfo[item.product_id];
                                    const itemSelected = isItemSelected(item.product_id);
                                    
                                    return (
                                        <div className={ `${styles['cart-item']} ${ itemSelected ? styles['cart-item-selected'] : ''}` } key={ item['product_id'] }>
                                            <div className={ styles['cart-item-checkbox'] }>
                                                <label className={ styles['checkbox-container'] }>
                                                    <input
                                                        type="checkbox"
                                                        checked={itemSelected}
                                                        onChange={(e) => handleItemSelect(item.product_id, e.target.checked)}
                                                        className={ styles['checkbox'] }
                                                    />
                                                    <span className={ styles['checkmark'] }></span>
                                                </label>
                                            </div>
                                            <div className={ styles['cart-item-content'] }>
                                                <img
                                                    src={ `https://res.cloudinary.com/dfvy7i4uc/image/upload/${ item['image_url'] }` }
                                                    alt={ `${ item['label'] }. Price: ${ item['price'] }` } 
                                                />
                                                <div className={ styles['cart-item-details'] }>
                                                    <div className={ styles['cart-item-details-left'] }>

                                                        <span>
                                                            <h3>{ item['label'] }</h3>
                                                            <h4>₱{ parseFloat(item['price']).toLocaleString('en-PH', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            }) }</h4>
                                                        </span>
                                                        
                                                        <h4><b>Category:</b> { item['category'] } | <b>Sub-category:</b> {item['subcategory']}</h4>

                                                    </div>
                                                    <div className={ styles['cart-item-details-right'] }>
                                                        <Counter
                                                            value={ item.quantity }
                                                            max={ availableStock }
                                                            onChange={ (newValue) => updateQuantity(item.product_id, newValue) }
                                                            onMinimumReached={ () => {
                                                                setSelectedItem(item);
                                                                setModalType('remove-confirmation');
                                                                setModalOpen(true);
                                                            }}
                                                        />
                                                        <div className={ styles['cart-item-details-right-ctas'] }>
                                                            
                                                            <Button
                                                                type='icon-outlined'
                                                                icon='fa-solid fa-trash-can'
                                                                externalStyles={ styles['cart-item-remove'] }
                                                                action={ () => {
                                                                    setSelectedItem(item);
                                                                    setModalType('remove-confirmation');
                                                                    setModalOpen(true);
                                                                }}
                                                            />
                                                            <Button
                                                                type='icon-outlined'
                                                                icon='fa-solid fa-square-up-right'
                                                                action={() => {
                                                                    item.category.toLowerCase() === 'jewelry' 
                                                                    ? navigate(`/jewelry/${item.product_id}`)
                                                                    : navigate(`/accessories/${item.product_id}`);
                                                                }}
                                                            />
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={ styles['summary'] }>
                                <h2>Cart Summary</h2>
                                <div className={ styles['summary-wrapper'] }>
                                    <span>
                                        <div className={ styles['summary-item'] }>
                                            <h3>{ selectedCartItems.length <= 1 ? 'Subtotal' : `Subtotal (${selectedCartItems.length} items)` }</h3>
                                            <h3>₱{ selectedSubtotal.toLocaleString('en-PH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }) }</h3>
                                        </div>
                                        <div className={ styles['summary-item'] }>
                                            <h3>Shipping Fee</h3>
                                            <h3>₱0.00</h3>
                                        </div>
                                    </span>
                                    <div className={ styles['divider'] }></div>
                                    <div className={ styles['summary-item-total'] }>
                                        <h3>Total</h3>
                                        <h3>₱{ selectedTotal.toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</h3>
                                    </div>
                                </div>
                                <div className={ styles['cta'] }>
                                    <Button
                                        type='primary'
                                        label={selectedCartItems.length > 0 ? `Checkout Selected (${selectedCartItems.length})` : 'Checkout Selected'}
                                        icon='fa-solid fa-credit-card'
                                        action={ handleSelectedCheckout }
                                        disabled={ selectedCartItems.length <= 0 }
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            { modalType === 'remove-confirmation' ? (
                <Modal label='Remove from Cart Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to remove <strong>{ selectedItem && selectedItem['label'] }</strong> from your cart?</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                removeFromCart(selectedItem['product_id']);
                                setModalOpen(false);
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'clear-confirmation' ? (
                <Modal label='Clear Cart Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to clear your cart?</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                clearCart();
                                setModalOpen(false);
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'batch-remove-confirmation' ? (
                <Modal label='Remove Selected Items' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to remove <strong>{selectedCartItems.length} selected item(s)</strong> from your cart?</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                selectedCartItems.forEach(item => removeFromCart(item.product_id));
                                setModalOpen(false);
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : null };
        </>
    );
};

export default Cart;