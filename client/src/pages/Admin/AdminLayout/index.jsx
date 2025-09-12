import { ReturnButton, Anchor } from '@components';
import { Outlet, useLocation } from 'react-router';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {

    const HEADER_TITLES = {
        "/admin/dashboard": "Seraphim Luxe | Dashboard",
        "/admin/products": "Seraphim Luxe | Product Management",
        "/admin/stocks": "Seraphim Luxe | Stock Management",
        "/admin/orders": "Seraphim Luxe | Order Management",
        "/admin/categories": "Seraphim Luxe | Category Management",
        "/admin/cms": "Seraphim Luxe | Content Management System"
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

                    <Anchor
                        label="Content Management System"
                        link="/admin/cms"
                        isNested={ true }
                        isActive={ pathname === '/admin/cms' }
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