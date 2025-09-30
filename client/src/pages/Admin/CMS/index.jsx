import React, { useState, useEffect } from 'react';
import styles from './CMS.module.css';
import { Button } from '@components';
import { useCMS } from '@contexts';

const CMS = () => {
  const { pages, loading, error, updatePage } = useCMS();
  const [ activeTab, setActiveTab ] = useState('home');
  const [ content, setContent ] = useState('');
  const [ isSaved, setIsSaved ] = useState(false);
  const [ saveError, setSaveError ] = useState(null);

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
      default: return 'Static Page';
    }
  };

  const formatTextForPreview = (text) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  const getEditorInstructions = () => {
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

  if (loading) {
    return <div className={styles.loading}>Loading content...</div>;
  }

  return (
    <>
      {(error || saveError) && (
        <div className={styles.errorMessage}>
          <p>{error || saveError}</p>
        </div>
      )}
      
      <div className={styles.pagesTabs}>
        <Button
          type='secondary'
          label='Home Sections'
          externalStyles={`${ styles['tabButton'] } ${ activeTab === 'home' ? styles['active'] : '' }`}
          action={ () => handleTabChange('home') }
        />
        <Button
          type='secondary'
          label='About'
          externalStyles={`${ styles['tabButton'] } ${ activeTab === 'about' ? styles['active'] : '' }`}
          action={ () => handleTabChange('about') }
        />
        <Button
          type='secondary'
          label='Contact us'
          externalStyles={`${ styles['tabButton'] } ${ activeTab === 'contact' ? styles['active'] : '' }`}
          action={ () => handleTabChange('contact') }
        />
        <Button
          type='secondary'
          label='Frequently Asked Questions'
          externalStyles={`${ styles['tabButton'] } ${ activeTab === 'faqs' ? styles['active'] : '' }`}
          action={ () => handleTabChange('faqs') }
        />
        <Button
          type='secondary'
          label='Privacy Policy'
          externalStyles={`${ styles['tabButton'] } ${ activeTab === 'privacy' ? styles['active'] : '' }`}
          action={ () => handleTabChange('privacy') }
        />
      </div>

      <div className={styles.editorContainer}>
        <h2>Editing: {getPageTitle()}</h2>
        
        {getEditorInstructions()}
        
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

        <div className={styles.saveSection}>
          <Button
            type='primary'
            label={ 'Save changes' }
            action={ () => handleSave() }
          />
          {isSaved && <span className={styles.savedMessage}>✓ Content saved successfully!</span>}
        </div>
      </div>
    </>
  );
};

export default CMS;
