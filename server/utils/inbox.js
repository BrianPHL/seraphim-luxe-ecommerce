import pool from '../apis/db.js';

export const createInboxActivity = async (account_id, type, title, message, icon = 'fa-bell') => {
  const sql = `INSERT INTO inbox_activities (account_id, type, title, message, icon) VALUES (?, ?, ?, ?, ?)`;
  const params = [account_id, type, title, message, icon];
  const [result] = await pool.query(sql, params);
  return result.insertId;
};

export const createCartActivity = (account_id, productName, action = 'added') =>
  createInboxActivity(account_id, 'cart', `Cart Item ${action === 'added' ? 'Added' : 'Updated'}`, `${productName} was ${action} to your cart`, 'fa-cart-shopping');

export const createWishlistActivity = (account_id, productName, action = 'added') =>
  createInboxActivity(account_id, 'wishlist', `Wishlist Item ${action === 'added' ? 'Added' : 'Removed'}`, `${productName} was ${action} ${action === 'added' ? 'to' : 'from'} your wishlist`, 'fa-heart');

export const createOrderActivity = async (account_id, orderId, status) => {
    const title = `Order ${status}`;
    const message = `Your order #${orderId} has been ${status.toLowerCase()}`;
    return createInboxActivity(account_id, 'order', title, message, 'fa-box');
};

export const createReservationActivity = async (account_id, reservationId, status) => {
    const title = `Reservation ${status}`;
    const message = `Your reservation #${reservationId} has been ${status.toLowerCase()}`;
    return createInboxActivity(account_id, 'reservation', title, message, 'fa-calendar');
};

export const createSystemActivity = async (account_id, title, message) => {
    return createInboxActivity(account_id, 'system', title, message, 'fa-bell');
};