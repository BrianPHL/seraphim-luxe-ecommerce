import React, { useState, useEffect } from 'react';
import styles from './CMS.module.css';
import { fetchWithTimeout } from '@utils';
import { Button } from '@components';

const CMS = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [pages, setPages] = useState({});
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      "other details you choose to provide.",

    promotions: "promotions",
    banners: "banners",
    homepage: "homepage"
  };

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithTimeout('/api/static-pages');
        
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

      const response = await fetchWithTimeout(`/api/static-pages/${activeTab}`, {
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
      case 'promotions': return 'Promotions Management';
      case 'banners': return 'Banners Management';
      case 'homepage': return 'Homepage Content Management';
      default: return 'Static Page';
    }
  };

  const formatTextForPreview = (text) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  const renderContentManagement = () => {
    if (activeTab === 'promotions') {
      return <Promotions />;
    } else if (activeTab === 'banners') {
      return <Banners />;
    } else if (activeTab === 'homepage') {
      return <HomepageContent />;
    } else {
      return (
        <>
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
              label='Save changes'
              action={() => handleSave()}
            />
            {isSaved && <span className={styles.savedMessage}>✓ Content saved successfully!</span>}
          </div>
        </>
      );
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading content...</div>;
  }

  return (
    <div className={styles.cmsContainer}>
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      <div className={styles.pagesTabs}>
        <Button
          type='secondary'
          label='About'
          externalStyles={`${styles.tabButton} ${activeTab === 'about' ? styles.active : ''}`}
          action={() => handleTabChange('about')}
        />
        <Button
          type='secondary'
          label='Contact us'
          externalStyles={`${styles.tabButton} ${activeTab === 'contact' ? styles.active : ''}`}
          action={() => handleTabChange('contact')}
        />
        <Button
          type='secondary'
          label='Frequently Asked Questions'
          externalStyles={`${styles.tabButton} ${activeTab === 'faqs' ? styles.active : ''}`}
          action={() => handleTabChange('faqs')}
        />
        <Button
          type='secondary'
          label='Privacy Policy'
          externalStyles={`${styles.tabButton} ${activeTab === 'privacy' ? styles.active : ''}`}
          action={() => handleTabChange('privacy')}
        />
        <Button
          type='secondary'
          label='Promotions'
          externalStyles={`${styles.tabButton} ${activeTab === 'promotions' ? styles.active : ''}`}
          action={() => handleTabChange('promotions')}
        />
        <Button
          type='secondary'
          label='Banners'
          externalStyles={`${styles.tabButton} ${activeTab === 'banners' ? styles.active : ''}`}
          action={() => handleTabChange('banners')}
        />
        <Button
          type='secondary'
          label='Homepage'
          externalStyles={`${styles.tabButton} ${activeTab === 'homepage' ? styles.active : ''}`}
          action={() => handleTabChange('homepage')}
        />
      </div>

      <div className={styles.editorContainer}>
        <h2>Editing: {getPageTitle()}</h2>
        {renderContentManagement()}
      </div>
    </div>
  );
};


const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    discount: '',
    products: [],
    startDate: '',
    endDate: '',
    active: true
  });

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/static-pages/promotions');
        if (!response.ok) throw new Error('Failed to fetch promotions');
        const data = await response.json();
        setPromotions(data);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };

    fetchPromotions();
  }, []);

  const handleAddPromotion = async () => {
    try {
      const response = await fetch('/api/static-pages/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotion)
      });
      if (!response.ok) throw new Error('Failed to add promotion');
      const addedPromotion = await response.json();
      setPromotions([...promotions, addedPromotion]);
      setNewPromotion({
        title: '',
        description: '',
        discount: '',
        products: [],
        startDate: '',
        endDate: '',
        active: true
      });
    } catch (error) {
      console.error('Error adding promotion:', error);
    }
  };

  const handleDeletePromotion = async (id) => {
    try {
      const response = await fetch(`/api/static-pages/promotions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete promotion');
      setPromotions(promotions.filter(promo => promo.id !== id));
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/static-pages/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotions)
      });

      if (!response.ok) throw new Error('Failed to save promotions');
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      setError('Failed to save promotions. Please try again.');
    }
  };

  return (
    <div className={styles.managementSection}>
      <h3>Promotions Management</h3>
      <p>Create and manage promotional offers for products.</p>
      
      <div className={styles.promotionForm}>
        <h4>Add New Promotion</h4>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Promotion Title</label>
            <input 
              type="text" 
              value={newPromotion.title}
              onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
              placeholder="Summer Sale"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Discount (%)</label>
            <input 
              type="number" 
              value={newPromotion.discount}
              onChange={(e) => setNewPromotion({...newPromotion, discount: e.target.value})}
              placeholder="20"
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea 
            value={newPromotion.description}
            onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
            placeholder="Describe the promotion"
            rows="3"
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Start Date</label>
            <input 
              type="date" 
              value={newPromotion.startDate}
              onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>End Date</label>
            <input 
              type="date" 
              value={newPromotion.endDate}
              onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
            />
          </div>
        </div>
        
        <Button
          type='primary'
          label='Add Promotion'
          action={handleAddPromotion}
        />
      </div>
      
      <div className={styles.promotionList}>
        <h4>Current Promotions</h4>
        {promotions.length === 0 ? (
          <p>No promotions found. Create your first promotion above.</p>
        ) : (
          <div className={styles.listContainer}>
            {promotions.map(promo => (
              <div key={promo.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <h5>{promo.title}</h5>
                  <p>{promo.description}</p>
                  <span className={styles.discount}>{promo.discount}% off</span>
                  <span className={styles.dates}>{promo.startDate} to {promo.endDate}</span>
                </div>
                <div className={styles.itemActions}>
                  <Button
                    type='secondary'
                    label='Edit'
                    action={() => console.log('Edit promotion:', promo.id)}
                  />
                  <Button
                    type='danger'
                    label='Delete'
                    action={() => handleDeletePromotion(promo.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState({
    title: '',
    image: null,
    page: 'home',
    link: '',
    active: true
  });

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/static-pages/banners');
        if (!response.ok) throw new Error('Failed to fetch banners');
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };

    fetchBanners();
  }, []);

  const handleAddBanner = async () => {
    try {
      const formData = new FormData();
      formData.append('title', newBanner.title);
      formData.append('page', newBanner.page);
      formData.append('link', newBanner.link);
      formData.append('image', newBanner.image);
      formData.append('active', newBanner.active);

      const response = await fetch('/api/static-pages/banners', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to add banner');
      const addedBanner = await response.json();
      setBanners([...banners, addedBanner]);
      setNewBanner({
        title: '',
        image: null,
        page: 'home',
        link: '',
        active: true
      });
    } catch (error) {
      console.error('Error adding banner:', error);
    }
  };

  const handleDeleteBanner = async (id) => {
    try {
      const response = await fetch(`/api/static-pages/banners/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete banner');
      setBanners(banners.filter(banner => banner.id !== id));
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewBanner({...newBanner, image: file});
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/static-pages/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banners)
      });

      if (!response.ok) throw new Error('Failed to save banners');
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      setError('Failed to save banners. Please try again.');
    }
  };

  return (
    <div className={styles.managementSection}>
      <h3>Banners Management</h3>
      <p>Add and manage banners across different pages of your website.</p>
      
      <div className={styles.bannerForm}>
        <h4>Add New Banner</h4>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Banner Title</label>
            <input 
              type="text" 
              value={newBanner.title}
              onChange={(e) => setNewBanner({...newBanner, title: e.target.value})}
              placeholder="Summer Collection"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Page Placement</label>
            <select 
              value={newBanner.page}
              onChange={(e) => setNewBanner({...newBanner, page: e.target.value})}
            >
              <option value="home">Homepage</option>
              <option value="products">Products Page</option>
              <option value="category">Category Page</option>
              <option value="about">About Page</option>
            </select>
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>Link URL (optional)</label>
          <input 
            type="text" 
            value={newBanner.link}
            onChange={(e) => setNewBanner({...newBanner, link: e.target.value})}
            placeholder="https://example.com/promo"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Banner Image</label>
          <input 
            type="file" 
            onChange={handleImageUpload}
            accept="image/*"
          />
        </div>
        
        <Button
          type='primary'
          label='Add Banner'
          action={handleAddBanner}
        />
      </div>
      
      <div className={styles.bannerList}>
        <h4>Current Banners</h4>
        {banners.length === 0 ? (
          <p>No banners found. Create your first banner above.</p>
        ) : (
          <div className={styles.listContainer}>
            {banners.map(banner => (
              <div key={banner.id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <h5>{banner.title}</h5>
                  <p>Page: {banner.page}</p>
                  {banner.link && <p>Link: {banner.link}</p>}
                  <span className={banner.active ? styles.statusActive : styles.statusInactive}>
                    {banner.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.itemImage}>
                  {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} />}
                </div>
                <div className={styles.itemActions}>
                  <Button
                    type='secondary'
                    label='Edit'
                    action={() => console.log('Edit banner:', banner.id)}
                  />
                  <Button
                    type='danger'
                    label='Delete'
                    action={() => handleDeleteBanner(banner.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HomepageContent = () => {
  const [homeContent, setHomeContent] = useState({

    heroSlides: [
      {
        id: 1,
        pretitle: "Home",
        title: "Style Without Boundaries. Express Yourself Today!",
        subtitle: "Premium unisex accessories, timeless jewelry, and effortless shopping – all in one place.",
        ctaPrimary: "Reserve Now",
        ctaSecondary: "Browse our Collections"
      },
      {
        id: 2,
        pretitle: "Jewelry Collections",
        title: "Discover Timeless Elegance",
        subtitle: "Explore our curated selection of necklaces, earrings, and bracelets for every style and occasion.",
        ctaPrimary: "Shop Collections",
        ctaSecondary: "View by Category"
      },
      {
        id: 3,
        pretitle: "Customer Experience",
        title: "Trusted By 5,000+ Style Enthusiasts Nationwide",
        subtitle: "Join thousands of satisfied customers who count on Seraphim Luxe for quality accessories and exceptional service.",
        ctaPrimary: "See Customer Stories",
        ctaSecondary: "Popular Choices"
      }
    ],

    sections: {
      featured: {
        title: "Featured Products",
        description: "Discover our handpicked selection of standout pieces, carefully chosen for their exceptional quality and style.",
        viewAllText: "View All Featured"
      },
      bestSellers: {
        title: "Best Sellers",
        description: "Shop our most popular items loved by customers worldwide for their quality and timeless appeal.",
        viewAllText: "View All Best Sellers"
      },
      newArrivals: {
        title: "New Arrivals",
        description: "Be the first to discover our latest additions – fresh styles and trending pieces just added to our collection.",
        viewAllText: "View All New Arrivals"
      }
    },

    trustSection: {
      title: "Why Style Enthusiasts Trust Seraphim Luxe",
      description: "At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality. Whether you're expressing your daily style or seeking the perfect statement piece, we've got what you need to make every look elegant and authentic.",
      features: [
        {
          icon: "fa-solid fa-truck",
          title: "Fast Delivery",
          description: "Get your accessories delivered quickly and securely anywhere in the Philippines."
        },
        {
          icon: "fa-solid fa-star",
          title: "Quality Guaranteed",
          description: "Every piece is carefully selected and quality-tested for durability and style."
        },
        {
          icon: "fa-solid fa-headset",
          title: "Expert Support",
          description: "Our team is ready to help you find the perfect pieces for your unique style."
        }
      ]
    }
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchHomepageContent = async () => {
      try {
        const response = await fetch('/api/static-pages/homepage');
        if (!response.ok) throw new Error('Failed to fetch homepage content');
        const data = await response.json();
        setHomeContent(data);
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      }
    };

    fetchHomepageContent();
  }, []);

  const handleInputChange = (section, field, value, index = null) => {
    setHomeContent(prev => {
      const newContent = {...prev};
      
      if (index !== null) {
        if (section === "heroSlides") {
          newContent.heroSlides[index][field] = value;
        } else if (section === "trustFeatures") {
          newContent.trustSection.features[index][field] = value;
        }
      } else {
        if (section === "trustSection") {
          newContent.trustSection[field] = value;
        } else {
          newContent.sections[section][field] = value;
        }
      }
      
      return newContent;
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/static-pages/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: homeContent,  // Send the full homeContent object
          title: 'Homepage Content'
        })
      });

      if (!response.ok) throw new Error('Failed to save homepage content');
      
      // Show success message
      alert('Homepage content saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  return (
    <div className={styles.managementSection}>
      <h3>Homepage Content Management</h3>
      <p>Edit the text content that appears on your homepage.</p>

      {/* Hero Slider Management */}
      <div className={styles.section}>
        <h4>Hero Slider Content</h4>
        <div className={styles.tabs}>
          {homeContent.heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              className={`${styles.tab} ${currentSlide === index ? styles.active : ''}`}
              onClick={() => setCurrentSlide(index)}
            >
              Slide {index + 1}
            </button>
          ))}
        </div>

        {homeContent.heroSlides.map((slide, index) => (
          <div key={slide.id} className={`${styles.slideEditor} ${currentSlide === index ? styles.active : ''}`}>
            <h5>Editing Slide {index + 1}</h5>
            
            <div className={styles.formGroup}>
              <label>Pre-title</label>
              <input
                type="text"
                value={slide.pretitle}
                onChange={(e) => handleInputChange("heroSlides", "pretitle", e.target.value, index)}
                placeholder="e.g., Home, Collections, etc."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Title</label>
              <textarea
                value={slide.title}
                onChange={(e) => handleInputChange("heroSlides", "title", e.target.value, index)}
                rows="2"
                placeholder="Main headline text"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Subtitle</label>
              <textarea
                value={slide.subtitle}
                onChange={(e) => handleInputChange("heroSlides", "subtitle", e.target.value, index)}
                rows="3"
                placeholder="Description text"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Primary Button Text</label>
              <input
                type="text"
                value={slide.ctaPrimary}
                onChange={(e) => handleInputChange("heroSlides", "ctaPrimary", e.target.value, index)}
                placeholder="Button text"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Secondary Button Text</label>
              <input
                type="text"
                value={slide.ctaSecondary}
                onChange={(e) => handleInputChange("heroSlides", "ctaSecondary", e.target.value, index)}
                placeholder="Button text"
              />
              <small>Note: Secondary buttons are dropdown menus that automatically show categories/subcategories.</small>
            </div>
          </div>
        ))}
      </div>

      {/* Product Sections Management */}
      <div className={styles.section}>
        <h4>Product Sections</h4>
        
        {Object.entries(homeContent.sections).map(([key, section]) => (
          <div key={key} className={styles.sectionCard}>
            <h5>{section.title} Section</h5>
            
            <div className={styles.formGroup}>
              <label>Section Title</label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => handleInputChange(key, "title", e.target.value)}
                placeholder="Section title"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={section.description}
                onChange={(e) => handleInputChange(key, "description", e.target.value)}
                rows="3"
                placeholder="Section description"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>"View All" Button Text</label>
              <input
                type="text"
                value={section.viewAllText}
                onChange={(e) => handleInputChange(key, "viewAllText", e.target.value)}
                placeholder="View All Text"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Trust Section Management */}
      <div className={styles.section}>
        <h4>Trust Section</h4>
        
        <div className={styles.sectionCard}>
          <h5>Trust Section Content</h5>
          
          <div className={styles.formGroup}>
            <label>Section Title</label>
            <input
              type="text"
              value={homeContent.trustSection.title}
              onChange={(e) => handleInputChange("trustSection", "title", e.target.value)}
              placeholder="Trust section title"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={homeContent.trustSection.description}
              onChange={(e) => handleInputChange("trustSection", "description", e.target.value)}
              rows="3"
              placeholder="Trust section description"
            />
          </div>
        </div>
        
        <h5>Trust Features</h5>
        {homeContent.trustSection.features.map((feature, index) => (
          <div key={index} className={styles.sectionCard}>
            <h6>Feature {index + 1}</h6>
            
            <div className={styles.formGroup}>
              <label>Icon Class</label>
              <input
                type="text"
                value={feature.icon}
                onChange={(e) => handleInputChange("trustFeatures", "icon", e.target.value, index)}
                placeholder="e.g., fa-solid fa-truck"
              />
              <small>Use Font Awesome icon classes (e.g., fa-solid fa-truck)</small>
            </div>
            
            <div className={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                value={feature.title}
                onChange={(e) => handleInputChange("trustFeatures", "title", e.target.value, index)}
                placeholder="Feature title"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={feature.description}
                onChange={(e) => handleInputChange("trustFeatures", "description", e.target.value, index)}
                rows="2"
                placeholder="Feature description"
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.saveSection}>
        <Button
          type='primary'
          label='Save Homepage Changes'
          action={handleSave}
        />
      </div>
    </div>
  );
};

export default CMS;