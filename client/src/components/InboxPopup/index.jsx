import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useInbox } from '@contexts';
import { Button } from '@components';
import styles from './InboxPopup.module.css';

const InboxPopup = () => {
  const { isOpen, activities = [], closeInbox, markAllAsRead, markAsRead, deleteActivity, clearInbox } = useInbox();
  const popupRef = useRef(null);
  const overlayRef = useRef(null);

  const unreadCount = useMemo(() => activities.filter(a => !a.read).length, [activities]);

  // close when clicking the overlay (only if clicking outside the popup)
  const handleOverlayMouseDown = (e) => {
    if (e.target === overlayRef.current) {
      closeInbox();
    }
  };

  useEffect(() => {
    // escape key closes
    const onKey = (e) => { if (e.key === 'Escape') closeInbox(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeInbox]);

  if (!isOpen) return null;

  const content = (
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
        aria-label={`Activity Inbox (${activities.length})`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>Activity Inbox ({activities.length})</h3>
          <div className={styles.headerActions}>
            <Button
                type="secondary"
                label="Mark all as read"
                action={ () => markAllAsRead() }
                title="Mark all notifications as read"
            />

            <Button
                type="secondary"
                label="Clear"
                action={ () => clearInbox() }
                title="Clear all notifications"
            />

            <Button
                type="icon-outlined"
                icon="fa-solid fa-xmark"
                action={ () => closeInbox() }
                title="Mark notification as read"
            />

          </div>
        </div>

        <div className={styles.content}>
          {activities.length === 0 ? (
            <div className={styles.empty}>
              <i className="fa-solid fa-inbox"></i>
              <p>No activities yet</p>
            </div>
          ) : (
            <div className={styles.activities}>
              {activities.map((activity) => (
                <div key={activity.id} className={`${styles.activity} ${activity.read ? styles.read : styles.unread}`}>
                  <div className={styles.activityIcon}>
                    <i className={`fa-solid ${activity.icon || 'fa-bell'}`}></i>
                  </div>
                  <div className={styles.activityContent}>
                    <strong>{activity.title}</strong>
                    <p>{activity.message}</p>
                    {activity.timestamp && <span className={styles.timestamp}>{new Date(activity.timestamp).toLocaleString()}</span>}
                  </div>
                  <div className={styles.activityActions}>
                    {!activity.read && (
                        <Button
                            type="icon-outlined"
                            icon="fa-solid fa-envelope-circle-check"
                            action={ () => markAsRead(activity.id) }
                            title="Mark notification as read"
                        />
                    )}
                    <Button
                        type="icon-outlined"
                        icon="fa-solid fa-trash-can"
                        action={ () => deleteActivity(activity.id) }
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

  return createPortal(content, document.body);
};

export default InboxPopup;