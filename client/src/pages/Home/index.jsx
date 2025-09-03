import { useEffect, useState } from 'react';
import { Button, ProductCard, Carousel } from '@components';
import styles from './Home.module.css';
import { useNavigate } from 'react-router';
import { useProducts, useCategories } from '@contexts';

const Home = () => {

    const navigate = useNavigate();
    const { products, loading } = useProducts();
    const { getActiveCategories, getActiveSubcategories } = useCategories();
    const [ featuredCollections, setFeaturedCollections ] = useState([]);

    // * Fisher-Yates Shuffle Algorithm
    // * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    const shuffleArray = (array) => {
                
        const shuffled = [ ...array ];
        
        for (let i = shuffled['length'] - 1; i > 0; i--) {
            const j = Math['floor'](Math['random']() * (i + 1));
            [ shuffled[i],  shuffled[j] ] = [ shuffled[j], shuffled[i] ];
        };
        return shuffled;

    }

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
        if (products && products['length'] > 0) {
            const categoryNames = getCategoryNames();
            const collections = products['filter'](product => {
                const categoryName = getCategoryDisplayName(product.category_id);
                return categoryNames.includes(categoryName);
            });
            const randomCollections = shuffleArray(collections)['slice'](0, 5);

            setFeaturedCollections(randomCollections);
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

    return (
        <div className={ styles['wrapper'] }>
            <Carousel>
                <div className={ styles['hero'] }>
                    <div className={ styles['hero-left'] }>
                        <h5>Home</h5>
                        <div className={ styles['hero-left-info'] }>
                            <div className={ styles['hero-left-info-text'] }>
                                <h2>Style Without Boundaries. Express Yourself Today!</h2>
                                <h3>Premium unisex accessories, timeless jewelry, and effortless shopping – all in one place.</h3>
                            </div>
                            <div className={ styles['hero-left-info-ctas'] }>
                                <Button
                                    type='primary'
                                    label='Reserve Now'
                                    action={ () => { navigate('/reservations') } }
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
                        <div className={ styles['hero-left-footer'] }>
                            <h5>Scroll down and see what we have in store for you</h5>
                            <i className='fa-solid fa-arrow-down'></i>
                        </div>
                    </div>
                    <div className={` ${ styles['hero-banner'] } ${ styles['hero-banner-first'] } `}></div>
                </div>
                <div className={ styles['hero'] }>
                    <div className={ styles['hero-left'] }>
                        <h5>Jewelry Collections</h5>
                        <div className={ styles['hero-left-info'] }>
                            <div className={ styles['hero-left-info-text'] }>
                                <h2>Discover Timeless Elegance</h2>
                                <h3>Explore our curated selection of necklaces, earrings, and bracelets for every style and occasion.</h3>
                            </div>
                            <div className={ styles['hero-left-info-ctas'] }>
                                <Button
                                    type='primary'
                                    label='Shop Collections'
                                    action={ () => { navigate('/collections') } }
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
                        <div className={ styles['hero-left-footer'] }>
                            <h5>Scroll down and see what we have in store for you</h5>
                            <i className='fa-solid fa-arrow-down'></i>
                        </div>
                    </div>
                    <div className={` ${ styles['hero-banner'] } ${ styles['hero-banner-second'] } `}></div>
                </div>
                <div className={ styles['hero'] }>
                    <div className={ styles['hero-left'] }>
                        <h5>Customer Experience</h5>
                        <div className={ styles['hero-left-info'] }>
                            <div className={ styles['hero-left-info-text'] }>
                                <h2>Trusted By 5,000+ Style Enthusiasts Nationwide</h2>
                                <h3>Join thousands of satisfied customers who count on Seraphim Luxe for quality accessories and exceptional service.</h3>
                            </div>
                            <div className={ styles['hero-left-info-ctas'] }>
                                <Button
                                    type='primary'
                                    label='See Customer Stories'
                                    action={ () => { navigate('/about-us') } }
                                />
                                <h5>or</h5>
                                <Button
                                    id='hero-browse-inventory-3'
                                    type='secondary'
                                    label='Popular Choices'
                                    options={[
                                        {
                                            label: 'Best Sellers',
                                            link: '/collections'
                                        },
                                        {
                                            label: 'New Arrivals',
                                            link: '/collections?sort=newest'
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                        <div className={ styles['hero-left-footer'] }>
                            <h5>Scroll down and see what we have in store for you</h5>
                            <i className='fa-solid fa-arrow-down'></i>
                        </div>
                    </div>
                    <div className={` ${ styles['hero-banner'] } ${ styles['hero-banner-third'] } `}></div>
                </div>
            </Carousel>
            <div className={ styles['collections'] }>
                <div className={ styles['collections-banner'] }></div>
                <div className={ styles['collections-header'] }>
                    <div className={ styles['collections-header-info'] }>
                        <h2>Top Picks for Style Enthusiasts</h2>
                        <div className={ styles['highlight-divider'] }></div>
                        <h3>Check out our most popular jewelry pieces, handpicked for elegance and versatility.</h3>
                    </div>
                    <Button
                        type='primary'
                        label='Browse More Collections'
                        icon='fa-solid fa-long-arrow-right'
                        iconPosition='right'
                        externalStyles={ styles['collections-header-btn'] }
                        action={ () => { navigate('/collections') } }
                    />
                </div>
                <div className={ styles['collections-container'] }>
                    { featuredCollections.length > 0 ? (
                        featuredCollections.map((collection) => (
                            <ProductCard
                                key={ collection['id'] }
                                id={ collection['id'] }
                                category={ getCategoryDisplayName(collection['category_id']) }
                                subcategory={ getSubcategoryDisplayName(collection['subcategory_id']) }
                                image_url={ collection['image_url'] }
                                label={ collection['label'] }
                                price={ collection['price'] }
                                stock_quantity={ collection['stock_quantity'] }
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>No featured collections available at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
            <div className={ styles['trust'] }>
                <div className={ styles['trust-header'] }>
                    <h2>Why Style Enthusiasts Trust Seraphim Luxe</h2>
                    <div className={ styles['highlight-divider'] }></div>
                    <p>At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality. Whether you're expressing your daily style or seeking the perfect statement piece, we've got what you need to make every look elegant and authentic.</p>
                </div>
                <div className={ styles['trust-container'] }>
                    <div className={ styles['trust-container-card'] }>
                        <i className='fa-solid fa-truck'></i>
                        <h3>Fast Delivery</h3>
                        <p>Get your accessories delivered quickly and securely anywhere in the Philippines.</p>
                    </div>
                    <div className={ styles['trust-container-card'] }>
                        <i className='fa-solid fa-star'></i>
                        <h3>Quality Guaranteed</h3>
                        <p>Every piece is carefully selected and quality-tested for durability and style.</p>
                    </div>
                    <div className={ styles['trust-container-card'] }>
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
