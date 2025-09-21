import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@contexts';
import { Button } from '@components';
import styles from './InboxPopup.module.css';

const InboxPopup = () => {
    const { isInboxOpen, notifications, setIsInboxOpen, unreadCount, readAllNotifications, readSpecificNotification, clearAllNotifications, clearSpecificNotification } = useNotifications();
    const popupRef = useRef(null);
    const overlayRef = useRef(null);

    const ICON_ACCORDING_TO_TYPE = {
        'cart': 'fa-solid fa-cart-shopping',
        'wishlist': 'fa-solid fa-heart',
        'orders': 'fa-solid fa-circle-check',
        'system': 'fa-solid fa-bell'
    };

    const handleOverlayMouseDown = (event) => {
        if (event.target === overlayRef.current) {
            setIsInboxOpen(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsInboxOpen(false);
        };
        if (isInboxOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [ isInboxOpen ]);

    if (!isInboxOpen) return null;

    const popupContent = (
        <div
            ref={overlayRef}
            className={styles.overlay}
            onMouseDown={handleOverlayMouseDown}
            role="presentation"
        >
            <div
                ref={popupRef}
                className={styles.popup}
                role="dialog"
                aria-label={`Inbox (${notifications.length})`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <h3>Inbox ({notifications.length})</h3>
                    <div className={styles.headerActions}>
                        <Button
                            type="secondary"
                            label="Mark all as read"
                            action={ readAllNotifications }
                            title="Mark all notifications as read"
                        />
                        <Button
                            type="secondary"
                            label="Clear"
                            action={ clearAllNotifications }
                            title="Clear all notifications"
                        />
                        <Button
                            type="icon-outlined"
                            icon="fa-solid fa-xmark"
                            action={ () => setIsInboxOpen(false) }
                            title="Close inbox"
                        />
                    </div>
                </div>
                <div className={styles.content}>
                    {notifications.length === 0 ? (
                        <div className={styles.empty}>
                            <i className="fa-solid fa-inbox"></i>
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className={styles.notifications}>
                            {notifications.map((notification) => (
                                <div key={notification.id} className={`${ styles.notification } ${ notification.is_read ? styles.read : styles.unread }`}>
                                    <div className={styles.notificationIcon}>
                                        <i className={ ICON_ACCORDING_TO_TYPE[ notification.type ] }></i>
                                    </div>
                                    <div className={styles.notificationContent}>
                                        <strong>{notification.title}</strong>
                                        <p>{notification.message}</p>
                                        {notification.timestamp && <span className={styles.timestamp}>{new Date(notification.timestamp).toLocaleString()}</span>}
                                    </div>
                                    <div className={styles.notificationActions}>
                                        {!notification.read && (
                                            <Button
                                                type="icon-outlined"
                                                icon="fa-solid fa-envelope-circle-check"
                                                action={() => readSpecificNotification(notification.id)}
                                                title="Mark notification as read"
                                            />
                                        )}
                                        <Button
                                            type="icon-outlined"
                                            icon="fa-solid fa-trash-can"
                                            action={() => clearSpecificNotification(notification.id)}
                                            title="Delete notification"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(popupContent, document.body);
};

export default InboxPopup;