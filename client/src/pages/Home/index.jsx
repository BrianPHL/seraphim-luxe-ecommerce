import { useEffect, useState } from 'react';
import { Button, ProductCard, Carousel } from '@components';
import styles from './Home.module.css';
import { useNavigate } from 'react-router';
import { useProducts, useCategories, useCMS } from '@contexts';

const Home = () => {
    const navigate = useNavigate();
    const { products, loading } = useProducts();
    const { getActiveCategories, getActiveSubcategories } = useCategories();
    const { pages, loading: cmsLoading } = useCMS();
    const [ featuredProducts, setFeaturedProducts ] = useState([]);
    const [ bestSellers, setBestSellers ] = useState([]);
    const [ newArrivals, setNewArrivals ] = useState([]);

    // Parse CMS content locally
    const parseHomeContent = (homeContent) => {
        if (!homeContent) return {};
        
        const lines = homeContent.split('\n');
        const parsed = {};
        
        lines.forEach(line => {
            if (line.trim() && line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (key && value) {
                    parsed[key] = value;
                }
            }
        });

        return parsed;
    };

    // Get CMS text with fallback
    const getCMSText = (key, fallback) => {
        const homeContent = parseHomeContent(pages?.home || '');
        const result = homeContent[key] || fallback;
        return result;
    };

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

    const renderProductSection = (titleKey, descKey, products, viewAllLink, viewAllLabel = "View All") => (
        <div className={styles['product-section']}>
            <div className={styles['section-header']}>
                <div className={styles['section-header-info']}>
                    <h2>{getCMSText(titleKey, titleKey.replace('_', ' '))}</h2>
                    <div className={styles['highlight-divider']}></div>
                    <h3>{getCMSText(descKey, 'Product description')}</h3>
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
                        <p>No products available at the moment.</p>
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
                {/* Hero sections remain unchanged as requested */}
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
                                    label='Browse our Collections'
                                    action={() => navigate('/collections')}
                                />
                                <h5>or</h5>
                                <Button
                                    id='hero-browse-inventory-1'
                                    type='secondary'
                                    label='Browse by Category'
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
                                    label='Browse our Collections'
                                    action={() => navigate('/collections')}
                                />
                                <h5>or</h5>
                                <Button
                                    id='hero-browse-inventory-2'
                                    type='secondary'
                                    label='Browse by Category'
                                    options={getCategoryOptions()}
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

            {/* CMS-enabled Product Sections */}
            {renderProductSection(
                "FEATURED_TITLE",
                "FEATURED_DESC", 
                featuredProducts,
                "/collections?featured=true",
                "View All Featured"
            )}

            {renderProductSection(
                "BESTSELLERS_TITLE",
                "BESTSELLERS_DESC",
                bestSellers,
                "/collections?sort=best-sellers",
                "View All Best Sellers"
            )}

            {renderProductSection(
                "NEWARRIVALS_TITLE",
                "NEWARRIVALS_DESC",
                newArrivals,
                "/collections?sort=newest",
                "View All New Arrivals"
            )}

            {/* CMS-enabled Trust Section */}
            <div className={styles['trust']}>
                <div className={styles['trust-header']}>
                    <h2>{getCMSText('TRUST_TITLE', 'Why Style Enthusiasts Trust Seraphim Luxe')}</h2>
                    <div className={styles['highlight-divider']}></div>
                    <p>{getCMSText('TRUST_DESC', 'At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality.')}</p>
                </div>
                <div className={styles['trust-container']}>
                    <div className={styles['trust-container-card']}>
                        <i className={getCMSText('TRUST_CARD1_ICON', 'fa-solid fa-truck')}></i>
                        <h3>{getCMSText('TRUST_CARD1_TITLE', 'Fast Delivery')}</h3>
                        <p>{getCMSText('TRUST_CARD1_DESC', 'Get your accessories delivered quickly and securely anywhere in the Philippines.')}</p>
                    </div>
                    <div className={styles['trust-container-card']}>
                        <i className={getCMSText('TRUST_CARD2_ICON', 'fa-solid fa-star')}></i>
                        <h3>{getCMSText('TRUST_CARD2_TITLE', 'Quality Guaranteed')}</h3>
                        <p>{getCMSText('TRUST_CARD2_DESC', 'Every piece is carefully selected and quality-tested for durability and style.')}</p>
                    </div>
                    <div className={styles['trust-container-card']}>
                        <i className={getCMSText('TRUST_CARD3_ICON', 'fa-solid fa-headset')}></i>
                        <h3>{getCMSText('TRUST_CARD3_TITLE', 'Expert Support')}</h3>
                        <p>{getCMSText('TRUST_CARD3_DESC', 'Our team is ready to help you find the perfect pieces for your unique style.')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
