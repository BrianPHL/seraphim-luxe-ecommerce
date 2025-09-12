import { useState } from 'react';
import { Logo, Anchor, Button, Accordion, Modal } from '@components';
import styles from "./Header.module.css";
import { useNavigate, useLocation } from 'react-router';
import { useTheme, useAuth, useCart, useWishlist } from "@contexts";

const Header = () => {

    const [ modalOpen, setModalOpen ] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location;
    const { theme, toggleTheme } = useTheme();
    const [ drawerOpen, setDrawerOpen ] = useState(false);
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const { wishlistItems } = useWishlist();
    const handleLogout = () => setModalOpen(true);

    return (
        <>
            <div className={ styles['desktop-header'] }>
                <Logo />
                <div className={ styles['right'] }>
                    <>
                    { !user || user.role === 'customer' ? (
                        <>
                            <div className={ styles['nav'] }>
                                <Anchor
                                    label="Home"
                                    link="/"
                                    isNested={ false }
                                    isActive={ pathname === '/' }
                                />
                                <Anchor
                                    label="About us"
                                    link="/about-us"
                                    isNested={ false }
                                    isActive={ pathname === '/about-us' }
                                />
                                <Anchor
                                    label="Our Collections"
                                    link="/collections"
                                    isNested={ false }
                                    isActive={ pathname === '/collections' }
                                />
                                <Anchor
                                    label="FAQs"
                                    link="/faqs"
                                    isNested={ false }
                                    isActive={ pathname === '/faqs' }
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                { user ? (
                                    <>
                                        <div 
                                            className={ styles['indicator-wrapper'] }
                                            onClick={ () => navigate('/wishlist')  }
                                        >
                                            <Button
                                                type="icon"
                                                icon='fa-solid fa-heart'
                                                action={ () => navigate('/wishlist') }
                                                externalStyles={ styles['indicator-btn'] }
                                                />
                                            { wishlistItems['length'] !== 0 ? (
                                                <span className={ styles['indicator-badge'] }>
                                                    { wishlistItems['length'] }
                                                </span>
                                            ) : null }
                                        </div>
                                        <div 
                                            className={ styles['indicator-wrapper'] }
                                            onClick={ () => navigate('/cart')  }
                                        >
                                            <Button
                                                type="icon"
                                                icon='fa-solid fa-cart-shopping'
                                                action={ () => navigate('cart') }
                                                externalStyles={ styles['indicator-btn'] }
                                                />
                                            { cartItems['length'] !== 0 ? (
                                                <span className={ styles['indicator-badge'] }>
                                                    { cartItems['length'] }
                                                </span>
                                            ) : null }
                                        </div>
                                    </>
                                ) : null }
                                <Button
                                    type="icon"
                                    action={ () => toggleTheme()  }
                                    icon={ theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun' }
                                />
                            </div>
                        </>
                    ) : user.role === 'admin' && (
                        <Button
                            type="icon"
                            action={ () => toggleTheme()  }
                            icon={ theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun' }
                        />
                    )}

                    { user ? (
                        user['role'] === 'customer' ? (
                            <Button
                                id='account-desktop-dropdown'
                                type='secondary'
                                label={` ${ user['first_name'] } (${ user['role'] }) `}
                                dropdownPosition='right'
                                options={[
                                    {
                                        label: 'Profile',
                                        action: () => { navigate('/profile') },
                                    },
                                    {
                                        label: 'Orders',
                                        action: () => { navigate('/orders') },
                                    },
                                    {
                                        label: 'Wishlist',
                                        action: () => { navigate('/wishlist') },
                                    },
                                    {
                                        label: 'Logout',
                                        action: handleLogout,
                                    },
                                ]}
                            />
                        ) : user && user['role'] === 'admin' ? (
                            <Button
                                id='account-desktop-dropdown'
                                type='secondary'
                                label={` ${ user['first_name'] } (${ user['role'] }) `}
                                dropdownPosition='right'
                                options={[
                                    {
                                        label: 'Logout',
                                        action: handleLogout,
                                    },
                                ]}
                            />
                        ) : null
                    ) : (
                        <Button
                            type='secondary'
                            label='Sign in'
                            action={ () => { navigate('/sign-in') } }
                            isActive={ pathname === '/sign-in' }
                        />
                    )}
                    </>
                </div>
            </div>
            <div className={ styles['mobile-header'] }>
                <div className={ styles['mobile-header-top'] }>
                    <div className={ styles['left'] }>
                        <Logo />
                    </div>
                    <div className={ styles['right'] }>
                    { user && user['role'] === 'customer' ? (
                        <Button
                            id='account-mobile-dropdown'
                            type='secondary'
                            label={` ${ user['first_name'] } (${ user['role'] }) `}
                            dropdownPosition='right'
                            options={[
                                {
                                    label: 'Profile',
                                    action: () => { navigate('/profile') },
                                },
                                {
                                    label: 'Orders',
                                    action: () => { navigate('/orders') },
                                },
                                {
                                    label: 'Wishlist',
                                    action: () => { navigate('/wishlist') },
                                },
                                {
                                    label: 'Logout',
                                    action: handleLogout,
                                },
                            ]}
                        />
                    ) : user && user['role'] === 'admin' ? (
                        <Button
                            id='account-mobile-dropdown-2'
                            type='secondary'
                            label={` ${ user['first_name'] } (${ user['role'] }) `}
                            dropdownPosition='right'
                            options={[
                                {
                                    label: 'Logout',
                                    action: handleLogout,
                                },
                            ]}
                        />
                    ) : (
                        <Button
                            type='secondary'
                            label='Sign in'
                            action={ () => { navigate('/sign-in') } }
                            isActive={ pathname === '/sign-in' }
                        />
                    )}
                    </div>
                </div>
                <div className={ styles['divider'] }></div>
                <div className={ styles['mobile-header-bottom'] }>
                    <div className={ styles['left'] }>
                        <Button
                            type="icon"
                            action={ () => setDrawerOpen(true) }
                            icon="fa-solid fa-bars"
                            
                        />
                    </div>
                    <div className={ styles['right'] }>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            { user && user.role === 'customer' ? (
                                <>
                                    <div 
                                        className={ styles['indicator-wrapper'] }
                                        onClick={ () => navigate('/wishlist')  }
                                    >
                                        <Button
                                            type="icon"
                                            action={ () => navigate('/wishlist')  }
                                            icon='fa-solid fa-heart'
                                            externalStyles={ styles['indicator-btn'] }
                                            />
                                        { wishlistItems['length'] !== 0 ? (
                                            <span className={ styles['indicator-badge'] }>
                                                { wishlistItems['length'] }
                                            </span>
                                        ) : null }
                                    </div>
                                    <div 
                                        className={ styles['indicator-wrapper'] }
                                        onClick={ () => navigate('/cart')  }
                                    >
                                        <Button
                                            type="icon"
                                            action={ () => navigate('/cart')  }
                                            icon='fa-solid fa-cart-shopping'
                                            externalStyles={ styles['indicator-btn'] }
                                            />
                                        { cartItems['length'] !== 0 ? (
                                            <span className={ styles['indicator-badge'] }>
                                                { cartItems['length'] }
                                            </span>
                                        ) : null }
                                    </div>
                                </>
                            ) : null }
                            <Button
                                type="icon"
                                action={ () => toggleTheme()  }
                                icon={ theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun' }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className={` ${ styles['drawer'] } ${ drawerOpen ? styles['drawer-open'] : null }`}>
                <div className={ styles['drawer-header'] }>
                <div className={ styles['drawer-header-top'] }>
                    <div className={ styles['left'] }>
                        <Logo />
                    </div>
                    <div className={ styles['right'] }>
                        { user && user['role'] === 'customer' ? (
                            <Button
                                id='account-mobile-dropdown-213'
                                type='secondary'
                                label={` ${ user['first_name'] } (${ user['role'] }) `}
                                dropdownPosition='right'
                                options={[
                                    {
                                        label: 'Profile',
                                        action: () => { navigate('/profile') },
                                    },
                                    {
                                        label: 'Orders',
                                        action: () => { navigate('/orders') },
                                    },
                                    {
                                        label: 'Wishlist',
                                        action: () => { navigate('/wishlist') },
                                    },
                                    {
                                        label: 'Logout',
                                        action: handleLogout,
                                    },
                                ]}
                            />
                        ) : user && user['role'] === 'admin' ? (
                            <Button
                                id='account-mobile-dropdown-21241'
                                type='secondary'
                                label={` ${ user['first_name'] } (${ user['role'] }) `}
                                dropdownPosition='right'
                                options={[
                                    {
                                        label: 'Logout',
                                        action: handleLogout,
                                    },
                                ]}
                            />
                        ) : (
                            <Button
                                type='secondary'
                                label='Sign in'
                                action={ () => { navigate('/sign-in') } }
                                isActive={ pathname === '/sign-in' }
                            />
                        )}
                    </div>
                </div>
                <div className={ styles['divider'] }></div>
                    <div className={ styles['drawer-header-bottom'] }>
                        <div className={ styles['left'] }>
                            <Button
                                type="icon"
                                action={ () => setDrawerOpen(false) }
                                icon="fa-solid fa-close"
                            />
                        </div>
                        <div className={ styles['right'] }>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                { user && user.role === 'customer' ? (
                                    <>
                                        <div 
                                            className={ styles['indicator-wrapper'] }
                                            onClick={ () => navigate('/wishlist')  }
                                        >
                                            <Button
                                                type="icon"
                                                action={ () => navigate('/wishlist')  }
                                                icon='fa-solid fa-heart'
                                                externalStyles={ styles['indicator-btn'] }
                                                />
                                            { wishlistItems['length'] !== 0 ? (
                                                <span className={ styles['indicator-badge'] }>
                                                    { wishlistItems['length'] }
                                                </span>
                                            ) : null }
                                        </div>
                                        <div 
                                            className={ styles['indicator-wrapper'] }
                                            onClick={ () => navigate('/cart')  }
                                        >
                                            <Button
                                                type="icon"
                                                action={ () => navigate('/cart')  }
                                                icon='fa-solid fa-cart-shopping'
                                                externalStyles={ styles['indicator-btn'] }
                                                />
                                            { cartItems['length'] !== 0 ? (
                                                <span className={ styles['indicator-badge'] }>
                                                    { cartItems['length'] }
                                                </span>
                                            ) : null }
                                        </div>
                                    </>
                                ) : null }
                                <Button
                                    type="icon"
                                    action={ () => toggleTheme()  }
                                    icon={ theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun' }
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <nav className={ styles['mobile-nav'] }>
                    {
                        !user || user.role === 'customer' ? (
                            <>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Home"
                                        link="/"
                                        isNested={ true }
                                        isActive={ pathname === '/' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="About us"
                                        link="/about-us"
                                        isNested={ true }
                                        isActive={ pathname === '/about-us' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Our Collections"
                                        link="/collections"
                                        isNested={ true }
                                        isActive={ pathname === '/collections' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Frequently Asked Questions"
                                        link="/faqs"
                                        isNested={ true }
                                        isActive={ pathname === '/faqs' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                            </>
                        ) : user && user.role === 'admin' && (
                            <>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Dashboard"
                                        link="/admin/dashboard"
                                        isNested={ true }
                                        isActive={ pathname === '/admin/dashboard' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Order Management"
                                        link="/admin/orders"
                                        isNested={ true }
                                        isActive={ pathname === '/admin/orders' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Product Management"
                                        link="/admin/products"
                                        isNested={ true }
                                        isActive={ pathname === '/admin/products' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Stock Management"
                                        link="/admin/stocks"
                                        isNested={ true }
                                        isActive={ pathname === '/admin/stocks' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Category Management"
                                        link="/admin/categories"
                                        isNested={ true }
                                        isActive={ pathname === '/admin/categories' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                                <span style={{ display: 'contents' }} onClick={ () => setDrawerOpen(false) }>
                                    <Anchor
                                        label="Content Management System"
                                        link="/admin/cms"
                                        isNested={ true }
                                        isActive={ pathname === '/admin/cms' }
                                        externalStyles={ styles['mobile-nav-anchor'] }
                                    />
                                </span>
                            </>
                        )
                    }
                </nav>
                <div className={ styles['mobile-cta'] }>
                    { user ? (
                        <div className={ styles['profile-display'] }>
                            <div className={ styles['profile-display-container'] }>
                                <img
                                    src={
                                        !user?.image_url && !user?.image
                                            ? "https://static.vecteezy.com/system/resources/thumbnails/004/511/281/small_2x/default-avatar-photo-placeholder-profile-picture-vector.jpg"
                                            : (user?.image_url?.includes('lh3.googleusercontent.com') || user?.image?.includes('lh3.googleusercontent.com'))
                                                ? user?.image || user?.image_url
                                                : `https://res.cloudinary.com/dfvy7i4uc/image/upload/${user.image_url || user.image}` 
                                    }
                                    alt={`${user?.first_name || ''} ${user?.last_name || ''}'s profile avatar`} 
                                />
                                <span>
                                    <span>
                                        <h3>{ user['first_name'] + ' ' + user['last_name'] } </h3>
                                        <h4>{ user['role'] }</h4>
                                    </span>
                                </span>
                            </div>
                            <Button
                                type='icon'
                                icon='fa-solid fa-right-from-bracket'
                                action={ () => {
                                        handleLogout()
                                        setDrawerOpen(false)
                                    }
                                }
                            />
                        </div>
                    ) : (
                        <>
                            <Button
                                label="Sign in"
                                type="primary"
                                action={() => {
                                    setDrawerOpen(false);
                                    navigate('/sign-in');
                                }}
                            />
                            <Button
                                label="Sign up"
                                type="secondary"
                                action={() => {
                                    setDrawerOpen(false);
                                    navigate('/sign-up');
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
            <Modal label='Logout Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                <p className={ styles['modal-info'] }>Are you sure you want to log out of your account?</p>
                <div className={ styles['modal-ctas'] }>
                    <Button
                        label='Confirm'
                        type='primary'
                        action={ () => {
                            setModalOpen(false);
                            logout();
                        } }
                        externalStyles={ styles['modal-warn'] }
                    />
                    <Button
                        label='Cancel'
                        type='secondary'
                        action={ () => setModalOpen(false) }
                    />
                </div>
            </Modal>
        </>
    );
};

export default Header;
