import React, { useState, useEffect } from 'react';
import styles from './CMS.module.css';
import { Button, Modal } from '@components';
import { useCMS, useBanners, usePromotions, useProducts } from '@contexts';

const CMS = () => {
  const { pages, loading, error, updatePage } = useCMS();
  const { banners, loading: bannersLoading, error: bannersError, modifySpecificBanner, removeSpecificBanner, fetchBanners } = useBanners();
  const { promotions, loading: promotionsLoading, error: promotionsError, fetchPromotions, addPromotion, modifySpecificPromotion, toggleSpecificPromotion, removeSpecificPromotion } = usePromotions();
  const { products } = useProducts();

  const [activeTab, setActiveTab] = useState('home');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Banner management states
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'modify', 'reset', 'promotion-create', 'promotion-edit', 'promotion-delete'
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bannerActionLoading, setBannerActionLoading] = useState(false);

  // Promotion management states
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [promotionFormData, setPromotionFormData] = useState({
    title: '',
    discount: '',
    start_date: '',
    end_date: '',
    is_active: true,
    product_ids: []
  });
  const [promotionActionLoading, setPromotionActionLoading] = useState(false);
  
  // Product search state
  const [productSearchQuery, setProductSearchQuery] = useState('');

  useEffect(() => {
    if (pages[activeTab]) {
      setContent(pages[activeTab]);
    }
  }, [activeTab, pages]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaveError(null);
      await updatePage(activeTab, content, getPageTitle());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      setSaveError('Failed to save content. Please try again.');
    }
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'home': return 'Home Page Sections';
      case 'about': return 'About Us Content';
      case 'contact': return 'Contact Information';
      case 'faqs': return 'Frequently Asked Questions';
      case 'privacy': return 'Privacy Policy';
      case 'banners': return 'Banner Management';
      case 'promotions': return 'Promotions Management';
      default: return 'Static Page';
    }
  };

  const formatTextForPreview = (text) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  const getEditorInstructions = () => {
    if (activeTab === 'promotions') {
      return (
        <div className={styles.editorHelp}>
          <h3>🎟️ Promotions Management</h3>
          <ul>
            <li><strong>Create:</strong> Click "Add New Promotion" to create promotional campaigns</li>
            <li><strong>Edit:</strong> Click the edit icon to modify promotion details</li>
            <li><strong>Toggle:</strong> Click the toggle icon to activate/deactivate promotions</li>
            <li><strong>Delete:</strong> Click the delete icon to remove promotions</li>
            <li><strong>Discount:</strong> Enter percentage discount (e.g., 15.50 for 15.5%)</li>
            <li><strong>Products:</strong> Select specific products for targeted promotions</li>
          </ul>
        </div>
      );
    }

    if (activeTab === 'banners') {
      return (
        <div className={styles.editorHelp}>
          <h3>🖼️ Banner Management</h3>
          <ul>
            <li><strong>View:</strong> Click the eye icon to preview banner details</li>
            <li><strong>Modify:</strong> Click the edit icon to change the banner image URL</li>
            <li><strong>Reset:</strong> Click the reset icon to restore placeholder image</li>
            <li><strong>Image URLs:</strong> Use Cloudinary URLs or valid image links</li>
          </ul>
        </div>
      );
    }
    
    if (activeTab === 'home') {
      return (
        <div className={styles.editorHelp}>
          <h3>🏠 Home Page Sections Editing</h3>
          <ul>
            <li><strong>Product Sections:</strong> FEATURED_TITLE, FEATURED_DESC, BESTSELLERS_TITLE, BESTSELLERS_DESC, NEWARRIVALS_TITLE, NEWARRIVALS_DESC</li>
            <li><strong>Trust Section:</strong> TRUST_TITLE, TRUST_DESC</li>
            <li><strong>Trust Cards:</strong> TRUST_CARD1_ICON, TRUST_CARD1_TITLE, TRUST_CARD1_DESC (same for CARD2 and CARD3)</li>
            <li><strong>Icons:</strong> Use FontAwesome classes like "fa-solid fa-truck", "fa-solid fa-star", "fa-solid fa-headset"</li>
            <li><strong>Format:</strong> KEY: Value (keep the format exactly as shown)</li>
          </ul>
        </div>
      );
    }
    
    return (
      <div className={styles.editorHelp}>
        <h3>📝 Editing Instructions</h3>
        <ul>
          <li>Edit <strong>plain text content</strong> (no HTML needed)</li>
          <li>Use empty lines to separate paragraphs</li>
          <li>Use <strong>Q:</strong> and <strong>A:</strong> for FAQ formatting</li>
          <li>Save changes when finished</li>
        </ul>
      </div>
    );
  };

  // Banner management functions
  const handleViewBanner = (banner) => {
    setSelectedBanner(banner);
    setModalType('view');
    setIsModalOpen(true);
  };

  const handleModifyBanner = (banner) => {
    setSelectedBanner(banner);
    setNewImageUrl(banner.image_url);
    setModalType('modify');
    setIsModalOpen(true);
  };

  const handleResetBanner = (banner) => {
    setSelectedBanner(banner);
    setModalType('reset');
    setIsModalOpen(true);
  };

  const confirmModifyBanner = async () => {
    if (!selectedBanner || !newImageUrl) return;
    
    const trimmedImageUrl = newImageUrl.trim();

    setBannerActionLoading(true);
    try {
      const success = await modifySpecificBanner(selectedBanner.page, trimmedImageUrl);
      if (success) {
        setIsModalOpen(false);
        setNewImageUrl('');
        setSelectedBanner(null);
      }
    } finally {
      setBannerActionLoading(false);
    }
  };

  const confirmResetBanner = async () => {
    if (!selectedBanner) return;
    
    setBannerActionLoading(true);
    try {
      const success = await removeSpecificBanner(selectedBanner.page);
      if (success) {
        setIsModalOpen(false);
        setSelectedBanner(null);
      }
    } finally {
      setBannerActionLoading(false);
    }
  };

  const getAvailableProducts = () => {
    if (!products || !promotions) return [];
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Get all product IDs that are in active promotions
    const productsInActivePromotions = new Set();
    
    promotions.forEach(promotion => {
      // Skip the promotion being edited
      if (selectedPromotion && promotion.id === selectedPromotion.id) return;
      
      // Check if promotion is active and ongoing
      if (promotion.is_active === 1 && 
          promotion.start_date <= today && 
          promotion.end_date >= today &&
          promotion.products && promotion.products.length > 0) {
        promotion.products.forEach(product => {
          productsInActivePromotions.add(product.id);
        });
      }
    });
    
    // Return products not in active promotions
    return products.filter(product => !productsInActivePromotions.has(product.id));
  };

  // Product search function
  const getFilteredProducts = () => {
    const availableProducts = getAvailableProducts();
    
    if (!productSearchQuery.trim()) {
      return availableProducts;
    }
    
    const query = productSearchQuery.toLowerCase().trim();
    
    return availableProducts.filter(product => 
      product.label.toLowerCase().includes(query) ||
      product.price.toString().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query)) ||
      (product.subcategory && product.subcategory.toLowerCase().includes(query))
    );
  };

  // Reset search when modal closes
  const resetProductSearch = () => {
    setProductSearchQuery('');
  };

  // Promotion management functions
  const handleCreatePromotion = () => {
    setPromotionFormData({
      title: '',
      discount: '',
      start_date: '',
      end_date: '',
      is_active: true,
      product_ids: []
    });
    setSelectedPromotion(null);
    resetProductSearch();
    setModalType('promotion-create');
    setIsModalOpen(true);
  };

  const handleProductSelection = (productId) => {
    setPromotionFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  const handleEditPromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setPromotionFormData({
      title: promotion.title || '',
      discount: promotion.discount || '',
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      is_active: promotion.is_active === 1,
      product_ids: promotion.products ? promotion.products.map(p => p.id) : []
    });
    resetProductSearch();
    setModalType('promotion-edit');
    setIsModalOpen(true);
  };

  const handleDeletePromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setModalType('promotion-delete');
    setIsModalOpen(true);
  };

  const handleViewPromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setModalType('promotion-view');
    setIsModalOpen(true);
  };

  const handlePromotionFormChange = (field, value) => {
    setPromotionFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const confirmCreatePromotion = async () => {
    setPromotionActionLoading(true);
    try {
      const success = await addPromotion(promotionFormData);
      if (success) {
        setIsModalOpen(false);
        setPromotionFormData({
          title: '',
          discount: '',
          start_date: '',
          end_date: '',
          is_active: true
        });
        resetProductSearch();
      }
    } finally {
      setPromotionActionLoading(false);
    }
  };

  const confirmEditPromotion = async () => {
    if (!selectedPromotion) return;
    
    setPromotionActionLoading(true);
    try {
      const success = await modifySpecificPromotion(selectedPromotion.id, promotionFormData);
      if (success) {
        setIsModalOpen(false);
        setSelectedPromotion(null);
        resetProductSearch();
      }
    } finally {
      setPromotionActionLoading(false);
    }
  };

  const confirmDeletePromotion = async () => {
    if (!selectedPromotion) return;
    
    setPromotionActionLoading(true);
    try {
      const success = await removeSpecificPromotion(selectedPromotion.id);
      if (success) {
        setIsModalOpen(false);
        setSelectedPromotion(null);
      }
    } finally {
      setPromotionActionLoading(false);
    }
  };

  const handleTogglePromotionStatus = async (promotion) => {
    const newStatus = promotion.is_active === 1 ? 0 : 1;
    await toggleSpecificPromotion(promotion.id, newStatus);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Get filtered products for display
  const filteredProducts = getFilteredProducts();

  if (loading || bannersLoading || promotionsLoading) {
    return <div className={styles.loading}>Loading content...</div>;
  }

  return (
    <>
      {(error || saveError || bannersError || promotionsError) && (
        <div className={styles.errorMessage}>
          <p>{error || saveError || bannersError || promotionsError}</p>
        </div>
      )}
      
      <div className={styles.pagesTabs}>
        <Button
          type='secondary'
          label='Home Sections'
          externalStyles={`${styles['tabButton']} ${activeTab === 'home' ? styles['active'] : ''}`}
          action={() => handleTabChange('home')}
        />
        <Button
          type='secondary'
          label='About'
          externalStyles={`${styles['tabButton']} ${activeTab === 'about' ? styles['active'] : ''}`}
          action={() => handleTabChange('about')}
        />
        <Button
          type='secondary'
          label='Contact us'
          externalStyles={`${styles['tabButton']} ${activeTab === 'contact' ? styles['active'] : ''}`}
          action={() => handleTabChange('contact')}
        />
        <Button
          type='secondary'
          label='Frequently Asked Questions'
          externalStyles={`${styles['tabButton']} ${activeTab === 'faqs' ? styles['active'] : ''}`}
          action={() => handleTabChange('faqs')}
        />
        <Button
          type='secondary'
          label='Privacy Policy'
          externalStyles={`${styles['tabButton']} ${activeTab === 'privacy' ? styles['active'] : ''}`}
          action={() => handleTabChange('privacy')}
        />
        <Button
          type='secondary'
          label='Banner Management'
          externalStyles={`${styles['tabButton']} ${activeTab === 'banners' ? styles['active'] : ''}`}
          action={() => handleTabChange('banners')}
        />
        <Button
          type='secondary'
          label='Promotions'
          externalStyles={`${styles['tabButton']} ${activeTab === 'promotions' ? styles['active'] : ''}`}
          action={() => handleTabChange('promotions')}
        />
      </div>

      <div className={styles.editorContainer}>
        <h2>Editing: {getPageTitle()}</h2>
        
        {getEditorInstructions()}
        
        {activeTab === 'promotions' ? (
          <div className={styles.promotionsSection}>
            <div className={styles.promotionsHeader}>
              <h3>Manage Promotions</h3>
              <div className={styles.promotionsHeaderActions}>
                <Button
                  type="icon-outlined"
                  icon="fa-solid fa-refresh"
                  action={fetchPromotions}
                />
                <Button
                  type="primary"
                  label="Add New Promotion"
                  icon="fa-solid fa-plus"
                  action={handleCreatePromotion}
                />
              </div>
            </div>
    
    {promotions && promotions.length > 0 ? (
      <div className={styles.promotionsTable}>
        <div className={styles.tableHeader}>
          <span>ID</span>
          <span>TITLE</span>
          <span>DISCOUNT</span>
          <span>DATE RANGE</span>
          <span>STATUS</span>
          <span>ACTIONS</span>
        </div>
        
        {promotions.map((promotion) => (
        <div key={promotion.id} className={styles.tableRow}>
          <span className={styles.promotionId}>{promotion.id}</span>
          <span className={styles.promotionTitle}>{promotion.title}</span>
          <div className={styles.promotionCodeDiscount}>
            <span className={styles.promotionDiscount}>{promotion.discount}%</span>
          </div>
          <div className={styles.promotionProducts}>
            <span className={styles.productCount}>
              {promotion.products ? promotion.products.length : 0} products
            </span>
          </div>
          <div className={styles.promotionDateRange}>
            <span className={styles.dateFrom}>{formatDateForInput(promotion.start_date)}</span>
            <span className={styles.dateTo}>{formatDateForInput(promotion.end_date)}</span>
          </div>
          <span className={`${styles.promotionStatus} ${promotion.is_active === 1 ? styles.active : styles.inactive}`}>
            {promotion.is_active === 1 ? 'Active' : 'Inactive'}
          </span>
          <div className={styles.actionButtons}>
            <Button
              type="icon"
              icon="fa-solid fa-eye"
              action={() => handleViewPromotion(promotion)}
              externalStyles={styles.actionBtn}
            />
            <Button
              type="icon"
              icon={promotion.is_active === 1 ? "fa-solid fa-toggle-on" : "fa-solid fa-toggle-off"}
              action={() => handleTogglePromotionStatus(promotion)}
              externalStyles={styles.actionBtn}
            />
            <Button
              type="icon"
              icon="fa-solid fa-edit"
              action={() => handleEditPromotion(promotion)}
              externalStyles={styles.actionBtn}
            />
            <Button
              type="icon"
              icon="fa-solid fa-trash"
              action={() => handleDeletePromotion(promotion)}
              externalStyles={styles.actionBtn}
            />
          </div>
        </div>
      ))}
      </div>
    ) : (
      <div className={styles.noPromotions}>
        <p>No promotions found</p>
        <Button
          type="primary"
          label="Create First Promotion"
          action={handleCreatePromotion}
        />
      </div>
    )}
  </div>
        ) : activeTab === 'banners' ? (
          <div className={styles.bannersSection}>
            <div className={styles.bannersHeader}>
              <h3>Manage Website Banners</h3>
              <Button
                type="icon-outlined"
                icon="fa-solid fa-refresh"
                action={fetchBanners}
              />
            </div>
            
            {banners && banners.length > 0 ? (
              <div className={styles.bannersTable}>
                <div className={styles.tableHeader}>
                  <span>ID</span>
                  <span>Type</span>
                  <span>Page</span>
                  <span>Image Preview</span>
                  <span>Last Modified</span>
                  <span>Actions</span>
                </div>
                
                {banners.map((banner) => (
                  <div key={banner.id} className={styles.tableRow}>
                    <span className={styles.bannerId}>{banner.id}</span>
                    <span className={styles.bannerType}>{banner.type}</span>
                    <span className={styles.bannerPage}>{banner.page}</span>
                    <div className={styles.imagePreview}>
                      <img
                        src={banner.image_url}
                        alt={`${banner.type} banner`}
                        onError={(e) => {
                          e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                        }}
                      />
                    </div>
                    <span className={styles.modifiedDate}>{formatDate(banner.modified_at)}</span>
                    <div className={styles.actionButtons}>
                      <Button
                        type="icon"
                        icon="fa-solid fa-eye"
                        action={() => handleViewBanner(banner)}
                        externalStyles={styles.actionBtn}
                      />
                      <Button
                        type="icon"
                        icon="fa-solid fa-edit"
                        action={() => handleModifyBanner(banner)}
                        externalStyles={styles.actionBtn}
                      />
                      <Button
                        type="icon"
                        icon="fa-solid fa-undo"
                        action={() => handleResetBanner(banner)}
                        externalStyles={styles.actionBtn}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noBanners}>
                <p>No banners found</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.editorPreview}>
            <div className={styles.editorSection}>
              <h3>Text Editor</h3>
              <textarea
                className={styles.textarea}
                value={content}
                onChange={handleContentChange}
                rows="20"
                placeholder="Enter text content here (plain text format)..."
              />
            </div>
            
            <div className={styles.previewSection}>
              <h3>Content Preview</h3>
              <div className={styles.previewContent}>
                {formatTextForPreview(content)}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'banners' && activeTab !== 'promotions' && (
          <div className={styles.saveSection}>
            <Button
              type='primary'
              label='Save changes'
              action={handleSave}
            />
            {isSaved && <span className={styles.savedMessage}>✓ Content saved successfully!</span>}
          </div>
        )}
      </div>

      {/* Banner Modals */}
      <Modal
        label="Banner Details"
        isOpen={isModalOpen && modalType === 'view'}
        onClose={() => setIsModalOpen(false)}
      >
        {selectedBanner && (
          <div className={styles.bannerDetails}>
            <div className={styles.detailRow}>
              <strong>ID:</strong>
              {selectedBanner.id}
            </div>
            <div className={styles.detailRow}>
              <strong>Type:</strong>
              {selectedBanner.type}
            </div>
            <div className={styles.detailRow}>
              <strong>Page:</strong>
              {selectedBanner.page}
            </div>
            <div className={styles.detailRow}>
              <strong>Image URL:</strong>
              {selectedBanner.image_url}
            </div>
            <div className={styles.detailRow}>
              <strong>Last Modified:</strong> {formatDate(selectedBanner.modified_at)}
            </div>
            <div className={styles.imagePreviewLarge}>
              <img
                src={selectedBanner.image_url}
                alt={`${selectedBanner.type} banner`}
                onError={(e) => {
                  e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                }}
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                type="secondary"
                label="Close"
                action={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        label="Modify Banner"
        isOpen={isModalOpen && modalType === 'modify'}
        onClose={() => setIsModalOpen(false)}
      >
        {selectedBanner && (
          <div className={styles.modifyBanner}>
            <p>Modifying banner for <strong>{selectedBanner.page}</strong> page</p>
            <div className={styles.inputGroup}>
              <label>New Image URL:</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className={styles.urlInput}
              />
            </div>
            <div className={styles.imagePreviewLarge}>
              <h4>Current Image:</h4>
              <img
                src={selectedBanner.image_url}
                alt="Current banner"
                onError={(e) => {
                  e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                }}
              />
            </div>
            {newImageUrl && newImageUrl !== selectedBanner.image_url && (
              <div className={styles.imagePreviewLarge}>
                <h4>New Image Preview:</h4>
                <img
                  src={newImageUrl}
                  alt="New banner preview"
                  onError={(e) => {
                    e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                  }}
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <Button
                type="secondary"
                label="Cancel"
                action={() => setIsModalOpen(false)}
                disabled={bannerActionLoading}
              />
              <Button
                type="primary"
                label={bannerActionLoading ? "Updating..." : "Update Banner"}
                action={confirmModifyBanner}
                disabled={bannerActionLoading || !newImageUrl.trim() || newImageUrl === selectedBanner.image_url}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        label="Reset Banner"
        isOpen={isModalOpen && modalType === 'reset'}
        onClose={() => setIsModalOpen(false)}
      >
        {selectedBanner && (
          <div className={styles.resetBanner}>
            <p>Are you sure you want to reset the banner for <strong>{selectedBanner.page}</strong> page?</p>
            <p>This will replace the current image with the placeholder image.</p>
            <div className={styles.imagePreviewLarge}>
              <h4>Current Image:</h4>
              <img
                src={selectedBanner.image_url}
                alt="Current banner"
                onError={(e) => {
                  e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                }}
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                type="secondary"
                label="Cancel"
                action={() => setIsModalOpen(false)}
                disabled={bannerActionLoading}
              />
              <Button
                type="primary"
                label={bannerActionLoading ? "Resetting..." : "Reset to Placeholder"}
                action={confirmResetBanner}
                disabled={bannerActionLoading}
                externalStyles={styles.resetButton}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Promotion Modals */}
<Modal
    label="Create New Promotion"
    isOpen={isModalOpen && modalType === 'promotion-create'}
    onClose={() => { setIsModalOpen(false); resetProductSearch(); }}
    size="large"
  >
    <div className={styles.promotionForm}>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Title *</label>
          <input
            type="text"
            value={promotionFormData.title || ''}
            onChange={(e) => handlePromotionFormChange('title', e.target.value)}
            placeholder="Enter promotion title..."
            className={styles.formInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Discount (%) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={promotionFormData.discount || ''}
            onChange={(e) => handlePromotionFormChange('discount', e.target.value)}
            placeholder="15.50"
            className={styles.formInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Active Status</label>
          <select
            value={promotionFormData.is_active}
            onChange={(e) => handlePromotionFormChange('is_active', e.target.value === 'true')}
            className={styles.formInput}
          >
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Start Date & Time *</label>
          <input
            type="datetime-local"
            value={promotionFormData.start_date || ''}
            onChange={(e) => handlePromotionFormChange('start_date', e.target.value)}
            className={styles.formInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>End Date & Time *</label>
          <input
            type="datetime-local"
            value={promotionFormData.end_date || ''}
            onChange={(e) => handlePromotionFormChange('end_date', e.target.value)}
            className={styles.formInput}
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Select Products (Optional)</label>
        <div className={styles.productSelector}>
          {/* Product Search Input */}
          <div className={styles.productSearchContainer}>
            <div className={styles.searchInputWrapper}>
              <i className="fa-solid fa-search"></i>
              <input
                type="text"
                placeholder="Search products by name, price, or category..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className={styles.productSearchInput}
              />
              {productSearchQuery && (
                <Button
                  type='icon'
                  icon='fa-solid fa-times'
                  action={ () => setProductSearchQuery('') }
                />
              )}
            </div>
            {productSearchQuery && (
              <div className={styles.searchInfo}>
                Showing {filteredProducts.length} of {getAvailableProducts().length} products
              </div>
            )}
          </div>

          {filteredProducts && filteredProducts.length > 0 ? (
            <>
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => (
                  <div key={product.id} className={styles.productOption}>
                    <input
                      type="checkbox"
                      id={`product-${product.id}`}
                      checked={(promotionFormData.product_ids || []).includes(product.id)}
                      onChange={() => handleProductSelection(product.id)}
                    />
                    <label htmlFor={`product-${product.id}`} className={styles.productLabel}>
                      <img
                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}.webp`}
                        alt={product.label}
                        className={styles.productImage}
                        onError={(e) => {
                          e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                        }}
                      />
                      <div className={styles.productInfo}>
                        <span className={styles.productName}>{product.label}</span>
                        <span className={styles.productPrice}>${product.price}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {(promotionFormData.product_ids || []).length === 0 && (
                <p className={styles.noProductsSelected}>
                  No products selected - promotion will apply to all products
                </p>
              )}
            </>
          ) : productSearchQuery ? (
            <div className={styles.noProductsFound}>
              <p>No products found matching "{productSearchQuery}"</p>
              <button
                type="button"
                onClick={() => setProductSearchQuery('')}
                className={styles.clearSearchLink}
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className={styles.noProductsSelected}>
              No available products (all products have active promotions or no products exist)
            </p>
          )}
        </div>
      </div>

      <div className={styles.modalActions}>
        <Button
          type="secondary"
          label="Cancel"
          action={() => { setIsModalOpen(false); resetProductSearch(); }}
          disabled={promotionActionLoading}
        />
        <Button
          type="primary"
          label={promotionActionLoading ? "Creating..." : "Create Promotion"}
          action={confirmCreatePromotion}
          disabled={promotionActionLoading || !promotionFormData.title || !promotionFormData.discount || !promotionFormData.start_date || !promotionFormData.end_date}
        />
      </div>
    </div>
  </Modal>

<Modal
    label="Edit Promotion"
    isOpen={isModalOpen && modalType === 'promotion-edit'}
    onClose={() => { setIsModalOpen(false); resetProductSearch(); }}
    size="large"
  >
    <div className={styles.promotionForm}>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Title *</label>
          <input
            type="text"
            value={promotionFormData.title || ''}
            onChange={(e) => handlePromotionFormChange('title', e.target.value)}
            placeholder="Enter promotion title..."
            className={styles.formInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Discount (%) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={promotionFormData.discount || ''}
            onChange={(e) => handlePromotionFormChange('discount', e.target.value)}
            placeholder="15.50"
            className={styles.formInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Active Status</label>
          <select
            value={promotionFormData.is_active}
            onChange={(e) => handlePromotionFormChange('is_active', e.target.value === 'true')}
            className={styles.formInput}
          >
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Start Date *</label>
          <input
            type="date"
            value={promotionFormData.start_date || ''}
            onChange={(e) => handlePromotionFormChange('start_date', e.target.value)}
            className={styles.formInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>End Date *</label>
          <input
            type="date"
            value={promotionFormData.end_date || ''}
            onChange={(e) => handlePromotionFormChange('end_date', e.target.value)}
            className={styles.formInput}
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Select Products (Optional)</label>
        <div className={styles.productSelector}>
          {/* Product Search Input */}
          <div className={styles.productSearchContainer}>
            <div className={styles.searchInputWrapper}>
              <i className="fa-solid fa-search"></i>
              <input
                type="text"
                placeholder="Search products by name, price, or category..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className={styles.productSearchInput}
              />
              {productSearchQuery && (
                <Button
                  type='icon'
                  icon='fa-solid fa-times'
                  action={ () => setProductSearchQuery('') }
                />
              )}
            </div>
            {productSearchQuery && (
              <div className={styles.searchInfo}>
                Showing {filteredProducts.length} of {getAvailableProducts().length} products
              </div>
            )}
          </div>

          {filteredProducts && filteredProducts.length > 0 ? (
            <>
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => (
                  <div key={product.id} className={styles.productOption}>
                    <input
                      type="checkbox"
                      id={`edit-product-${product.id}`}
                      checked={(promotionFormData.product_ids || []).includes(product.id)}
                      onChange={() => handleProductSelection(product.id)}
                    />
                    <label htmlFor={`edit-product-${product.id}`} className={styles.productLabel}>
                      <img
                        src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}.webp`}
                        alt={product.label}
                        className={styles.productImage}
                        onError={(e) => {
                          e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                        }}
                      />
                      <div className={styles.productInfo}>
                        <span className={styles.productName}>{product.label}</span>
                        <span className={styles.productPrice}>${product.price}</span>
                      </div>
                    </label>
                  </div>
                ))}
                {/* Show currently selected products even if they have other promotions */}
                {selectedPromotion && selectedPromotion.products && selectedPromotion.products.map((product) => (
                  !filteredProducts.find(p => p.id === product.id) && (
                    <div key={product.id} className={styles.productOption}>
                      <input
                        type="checkbox"
                        id={`edit-product-${product.id}`}
                        checked={(promotionFormData.product_ids || []).includes(product.id)}
                        onChange={() => handleProductSelection(product.id)}
                      />
                      <label htmlFor={`edit-product-${product.id}`} className={styles.productLabel}>
                        <img
                          src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}.webp`}
                          alt={product.label}
                          className={styles.productImage}
                          onError={(e) => {
                            e.target.src = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';
                          }}
                        />
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>{product.label}</span>
                          <span className={styles.productPrice}>${product.price}</span>
                        </div>
                      </label>
                    </div>
                  )
                ))}
              </div>
              {(promotionFormData.product_ids || []).length === 0 && (
                <p className={styles.noProductsSelected}>
                  No products selected - promotion will apply to all products
                </p>
              )}
            </>
          ) : productSearchQuery ? (
            <div className={styles.noProductsFound}>
              <p>No products found matching "{productSearchQuery}"</p>
              <button
                type="button"
                onClick={() => setProductSearchQuery('')}
                className={styles.clearSearchLink}
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className={styles.noProductsSelected}>
              No available products (all products have active promotions or no products exist)
            </p>
          )}
        </div>
      </div>

      <div className={styles.modalActions}>
        <Button
          type="secondary"
          label="Cancel"
          action={() => { setIsModalOpen(false); resetProductSearch(); }}
          disabled={promotionActionLoading}
        />
        <Button
          type="primary"
          label={promotionActionLoading ? "Updating..." : "Update Promotion"}
          action={confirmEditPromotion}
          disabled={promotionActionLoading || !promotionFormData.title || !promotionFormData.discount || !promotionFormData.start_date || !promotionFormData.end_date}
        />
      </div>
    </div>
  </Modal>

      <Modal
        label="Delete Promotion"
        isOpen={isModalOpen && modalType === 'promotion-delete'}
        onClose={() => setIsModalOpen(false)}
      >
        {selectedPromotion && (
          <div className={styles.deletePromotion}>
            <p>Are you sure you want to delete the promotion <strong>"{selectedPromotion.title}"</strong>?</p>
            <p>This action cannot be undone.</p>
            
            <div className={styles.promotionSummary}>
              <div className={styles.summaryItem}>
                <strong>Discount:</strong> {selectedPromotion.discount}%
              </div>
              <div className={styles.summaryItem}>
                <strong>Period:</strong> {formatDateForInput(selectedPromotion.start_date)} - {formatDateForInput(selectedPromotion.end_date)}
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button
                type="secondary"
                label="Cancel"
                action={() => setIsModalOpen(false)}
                disabled={promotionActionLoading}
              />
              <Button
                type="primary"
                label={promotionActionLoading ? "Deleting..." : "Delete Promotion"}
                action={confirmDeletePromotion}
                disabled={promotionActionLoading}
                externalStyles={styles.deleteButton}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Add this modal after the Delete Promotion modal */}
      <Modal
        label="Promotion Details"
        isOpen={isModalOpen && modalType === 'promotion-view'}
        onClose={() => setIsModalOpen(false)}
      >
        {selectedPromotion && (
          <div className={styles.promotionDetails}>
            <div className={styles.detailRow}>
              <strong>ID:</strong>
              <span>{selectedPromotion.id}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Title:</strong>
              <span>{selectedPromotion.title}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Discount Percentage:</strong>
              <span>{selectedPromotion.discount}%</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Associated Products:</strong>
              <div className={styles.associatedProducts}>
                {selectedPromotion.products && selectedPromotion.products.length > 0 ? (
                  <div className={styles.productsList}>
                    {selectedPromotion.products.map((product) => (
                      <div key={product.id} className={styles.productItem}>
                        <img
                          src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}.webp`}
                          alt={product.label}
                          className={styles.productThumb}
                        />
                        <span>{product.label}</span>
                        <span>${product.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>All products</span>
                )}
              </div>
            </div>
            <div className={styles.detailRow}>
              <strong>Start Date:</strong>
              <span>{formatDateForInput(selectedPromotion.start_date)}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>End Date:</strong>
              <span>{formatDateForInput(selectedPromotion.end_date)}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Status:</strong>
              <span className={`${styles.promotionStatus} ${selectedPromotion.is_active === 1 ? styles.active : styles.inactive}`}>
                {selectedPromotion.is_active === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <strong>Created At:</strong>
              <span>{formatDate(selectedPromotion.created_at)}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Last Updated:</strong>
              <span>{formatDate(selectedPromotion.updated_at)}</span>
            </div>
            
            <div className={styles.promotionPreview}>
              <h4>Promotion Preview</h4>
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>{selectedPromotion.title}</span>
                  <span className={styles.previewDiscount}>{selectedPromotion.discount}% OFF</span>
                </div>
                <div className={styles.previewDates}>
                  Valid from {formatDateForInput(selectedPromotion.start_date)} to {formatDateForInput(selectedPromotion.end_date)}
                </div>
              </div>
            </div>
        
            <div className={styles.modalActions}>
              <Button
                type="secondary"
                label="Close"
                action={() => setIsModalOpen(false)}
              />
              <Button
                type="primary"
                label="Edit Promotion"
                action={() => {
                  setIsModalOpen(false);
                  handleEditPromotion(selectedPromotion);
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CMS;
