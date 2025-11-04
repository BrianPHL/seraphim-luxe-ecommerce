import { ReturnButton, Anchor, Accordion } from '@components';
import { Outlet, useLocation } from 'react-router';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {

    const HEADER_TITLES = {
        "/admin/dashboard": "Dashboard",
        
        // System Administration
        "/admin/settings": "System Administration | Settings and Configurations",
        "/admin/audit-trail": "System Administration | Audit Trail",

        // System Management
        "/admin/accounts": "System Management | Accounts",
        "/admin/orders": "System Management | Orders",
        "/admin/products": "System Management | Products",
        "/admin/stocks": "System Management | Stocks",
        "/admin/categories": "System Management | Categories",

        // Content & Engagement
        "/admin/cms": "Content & Engagement | Content Management System",
        "/admin/live-agent-chats": "Content & Engagement | Live Agent Chats",
        "/admin/support-tickets": "Content & Engagement | Support Tickets"
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
                    <Accordion
                        label="System Administration"
                        isOpenByDefault={ true }
                    >
                        <Anchor
                            label="Settings and Configurations"
                            link="/admin/settings"
                            isNested={ true }
                            isActive={ pathname === '/admin/settings' }
                        />
                        <Anchor
                            label="Audit Trail"
                            link="/admin/audit-trail"
                            isNested={ true }
                            isActive={ pathname === '/admin/audit-trail' }
                        />
                    </Accordion>
                    <Accordion
                        label="System Management"
                        isOpenByDefault={ true }
                    >
                        <Anchor
                            label="Accounts"
                            link="/admin/accounts"
                            isNested={ true }
                            isActive={ pathname === '/admin/accounts' }
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
                    </Accordion>
                    <Accordion
                        label="Content & Engagement"
                        isOpenByDefault={ true }
                    >
                        <Anchor
                            label="Content Management System"
                            link="/admin/cms"
                            isNested={ true }
                            isActive={ pathname === '/admin/cms' }
                        />
                        <Anchor
                            label="Live Agent Chats"
                            link="/admin/live-agent-chats"
                            isNested={ true }
                            isActive={ pathname === '/admin/live-agent-chats' }
                        />
                        <Anchor
                            label="Support Tickets"
                            link="/admin/support-tickets"
                            isNested={ true }
                            isActive={ pathname === '/admin/support-tickets' }
                        />
                    </Accordion>

                </div>
                <div className={ styles['admin-container'] }>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
