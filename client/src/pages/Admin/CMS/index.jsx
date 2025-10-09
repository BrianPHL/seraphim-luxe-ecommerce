import React, { useState, useEffect } from 'react';
import styles from './CMS.module.css';
import { Button, Modal } from '@components';
import { useCMS, useBanners } from '@contexts';

const CMS = () => {
  const { pages, loading, error, updatePage } = useCMS();
  const { banners, loading: bannersLoading, error: bannersError, modifySpecificBanner, removeSpecificBanner, fetchBanners } = useBanners();
  const [activeTab, setActiveTab] = useState('home');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Banner management states
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'modify', 'reset'
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bannerActionLoading, setBannerActionLoading] = useState(false);

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
      default: return 'Static Page';
    }
  };

  const formatTextForPreview = (text) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  const getEditorInstructions = () => {
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

  if (loading || bannersLoading) {
    return <div className={styles.loading}>Loading content...</div>;
  }

  return (
    <>
      {(error || saveError || bannersError) && (
        <div className={styles.errorMessage}>
          <p>{error || saveError || bannersError}</p>
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
      </div>

      <div className={styles.editorContainer}>
        <h2>Editing: {getPageTitle()}</h2>
        
        {getEditorInstructions()}
        
        {activeTab === 'banners' ? (
          <div className={styles.bannersSection}>
            <div className={styles.bannersHeader}>
              <h3>Manage Website Banners</h3>
              <Button
                type="secondary"
                label="Refresh"
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

        {activeTab !== 'banners' && (
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

      {/* Banner View Modal */}
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

      {/* Banner Modify Modal */}
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

      {/* Banner Reset Modal */}
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
    </>
  );
};

export default CMS;
