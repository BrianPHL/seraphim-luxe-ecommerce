import React, { useState, useEffect } from 'react';
import styles from './CMS.module.css';
import { fetchWithTimeout } from '@utils';
import { Button } from '@components';

const CMS = () => {
  const [ activeTab, setActiveTab ] = useState('about');
  const [ pages, setPages ] = useState({});
  const [ content, setContent ] = useState('');
  const [ isSaved, setIsSaved ] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState(null);

  const defaultContent = {
    about: "Driven by Style, Fueled by Expression\n\n" +
      "At Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. " +
      "Whether you're expressing your daily style, making a statement, or seeking the perfect complement " +
      "to your personality, our mission is to provide you with top-quality unisex jewelry and accessories " +
      "to enhance your personal expression.\n\n" +
      "Who We Are\n\n" +
      "Founded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown " +
      "into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, " +
      "offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style " +
      "shines at its best.",

    contact: "Contact Seraphim Luxe\n\n" +
      "We'd love to hear from you! Get in touch with our team.\n\n" +
      "Email: info@seraphimluxe.com\n" +
      "Phone: +1 (555) 123-4567\n" +
      "Address: 123 Fashion Avenue, Style District, City 10001\n\n" +
      "Business Hours:\n" +
      "Monday-Friday: 9AM-6PM\n" +
      "Saturday: 10AM-4PM\n" +
      "Sunday: Closed",

    faqs: "Frequently Asked Questions\n\n" +
      "Find answers to common questions about our products, services, and policies.\n\n" +
      "Orders & Shipping\n\n" +
      "Q: How long does shipping take?\n" +
      "A: Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.\n\n" +
      "Q: Do you ship internationally?\n" +
      "A: Yes, we ship to most countries worldwide. International shipping times vary by location.\n\n" +
      "Returns & Exchanges\n\n" +
      "Q: What is your return policy?\n" +
      "A: We accept returns within 30 days of purchase with original receipt and tags attached.\n\n" +
      "Q: How do I exchange an item?\n" +
      "A: Please contact our customer service team to initiate an exchange.",

    privacy: "Privacy Policy\n\n" +
      "Introduction\n\n" +
      "At Seraphim Luxe, we value your privacy and are committed to protecting your personal information. " +
      "This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.\n\n" +
      "Information We Collect\n\n" +
      "We collect information you provide directly to us, such as when you create an account, make a purchase, " +
      "or contact us. This may include your name, email address, shipping address, payment information, and any " +
      "other details you choose to provide."
  };

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithTimeout('/api/cms');
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        if (responseData.data) {
          setPages(responseData.data);
        } else if (responseData) {
          setPages(responseData);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (error) {
        console.error('Error loading content:', error);
        setError('Failed to load content from server. Using default content.');
        setPages(defaultContent);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

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
      setError(null);

      const response = await fetchWithTimeout(`/api/cms/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          title: getPageTitle()
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const updatedPages = { ...pages, [activeTab]: content };
      setPages(updatedPages);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);

    } catch (err) {
      console.error('Error saving content:', err);
      setError('Failed to save content. Please try again.');
    }
  };

  const getPageTitle = () => {
    switch(activeTab) {
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

  if (loading) {
    return <div className={styles.loading}>Loading content...</div>;
  }

  return (
    <>
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      <div className={styles.pagesTabs}>
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
        
        <div className={styles.editorHelp}>
          <h3>📝 Editing Instructions</h3>
          <ul>
            <li>Edit <strong>plain text content</strong> (no HTML needed)</li>
            <li>Use empty lines to separate paragraphs</li>
            <li>Use <strong>Q:</strong> and <strong>A:</strong> for FAQ formatting</li>
            <li>Save changes when finished</li>
          </ul>
        </div>
        
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
