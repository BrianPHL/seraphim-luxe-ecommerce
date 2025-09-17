import { useEffect, useState } from 'react';
import { Button, ProductCard, Carousel } from '@components';
import styles from './Promotions.module.css';
import { useNavigate } from 'react-router';
import { useProducts, useCategories } from '@contexts';

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {

    setLoading(true);
    setTimeout(() => {
      setPromotions([
        {
          id: 1,
          title: "Summer Sale",
          description: "Get 20% off on all summer collections",
          discount: 20,
          active: true,
          startDate: "2023-06-01",
          endDate: "2023-06-30",
          code: "SUMMER20"
        },
        {
          id: 2,
          title: "Welcome Offer",
          description: "10% off for new customers",
          discount: 10,
          active: true,
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          code: "WELCOME10"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddNew = () => {
    const newPromo = {
      id: Date.now(),
      title: "",
      description: "",
      discount: 10,
      active: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      code: "PROMO" + Math.floor(Math.random() * 1000)
    };
    setPromotions([newPromo, ...promotions]);
    setEditingId(newPromo.id);
  };

  const handleChange = (id, field, value) => {
    setPromotions(promotions.map(promo => 
      promo.id === id ? { ...promo, [field]: value } : promo
    ));
  };

  const handleSave = async () => {
    try {
      setError(null);
      setLoading(true);
      

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSaved(true);
      setEditingId(null);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      setError('Failed to save promotions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setPromotions(promotions.filter(promo => promo.id !== id));
    if (editingId === id) setEditingId(null);
  };

  if (loading && promotions.length === 0) {
    return <div className={styles.loading}>Loading promotions...</div>;
  }

  return (
    <div className={styles.managementSection}>
      <div className={styles.sectionHeader}>
        <h3>Promotions Management</h3>
        <Button
          type='primary'
          label='Add New Promotion'
          action={handleAddNew}
        />
      </div>

      <div className={styles.helpSection}>
        <h4>📝 Promotion Management</h4>
        <ul>
          <li>Create discount codes for your customers</li>
          <li>Set active dates for each promotion</li>
          <li>Toggle promotions on/off with the active checkbox</li>
          <li>Save changes when finished</li>
        </ul>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.promotionsList}>
        {promotions.map((promo) => (
          <div key={promo.id} className={`${styles.promoCard} ${editingId === promo.id ? styles.editing : ''}`}>
            <div className={styles.promoHeader}>
              <h4>{promo.title || "New Promotion"}</h4>
              <div className={styles.promoActions}>
                <button 
                  className={styles.editButton}
                  onClick={() => setEditingId(editingId === promo.id ? null : promo.id)}
                >
                  {editingId === promo.id ? 'Cancel' : 'Edit'}
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDelete(promo.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === promo.id ? (
              <div className={styles.editForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={promo.title}
                      onChange={(e) => handleChange(promo.id, 'title', e.target.value)}
                      placeholder="Promotion title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      value={promo.discount}
                      onChange={(e) => handleChange(promo.id, 'discount', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={promo.startDate}
                      onChange={(e) => handleChange(promo.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Date</label>
                    <input
                      type="date"
                      value={promo.endDate}
                      onChange={(e) => handleChange(promo.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Promo Code</label>
                    <input
                      type="text"
                      value={promo.code}
                      onChange={(e) => handleChange(promo.id, 'code', e.target.value)}
                      placeholder="Promo code"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={promo.active}
                        onChange={(e) => handleChange(promo.id, 'active', e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={promo.description}
                    onChange={(e) => handleChange(promo.id, 'description', e.target.value)}
                    rows="3"
                    placeholder="Promotion description"
                  />
                </div>
              </div>
            ) : (
              <div className={styles.promoDetails}>
                <p><strong>Code:</strong> {promo.code}</p>
                <p><strong>Discount:</strong> {promo.discount}%</p>
                <p><strong>Dates:</strong> {promo.startDate} to {promo.endDate}</p>
                <p><strong>Status:</strong> {promo.active ? 'Active' : 'Inactive'}</p>
                {promo.description && <p>{promo.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.saveSection}>
        <Button
          type='primary'
          label='Save All Changes'
          action={handleSave}
          disabled={loading}
        />
        {isSaved && <span className={styles.savedMessage}>✓ Promotions saved successfully!</span>}
      </div>
    </div>
  );
};

export default Promotions;
