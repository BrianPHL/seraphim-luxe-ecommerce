import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@contexts';
import InboxContext from './context';

export const InboxProvider = ({ children }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getUserId = () => user?.account_id || user?.id;

  const fetchActivities = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox/${uid}`);
      const json = await res.json();
      const rows = Array.isArray(json) ? json : (json.data || json.rows || []);
      // normalize read to boolean and ensure id is number
      const normalized = rows.map(r => ({
        ...r,
        id: typeof r.id === 'string' ? parseInt(r.id, 10) : r.id,
        read: Boolean(r.read) || r.read === 1 || r.read === '1'
      }));
      setActivities(normalized);
    } catch (err) {
      console.error('[INBOX] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const toggleInbox = () => setIsOpen(v => !v);
  const closeInbox = () => setIsOpen(false);

  const markAsRead = async (activityId) => {
    const uid = getUserId();
    if (!uid) return;
    await fetch(`/api/inbox/${uid}/activities/${activityId}/read`, { method: 'PUT' });
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, read: 1 } : a));
  };

  const markAllAsRead = async () => {
    const uid = getUserId();
    if (!uid) return;
    await fetch(`/api/inbox/${uid}/mark-all-read`, { method: 'PUT' });
    setActivities(prev => prev.map(a => ({ ...a, read: 1 })));
  };

  const deleteActivity = async (activityId) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`/api/inbox/${userId}/activities/${activityId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(data.error || 'Failed to delete activity');
      }
      // remove from local state so unreadCount recalculates
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err) {
      console.error('Error deleting inbox activity:', err);
    }
  };

  const clearInbox = async () => {
    const userId = getUserId();
    if (!userId) return;
    const ids = (activities || []).map(a => a.id);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/inbox/${userId}/activities/${id}`, { method: 'DELETE' })
      ));
      setActivities([]);
    } catch (err) {
      console.error('Error clearing inbox:', err);
      // fallback: optimistic clear locally
      setActivities([]);
    }
  };

  // compute unreadCount
  const unreadCount = useMemo(() => (activities || []).filter(a => !a.read).length, [activities]);

  return (
    <InboxContext.Provider value={{
      activities,
      isOpen,
      loading,
      toggleInbox,
      closeInbox,
      markAsRead,
      markAllAsRead,
      deleteActivity,
      clearInbox,
      refreshActivities: fetchActivities,
      unreadCount
    }}>
      {children}
    </InboxContext.Provider>
  );
};

export const useInbox = () => useContext(InboxContext);
