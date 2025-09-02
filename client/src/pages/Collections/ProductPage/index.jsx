import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styles from './ProductPage.module.css';
import { Button, ReturnButton, InputField, Modal } from '@components';

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
    const [ isOutOfStock, setIsOutOfStock ] = useState(false);
    const [ isLowStock, setIsLowStock ] = useState(false);
    const [ reservePreferredDate, setReservePreferredDate ] = useState('');
    const [ reserveNotes, setReserveNotes ] = useState('');
    const { products } = useProducts();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (products && products['length'] > 0) {
            
            const foundProduct = products.find(product => product.id.toString() === product_id);
            if (foundProduct) {
                setProduct(foundProduct);
                setIsOutOfStock(foundProduct['stock_quantity'] <= 0);
                setIsLowStock(foundProduct['stock_quantity'] > 0 && foundProduct['stock_quantity'] <= 5);
            } else {
                showToast('Product not found!', 'error');
                navigate('/collections');
            }
            
            setLoading(false);

        }
    }, [ product_id, products, navigate, showToast ]);

    const requireAuth = (action) => {
        if (!user) {
            showToast('You must be signed in to perform this action!', 'error')
            return;
        }
        action();
    };

    const handleAddToCart = async () => {
        if (isOutOfStock) {
            showToast(`Sorry, ${product.label} is currently out of stock.`, 'error');
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
        } catch (err) {
            showToast(`Uh oh! An error occurred during the addition of ${ product['label'] } to your cart! Please try again later. ${ err }`, 'error');
            console.error("Motorcycles ProductPage handleAddToCart error: ", err);
        }
    };

        if (isOutOfStock) {
            showToast(`Sorry, ${product.label} is currently out of stock.`, 'error');
            return;
        }
        try {
        } catch (err) {
        }
    };

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
                            src={ `https://res.cloudinary.com/dfvy7i4uc/image/upload/products/${ product['image_url'] }` }
                            alt={ `${ product['label'] }. Price: ${ product['price'] }` } 
                        />
                    </div>
                    <div className={ styles['product-details'] }>
                        <div className={ styles['product-details-header'] }>
                            <h2>{ product['label'] }</h2>
                            <h3 style={{ marginTop: '2rem' }}><strong>Category:</strong> { product['category'] } | <strong>Sub-category:</strong> { product['subcategory'] }</h3>
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
                            <h3>₱{ parseFloat(product['price']).toLocaleString('en-PH', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </h3>
                        </div>
                        <div className={ styles['product-details-ctas'] }>
                            <Button
                                type='primary'
                                action={
                                    () => { 
                                        requireAuth(() => {
                                            setModalOpen(true);
                                        })
                                    } 
                                }
                            />
                            <Button
                                type='secondary'
                                icon='fa-solid fa-cart-plus'
                                iconPosition='left'
                                label='Add to Cart'
                                action={
                                    () => { 
                                        requireAuth(() => {
                                            setModalType('cart');
                                            setModalOpen(true);
                                        })
                                    } 
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>






                        />
                        />
        </>
    );
};

export default ProductPage;
