import { useEffect, useState } from 'react';
import { Button, ProductCard, Carousel } from '@components';
import styles from './Banners.module.css';
import { useNavigate } from 'react-router';
import { useProducts, useCategories } from '@contexts';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {

    setLoading(true);
    setTimeout(() => {
      setBanners([
        {
          id: 1,
          title: "Summer Collection",
          subtitle: "Discover our new summer arrivals",
          imageUrl: "/images/banners/summer.jpg",
          active: true,
          link: "/collection/summer",
          buttonText: "Shop Now",
          position: "home-top"
        },
        {
          id: 2,
          title: "New Arrivals",
          subtitle: "Check out our latest products",
          imageUrl: "/images/banners/new.jpg",
          active: true,
          link: "/new-arrivals",
          buttonText: "Explore",
          position: "home-middle"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddNew = () => {
    const newBanner = {
      id: Date.now(),
      title: "",
      subtitle: "",
      imageUrl: "",
      active: false,
      link: "",
      buttonText: "Learn More",
      position: "home-top"
    };
    setBanners([newBanner, ...banners]);
    setEditingId(newBanner.id);
  };

  const handleChange = (id, field, value) => {
    setBanners(banners.map(banner => 
      banner.id === id ? { ...banner, [field]: value } : banner
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
      setError('Failed to save banners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setBanners(banners.filter(banner => banner.id !== id));
    if (editingId === id) setEditingId(null);
  };

  if (loading && banners.length === 0) {
    return <div className={styles.loading}>Loading banners...</div>;
  }

  return (
    <div className={styles.managementSection}>
      <div className={styles.sectionHeader}>
        <h3>Banners Management</h3>
        <Button
          type='primary'
          label='Add New Banner'
          action={handleAddNew}
        />
      </div>

      <div className={styles.helpSection}>
        <h4>📝 Banner Management</h4>
        <ul>
          <li>Create promotional banners for your website</li>
          <li>Set titles, subtitles, and call-to-action buttons</li>
          <li>Choose where the banner will appear on your site</li>
          <li>Toggle banners on/off with the active checkbox</li>
          <li>Save changes when finished</li>
        </ul>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.bannersList}>
        {banners.map((banner) => (
          <div key={banner.id} className={`${styles.bannerCard} ${editingId === banner.id ? styles.editing : ''}`}>
            <div className={styles.bannerHeader}>
              <h4>{banner.title || "New Banner"}</h4>
              <div className={styles.bannerActions}>
                <button 
                  className={styles.editButton}
                  onClick={() => setEditingId(editingId === banner.id ? null : banner.id)}
                >
                  {editingId === banner.id ? 'Cancel' : 'Edit'}
                </button>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDelete(banner.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === banner.id ? (
              <div className={styles.editForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => handleChange(banner.id, 'title', e.target.value)}
                      placeholder="Banner title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Subtitle</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) => handleChange(banner.id, 'subtitle', e.target.value)}
                      placeholder="Banner subtitle"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Button Text</label>
                    <input
                      type="text"
                      value={banner.buttonText}
                      onChange={(e) => handleChange(banner.id, 'buttonText', e.target.value)}
                      placeholder="Button text"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Link URL</label>
                    <input
                      type="text"
                      value={banner.link}
                      onChange={(e) => handleChange(banner.id, 'link', e.target.value)}
                      placeholder="/path-to-page"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Position</label>
                    <select
                      value={banner.position}
                      onChange={(e) => handleChange(banner.id, 'position', e.target.value)}
                    >
                      <option value="home-top">Homepage Top</option>
                      <option value="home-middle">Homepage Middle</option>
                      <option value="home-bottom">Homepage Bottom</option>
                      <option value="category-top">Category Top</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={banner.active}
                        onChange={(e) => handleChange(banner.id, 'active', e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={banner.imageUrl}
                    onChange={(e) => handleChange(banner.id, 'imageUrl', e.target.value)}
                    placeholder="/images/banner.jpg"
                  />
                </div>
              </div>
            ) : (
              <div className={styles.bannerPreview}>
                <div className={styles.bannerDetails}>
                  <h4>{banner.title}</h4>
                  {banner.subtitle && <p>{banner.subtitle}</p>}
                  <div className={styles.metaInfo}>
                    <span><strong>Position:</strong> {banner.position}</span>
                    <span><strong>Status:</strong> {banner.active ? 'Active' : 'Inactive'}</span>
                    {banner.link && <span><strong>Link:</strong> {banner.link}</span>}
                    {banner.buttonText && <span><strong>Button:</strong> {banner.buttonText}</span>}
                  </div>
                </div>
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
        {isSaved && <span className={styles.savedMessage}>✓ Banners saved successfully!</span>}
      </div>
    </div>
  );
};

export default Banners;
