import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, Anchor, ReturnButton, Modal, Counter } from '@components';
import styles from './Cart.module.css';
import { useCart, useToast } from '@contexts';

const Cart = () => {

    const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
    const { showToast } = useToast();
    const [ modalType, setModalType ] = useState('');
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ selectedItem, setSelectedItem ] = useState(null);
    const [ selectedItems, setSelectedItems ] = useState(new Set());
    const [ stockInfo, setStockInfo ] = useState({});
    const navigate = useNavigate();

    const subtotal = cartItems.reduce(
        (sum, item) => {
            const priceValue = parseFloat(item.price);
            return sum + (priceValue * item.quantity);
        }, 0);

    const selectedSubtotal = cartItems
        .filter(item => selectedItems.has(item.product_id))
        .reduce((sum, item) => {
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

    useEffect(() => {

        setSelectedItems(prev => {

            const newSelected = new Set();

            prev.forEach(productId => {
                if (cartItems.some(item => item.product_id === productId))
                    newSelected.add(productId);
            });
            return newSelected;

        });

    }, [ cartItems ])

    const handleItemSelect = (productId, isSelected) => {

        const newSelectedItems = new Set(selectedItems);

        if (isSelected) {
            newSelectedItems.add(productId);
        } else {
            newSelectedItems.delete(productId);
        }
        setSelectedItems(newSelectedItems);

    };

    const handleSelectAll = () => {

        if (selectedItems.size === cartItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(cartItems.map(item => item.product_id)));
        }

    };

    const handleBatchRemove = () => {
        
        if (selectedItems.size === 0)
            return;

        setModalType('batch-remove-confirmation');
        setModalOpen(true);

    };

    const handleCheckout = () => {
        // TODO: Implement checkout functionality
        showToast('Checkout functionality coming soon!', 'info');
    };

    const handleSelectedCheckout = () => {
        if (selectedItems.size === 0) return;
        // TODO: Implement selected items checkout functionality
        showToast(`Checkout for ${selectedItems.size} selected items coming soon!`, 'info');
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
                                                checked={cartItems.length > 0 && selectedItems.size === cartItems.length}
                                                onChange={handleSelectAll}
                                                className={ styles['checkbox'] }
                                            />
                                            <span className={ styles['checkmark'] }></span>
                                            <b>Select All ({cartItems.length + ` items`})</b>
                                        </label>
                                    </div>
                                    {selectedItems.size > 0 && (
                                        <div className={ styles['batch-actions'] }>

                                        </div>
                                    )}
                                    <Button
                                        type='secondary'
                                        label={ selectedItems.size <= 1 ? 'Remove Selected' : `Remove Selected (${ selectedItems.size })` }
                                        icon='fa-solid fa-trash-can'
                                        iconPosition='left'
                                        action={ handleBatchRemove }
                                        externalStyles={ styles['batch-remove'] }
                                        disabled={ selectedItems.size <= 0 }
                                    />
                                </div>
                                { cartItems.map(item => {

                                    const availableStock = stockInfo[item.product_id];
                                    const isSelected = selectedItems.has(item.product_id);
                                    
                                    return (
                                        <div className={ `${styles['cart-item']} ${isSelected ? styles['cart-item-selected'] : ''}` } key={ item['product_id'] }>
                                            <div className={ styles['cart-item-checkbox'] }>
                                                <label className={ styles['checkbox-container'] }>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
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
                                <h2>Summary</h2>
                                <div className={ styles['summary-wrapper'] }>
                                    <div className={ styles['summary-item'] }>
                                        <h3>{ selectedItems.size <= 1 ? 'Subtotal' : `Subtotal (${ selectedItems.size } items)` }</h3>
                                        <h3>₱ { selectedSubtotal.toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) }</h3>
                                    </div>
                                    <div className={ styles['summary-item'] }>
                                        <h3>Shipping Fee</h3>
                                        <h3>₱0.00</h3>
                                    </div>
                                    <div className={ styles['divider'] }></div>
                                    <div className={ styles['summary-item'] }>
                                        <h3>Total</h3>
                                        <h3>₱{(selectedItems.size > 0 ? selectedTotal : total).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</h3>
                                    </div>
                                </div>
                                <div className={ styles['cta'] }>
                                    <Button
                                        type='primary'
                                        label={selectedItems.size > 0 ? `Checkout Selected (${selectedItems.size})` : 'Checkout Selected'}
                                        icon='fa-solid fa-credit-card'
                                        action={ handleSelectedCheckout }
                                        disabled={ selectedItems.size <= 0 }
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
                    <p className={ styles['modal-info'] }>Are you sure you want to remove <strong>{selectedItems.size} selected item(s)</strong> from your cart?</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                selectedItems.forEach(productId => removeFromCart(productId));
                                setSelectedItems(new Set());
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