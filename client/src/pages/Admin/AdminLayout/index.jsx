import { ReturnButton, Anchor } from '@components';
import { Outlet, useLocation } from 'react-router';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {

    const HEADER_TITLES = {
	    "/": "Seraphim Luxe | Style Without Boundaries",
        "/admin": "Seraphim Luxe | Admin Landing Page",
        "/admin/dashboard": "Seraphim Luxe | Admin Dashboard",
        "/admin/products": "Seraphim Luxe | Admin Products",
        "/admin/stocks": "Seraphim Luxe | Admin Stocks",
        "/admin/orders": "Seraphim Luxe | Admin Orders",
        "/admin/categories": "Seraphim Luxe | Admin Categories"
    };
    const location = useLocation();
    const pathname = location['pathname'];
    
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['header'] }>
                <ReturnButton />
                <h1>{ HEADER_TITLES[ pathname ] || HEADER_TITLES["/"] }</h1>
            </div>
            <div className={ styles['container'] }>
                <div className={ styles['nav'] }>
                    <Anchor
                        label="Dashboard"
                        link="/admin/dashboard"
                        isNested={ true }
                        isActive={ pathname === '/admin/dashboard' }
                    />
                    <Anchor
                        label="Orders"
                        link="/admin/orders"
                        isNested={ true }
                        isActive={ pathname === '/admin/orders' }
                    />
                    <Anchor
                        label="Products"
                        link="/admin/products"
                        isNested={ true }
                        isActive={ pathname === '/admin/products' }
                    />
                    <Anchor
                        label="Stocks"
                        link="/admin/stocks"
                        isNested={ true }
                        isActive={ pathname === '/admin/stocks' }
                    />
                    <Anchor
                        label="Categories"
                        link="/admin/categories"
                        isNested={ true }
                        isActive={ pathname === '/admin/categories' }
                    />
                </div>
                <div className={ styles['admin-container'] }>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
