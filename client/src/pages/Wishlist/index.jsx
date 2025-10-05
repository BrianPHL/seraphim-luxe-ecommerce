import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Anchor, ReturnButton, Modal, Banner } from '@components';
import styles from './Wishlist.module.css';
import { useWishlist, useCart, useToast } from '@contexts';

const Wishlist = () => {
    const { 
        wishlistItems, 
        selectedWishlistItems, 
        removeFromWishlist, 
        clearWishlist,
        toggleItemSelection,
        selectAllItems,
        clearSelectedItems,
        isItemSelected
    } = useWishlist();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [modalType, setModalType] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const navigate = useNavigate();

    const handleItemSelect = (productId) => {
        toggleItemSelection(productId);
    };

    const handleSelectAll = () => {
        if (selectedWishlistItems.length === wishlistItems.length) {
            clearSelectedItems();
        } else {
            selectAllItems();
        }
    };

    const handleBatchRemove = () => {
        if (selectedWishlistItems.length === 0) {
            showToast('No items selected to remove.', 'error');
            return;
        }
        setModalType('batch-remove-confirmation');
        setModalOpen(true);
    };

    const handleAddToCart = async (item) => {
        try {
            await addToCart({ 
                product_id: item.product_id,
                category: item.category, 
                subcategory: item.subcategory, 
                image_url: item.image_url, 
                label: item.label, 
                price: item.price,
                quantity: 1
            });
            showToast(`${item.label} added to cart!`, 'success');
        } catch (error) {
            showToast('Failed to add item to cart.', 'error');
        }
    };

    const handleBatchAddToCart = async () => {
        if (selectedWishlistItems.length === 0) {
            showToast('No items selected to add to cart.', 'error');
            return;
        }

        try {
            let successCount = 0;
            let failCount = 0;

            for (const item of selectedWishlistItems) {
                try {
                    await addToCart({ 
                        product_id: item.product_id,
                        category: item.category, 
                        subcategory: item.subcategory, 
                        image_url: item.image_url, 
                        label: item.label, 
                        price: item.price,
                        quantity: 1
                    });
                    successCount++;
                } catch (error) {
                    failCount++;
                }
            }

            if (successCount > 0) {
                showToast(`${successCount} item(s) added to cart!`, 'success');
            }
            if (failCount > 0) {
                showToast(`${failCount} item(s) could not be added.`, 'warning');
            }
        } catch (error) {
            showToast('Failed to add items to cart.', 'error');
        }
    };

    const handleMoveToCart = async (item) => {
        try {
            await handleAddToCart(item);
            removeFromWishlist(item.product_id);
            showToast(`${item.label} moved to cart!`, 'success');
        } catch (error) {
            showToast('Failed to move item to cart.', 'error');
        }
    };

    return (
        <>
            <div className={styles['wrapper']}>
                <Banner
                    type="header"
                    page="wishlist"
                    imageURL="" // TODO: Add banner image later.
                />
                <div className={styles['header']}>
                    <ReturnButton />
                    <h1>Your Wishlist</h1>
                </div>
                <div className={styles['container']}>
                    {wishlistItems.length === 0 ? (
                        <div className={styles['empty']}>
                            <div className={styles['empty-content']}>
                                <i className="fa-solid fa-heart"></i>
                                <h3>Your wishlist is empty!</h3>
                                <p>Start browsing for items in <Anchor label="Our Collections" link="/collections" isNested={false}/>.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles['wishlist']}>
                                <div className={styles['selection-controls']}>
                                    <div className={styles['select-all']}>
                                        <label className={styles['checkbox-container']}>
                                            <input
                                                type="checkbox"
                                                checked={wishlistItems.length > 0 && selectedWishlistItems.length === wishlistItems.length}
                                                onChange={handleSelectAll}
                                                className={styles['checkbox']}
                                            />
                                            <span className={styles['checkmark']}></span>
                                            <b>Select All ({wishlistItems.length} items)</b>
                                        </label>
                                    </div>
                                    <div className={styles['batch-actions']}>
                                        <Button
                                            type='primary'
                                            label={selectedWishlistItems.length <= 1 ? 'Add to Cart' : `Add Selected to Cart (${selectedWishlistItems.length})`}
                                            icon='fa-solid fa-cart-plus'
                                            iconPosition='left'
                                            action={handleBatchAddToCart}
                                            disabled={selectedWishlistItems.length <= 0}
                                        />
                                        <Button
                                            type='secondary'
                                            label={selectedWishlistItems.length <= 1 ? 'Remove Selected' : `Remove Selected (${selectedWishlistItems.length})`}
                                            icon='fa-solid fa-trash-can'
                                            iconPosition='left'
                                            action={handleBatchRemove}
                                            disabled={selectedWishlistItems.length <= 0}
                                        />
                                    </div>
                                </div>

                                {wishlistItems.map(item => {
                                    const itemSelected = isItemSelected(item.product_id);
                                    
                                    return (
                                        <div className={`${styles['wishlist-item']} ${itemSelected ? styles['wishlist-item-selected'] : ''}`} key={item.product_id}>
                                            <div className={styles['wishlist-item-checkbox']}>
                                                <label className={styles['checkbox-container']}>
                                                    <input
                                                        type="checkbox"
                                                        checked={itemSelected}
                                                        onChange={() => handleItemSelect(item.product_id)}
                                                        className={styles['checkbox']}
                                                    />
                                                    <span className={styles['checkmark']}></span>
                                                </label>
                                            </div>
                                            <div className={styles['wishlist-item-content']}>
                                                <div className={styles['wishlist-item-image']}>
                                                    <img
                                                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${item.image_url}`}
                                                        alt={`${item.label}. Price: ${item.price}`}
                                                    />
                                                </div>
                                                <div className={styles['wishlist-item-details']}>
                                                    <div className={styles['wishlist-item-details-left']}>
                                                        <div className={styles['item-info']}>
                                                            <h3>{item.label}</h3>
                                                            <h4>₱{parseFloat(item.price).toLocaleString('en-PH', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}</h4>
                                                            <p className={ styles['item-info-stock_qty'] }>{item.stock_quantity || 0} { item.stock_quantity === 1 ? 'item' : 'items' } in stock</p>
                                                        </div>
                                                        <h4><b>Category:</b> {item.category} | <b>Sub-category:</b> {item.subcategory}</h4>
                                                    </div>
                                                    <div className={styles['wishlist-item-details-right']}>
                                                        <div className={styles['wishlist-item-actions']}>
                                                            <Button
                                                                type='primary'
                                                                label='Add to Cart'
                                                                icon='fa-solid fa-cart-plus'
                                                                iconPosition='left'
                                                                action={() => handleAddToCart(item)}
                                                            />
                                                            <Button
                                                                type='secondary'
                                                                label='Move to Cart'
                                                                icon='fa-solid fa-arrow-right'
                                                                iconPosition='right'
                                                                action={() => handleMoveToCart(item)}
                                                            />
                                                        </div>
                                                        <div className={styles['wishlist-item-controls']}>
                                                            <Button
                                                                type='icon-outlined'
                                                                icon='fa-solid fa-heart-crack'
                                                                externalStyles={styles['wishlist-item-remove']}
                                                                action={() => {
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
                                                                    : navigate(`/collections/${item.product_id}`);
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

                            <div className={styles['summary']}>
                                <h2>Wishlist Summary</h2>
                                <div className={styles['summary-wrapper']}>
                                    <div className={styles['summary-stats']}>
                                        <div className={styles['summary-item']}>
                                            <i className="fa-solid fa-heart"></i>
                                            <div>
                                                <h3>Total Items</h3>
                                                <h4>{wishlistItems.length}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles['divider']}></div>
                                    <div className={styles['summary-total']}>
                                        <h3>Total Value</h3>
                                        <h3>₱{wishlistItems.reduce((sum, item) => sum + parseFloat(item.price), 0).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</h3>
                                    </div>
                                </div>
                                <div className={styles['cta']}>
                                    <Button
                                        type='primary'
                                        label='Add All to Cart'
                                        icon='fa-solid fa-cart-plus'
                                        action={() => {
                                            selectAllItems();
                                            handleBatchAddToCart();
                                        }}
                                        disabled={wishlistItems.length <= 0}
                                    />
                                    <Button
                                        type='secondary'
                                        label='Clear Wishlist'
                                        icon='fa-solid fa-trash-can'
                                        action={() => {
                                            setModalType('clear-confirmation');
                                            setModalOpen(true);
                                        }}
                                        disabled={wishlistItems.length <= 0}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {modalType === 'remove-confirmation' && (
                <Modal label='Remove from Wishlist' isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                    <p className={styles['modal-info']}>Are you sure you want to remove <strong>{selectedItem?.label}</strong> from your wishlist?</p>
                    <div className={styles['modal-ctas']}>
                        <Button
                            label='Remove'
                            type='primary'
                            action={() => {
                                try {
                                    removeFromWishlist(selectedItem.product_id);
                                    showToast('Item removed from wishlist.', 'success');
                                } catch (err) {
                                    showToast('Failed to remove item from wishlist.', 'error');
                                }
                                setModalOpen(false);
                            }}
                            externalStyles={styles['modal-warn']}
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={() => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            )}

            {modalType === 'clear-confirmation' && (
                <Modal label='Clear Wishlist' isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                    <p className={styles['modal-info']}>Are you sure you want to clear your entire wishlist?</p>
                    <div className={styles['modal-ctas']}>
                        <Button
                            label='Clear All'
                            type='primary'
                            action={() => {
                                try {
                                    clearWishlist();
                                    showToast('Wishlist cleared successfully.', 'success');
                                } catch (err) {
                                    showToast('Failed to clear wishlist.', 'error');
                                }
                                setModalOpen(false);
                            }}
                            externalStyles={styles['modal-warn']}
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={() => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            )}

            {modalType === 'batch-remove-confirmation' && (
                <Modal label='Remove Selected Items' isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                    <p className={styles['modal-info']}>Are you sure you want to remove <strong>{selectedWishlistItems.length} selected item(s)</strong> from your wishlist?</p>
                    <div className={styles['modal-ctas']}>
                        <Button
                            label='Remove Selected'
                            type='primary'
                            action={() => {
                                try {
                                    selectedWishlistItems.forEach(item => removeFromWishlist(item.product_id));
                                    showToast('Selected items removed from wishlist.', 'success');
                                } catch (err) {
                                    showToast('Failed to remove selected items.', 'error');
                                }
                                setModalOpen(false);
                            }}
                            externalStyles={styles['modal-warn']}
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={() => {
                                setModalType('');
                                setModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            )}
        </>
    );
};

export default Wishlist;