import { useEffect, useState } from 'react';
import { Button, ProductCard, Carousel } from '@components';
import styles from './Home.module.css';
import { useNavigate } from 'react-router';
import { useProducts, useCategories } from '@contexts';

const Home = () => {

    const navigate = useNavigate();
    const { products, loading } = useProducts();
    const { getActiveCategories, getActiveSubcategories } = useCategories();
    const [ featuredProducts, setFeaturedProducts ] = useState([]);
    const [ bestSellers, setBestSellers ] = useState([]);
    const [ newArrivals, setNewArrivals ] = useState([]);

    const getCategoryNames = () => {
        const activeCategories = getActiveCategories();
        return activeCategories.map(cat => cat.name);
    };

    const getSubcategoryNames = () => {
        const activeCategories = getActiveCategories();
        const subcategoryNames = [];
        
        activeCategories.forEach(category => {
            const subcategories = getActiveSubcategories(category.id);
            subcategories.forEach(sub => {
                subcategoryNames.push({ name: sub.name, category_id: category.id, subcategory_id: sub.id });
            });
        });
        
        return subcategoryNames;
    };

    const getCategoryDisplayName = (categoryId) => {
        const activeCategories = getActiveCategories();
        const category = activeCategories.find(cat => cat.id === categoryId);
        return category?.name || 'Unknown';
    };

    const getSubcategoryDisplayName = (subcategoryId) => {
        const activeCategories = getActiveCategories();
        
        for (const category of activeCategories) {
            const subcategories = getActiveSubcategories(category.id);
            const subcategory = subcategories.find(sub => sub.id === subcategoryId);
            if (subcategory) {
                return subcategory.name;
            }
        }
        return 'Unknown';
    };

    useEffect(() => {
        if (products && products.length > 0) {
            const featured = products
                .filter(product => product.is_featured)
                .slice(0, 5);

            const sellers = products
                .filter(product => product.total_revenue > 0)
                .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
                .slice(0, 5);

            const arrivals = products
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            setFeaturedProducts(featured);
            setBestSellers(sellers);
            setNewArrivals(arrivals);
        }
    }, [ products ]);

    const getCategoryOptions = () => {
        const activeCategories = getActiveCategories();
        return activeCategories.map(category => ({
            label: category.name,
            link: `/collections?category_id=${category.id}`
        }));
    };

    const getSubcategoryOptions = () => {
        const subcategories = getSubcategoryNames();
        return subcategories.slice(0, 3).map(sub => ({
            label: sub.name,
            link: `/collections?subcategory_id=${sub.subcategory_id}`
        }));
    };

    const renderProductSection = (title, products, description, viewAllLink, viewAllLabel = "View All") => (
        <div className={styles['product-section']}>
            <div className={styles['section-header']}>
                <div className={styles['section-header-info']}>
                    <h2>{title}</h2>
                    <div className={styles['highlight-divider']}></div>
                    <h3>{description}</h3>
                </div>
                {products.length > 0 && (
                    <Button
                        type='primary'
                        label={viewAllLabel}
                        icon='fa-solid fa-long-arrow-right'
                        iconPosition='right'
                        externalStyles={styles['section-header-btn']}
                        action={() => navigate(viewAllLink)}
                    />
                )}
            </div>
            <div className={styles['products-container']}>
                {products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            category={getCategoryDisplayName(product.category_id)}
                            subcategory={getSubcategoryDisplayName(product.subcategory_id)}
                            image_url={product.image_url}
                            label={product.label}
                            price={product.price}
                            stock_quantity={product.stock_quantity}
                        />
                    ))
                ) : (
                    <div className={styles['empty-section']}>
                        <p>No {title.toLowerCase()} available at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['loading-container']}>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['wrapper']}>
            <Carousel>
                <div className={styles['hero']}>
                    <div className={styles['hero-left']}>
                        <h5>Home</h5>
                        <div className={styles['hero-left-info']}>
                            <div className={styles['hero-left-info-text']}>
                                <h2>Style Without Boundaries. Express Yourself Today!</h2>
                                <h3>Premium unisex accessories, timeless jewelry, and effortless shopping – all in one place.</h3>
                            </div>
                            <div className={styles['hero-left-info-ctas']}>
                                <Button
                                    type='primary'
                                    label='Reserve Now'
                                    action={() => navigate('/reservations')}
                                />
                                <h5>or</h5>
                                <Button
                                    id='hero-browse-inventory-1'
                                    type='secondary'
                                    label='Browse our Collections'
                                    options={getCategoryOptions()}
                                />
                            </div>
                        </div>
                        <div className={styles['hero-left-footer']}>
                            <h5>Scroll down and see what we have in store for you</h5>
                            <i className='fa-solid fa-arrow-down'></i>
                        </div>
                    </div>
                    <div className={`${styles['hero-banner']} ${styles['hero-banner-first']}`}></div>
                </div>
                <div className={styles['hero']}>
                    <div className={styles['hero-left']}>
                        <h5>Jewelry Collections</h5>
                        <div className={styles['hero-left-info']}>
                            <div className={styles['hero-left-info-text']}>
                                <h2>Discover Timeless Elegance</h2>
                                <h3>Explore our curated selection of necklaces, earrings, and bracelets for every style and occasion.</h3>
                            </div>
                            <div className={styles['hero-left-info-ctas']}>
                                <Button
                                    type='primary'
                                    label='Shop Collections'
                                    action={() => navigate('/collections')}
                                />
                                <h5>or</h5>
                                <Button
                                    id='hero-browse-inventory-2'
                                    type='secondary'
                                    label='View by Category'
                                    options={getSubcategoryOptions()}
                                />
                            </div>
                        </div>
                        <div className={styles['hero-left-footer']}>
                            <h5>Scroll down and see what we have in store for you</h5>
                            <i className='fa-solid fa-arrow-down'></i>
                        </div>
                    </div>
                    <div className={`${styles['hero-banner']} ${styles['hero-banner-second']}`}></div>
                </div>
                <div className={styles['hero']}>
                    <div className={styles['hero-left']}>
                        <h5>Customer Experience</h5>
                        <div className={styles['hero-left-info']}>
                            <div className={styles['hero-left-info-text']}>
                                <h2>Trusted By 5,000+ Style Enthusiasts Nationwide</h2>
                                <h3>Join thousands of satisfied customers who count on Seraphim Luxe for quality accessories and exceptional service.</h3>
                            </div>
                            <div className={styles['hero-left-info-ctas']}>
                                <Button
                                    type='primary'
                                    label='See Customer Stories'
                                    action={() => navigate('/about-us')}
                                />
                                <h5>or</h5>
                                <Button
                                    id='hero-browse-inventory-3'
                                    type='secondary'
                                    label='Popular Choices'
                                    options={[
                                        {
                                            label: 'Best Sellers',
                                            link: '/collections?sort=best-sellers'
                                        },
                                        {
                                            label: 'New Arrivals',
                                            link: '/collections?sort=newest'
                                        },
                                        {
                                            label: 'Featured Products',
                                            link: '/collections?sort=featured'
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                        <div className={styles['hero-left-footer']}>
                            <h5>Scroll down and see what we have in store for you</h5>
                            <i className='fa-solid fa-arrow-down'></i>
                        </div>
                    </div>
                    <div className={`${styles['hero-banner']} ${styles['hero-banner-third']}`}></div>
                </div>
            </Carousel>

            {renderProductSection(
                "Featured Products",
                featuredProducts,
                "Discover our handpicked selection of standout pieces, carefully chosen for their exceptional quality and style.",
                "/collections?featured=true",
                "View All Featured"
            )}

            {renderProductSection(
                "Best Sellers",
                bestSellers,
                "Shop our most popular items loved by customers worldwide for their quality and timeless appeal.",
                "/collections?sort=best-sellers",
                "View All Best Sellers"
            )}

            {renderProductSection(
                "New Arrivals",
                newArrivals,
                "Be the first to discover our latest additions – fresh styles and trending pieces just added to our collection.",
                "/collections?sort=newest",
                "View All New Arrivals"
            )}

            <div className={styles['trust']}>
                <div className={styles['trust-header']}>
                    <h2>Why Style Enthusiasts Trust Seraphim Luxe</h2>
                    <div className={styles['highlight-divider']}></div>
                    <p>At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality. Whether you're expressing your daily style or seeking the perfect statement piece, we've got what you need to make every look elegant and authentic.</p>
                </div>
                <div className={styles['trust-container']}>
                    <div className={styles['trust-container-card']}>
                        <i className='fa-solid fa-truck'></i>
                        <h3>Fast Delivery</h3>
                        <p>Get your accessories delivered quickly and securely anywhere in the Philippines.</p>
                    </div>
                    <div className={styles['trust-container-card']}>
                        <i className='fa-solid fa-star'></i>
                        <h3>Quality Guaranteed</h3>
                        <p>Every piece is carefully selected and quality-tested for durability and style.</p>
                    </div>
                    <div className={styles['trust-container-card']}>
                        <i className='fa-solid fa-headset'></i>
                        <h3>Expert Support</h3>
                        <p>Our team is ready to help you find the perfect pieces for your unique style.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
