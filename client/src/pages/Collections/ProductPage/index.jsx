import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './ProductPage.module.css';
import { Button, ReturnButton, InputField, Modal } from '@components';
import { useProducts, useAuth, useCart, useCheckout, useToast, useCategories } from '@contexts';

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
    const [ formattedPrice, setFormattedPrice ] = useState('');
    
    const { products } = useProducts();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { setDirectCheckout } = useCheckout();
    const { showToast } = useToast();
    const { getCategoryById, getActiveSubcategories } = useCategories();
    const navigate = useNavigate();

    const getCategoryDisplayName = (categoryId) => {
        const category = getCategoryById(categoryId);
        return category?.name || 'Unknown';
    };

    const getSubcategoryDisplayName = (categoryId, subcategoryId) => {
        if (!categoryId || !subcategoryId) return 'Unknown';
        const subcategories = getActiveSubcategories(categoryId);
        const subcategory = subcategories.find(sub => sub.id === subcategoryId);
        return subcategory?.name || 'Unknown';
    };

    useEffect(() => {
        if (products && products.length > 0) {
            const foundProduct = products.find(p => p.id === parseInt(product_id));
            if (foundProduct) {
                setProduct(foundProduct);
                setFormattedPrice(parseFloat(foundProduct.price).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }));
            }
            setLoading(false);
        }
    }, [products, product_id]);

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
                category: getCategoryDisplayName(product.category_id), 
                subcategory: getSubcategoryDisplayName(product.category_id, product.subcategory_id), 
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
                category: getCategoryDisplayName(product.category_id),
                subcategory: getSubcategoryDisplayName(product.category_id, product.subcategory_id),
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

    return (
        <>
            <div className={ styles['wrapper'] }>
                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>Product Details</h1>
                </div>
                <div className={ styles['product'] }>
                    <div className={ styles['product-image'] }>
                        <img
                            src={ `https://res.cloudinary.com/dfvy7i4uc/image/upload/${ product['image_url'] }` }
                            alt={ `${ product['label'] }. Price: ${ product['price'] }` } 
                        />
                    </div>
                    <div className={ styles['product-details'] }>
                        <div className={ styles['product-details-header'] }>
                            <h2>{ product['label'] }</h2>
                            <h3 style={{ marginTop: '2rem' }}>
                                <strong>Category:</strong> { getCategoryDisplayName(product.category_id) } | <strong>Sub-category:</strong> { getSubcategoryDisplayName(product.category_id, product.subcategory_id) }
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
                                <h4><strong>Description</strong></h4>
                                <p>{ product['description'] }</p>
                            </span>
                            <span>
                                <h4><strong>Price</strong></h4>
                                <h3>₱{ formattedPrice }</h3>
                            </span>
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
                    <h3>Total: ₱{product ? (parseFloat(product['price']) * productQuantity).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) : '0.00'}</h3>
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
                    <h3>Total: ₱{product ? (parseFloat(product['price']) * productQuantity).toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) : '0.00'}</h3>
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
