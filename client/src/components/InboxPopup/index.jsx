import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useInbox } from '@contexts';
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
        onClick={(e) => e.stopPropagation()} // prevent bubbling to any parent handlers
      >
        <div className={styles.header}>
          <h3>Activity Inbox ({activities.length})</h3>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.markAllBtn}
              onClick={(e) => { e.stopPropagation(); if (unreadCount > 0) markAllAsRead(); }}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>

            <button
              type="button"
              className={styles.clearBtn}
              onClick={(e) => { e.stopPropagation(); if (!activities.length) return; if (window.confirm('Clear all inbox items?')) clearInbox(); }}
            >
              Clear inbox
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={(e) => { e.stopPropagation(); closeInbox(); }}
              aria-label="Close inbox"
            >
              ×
            </button>
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
                      <button
                        type="button"
                        className={styles.markBtn}
                        onClick={(e) => { e.stopPropagation(); markAsRead(activity.id); }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this inbox item?')) deleteActivity(activity.id); }}
                      title="Delete"
                    >
                      🗑
                    </button>
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