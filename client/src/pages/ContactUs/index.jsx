import React, { useState, useEffect } from 'react';
import { useCMS } from '@contexts';
import { ReturnButton } from '@components';
import styles from './ContactUs.module.css';

const ContactUs = () => {
    const { fetchSpecificPage, loading: cmsLoading } = useCMS();
    const [contactContent, setContactContent] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        let isMounted = true;
        
        const loadContent = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const pageData = await fetchSpecificPage('contact');
                
                if (!isMounted) return;
                
                if (pageData && pageData.content) {
                    setContactContent(pageData.content);
                } else {
                    throw new Error('No content received from server');
                }
            } catch (error) {
                if (!isMounted) return;
                
                console.error('Error loading content:', error);
                setError('Failed to load content from server. Using default content.');
                setContactContent(
                    "We'd love to hear from you! Get in touch with our team.\n\n" +
                    "Email: info@seraphimluxe.com\n" +
                    "Phone: +1 (555) 123-4567\n" +
                    "Address: 123 Fashion Avenue, Style District, City 10001\n\n" +
                    "Business Hours:\n" +
                    "Monday-Friday: 9AM-6PM\n" +
                    "Saturday: 10AM-4PM\n" +
                    "Sunday: Closed"
                );
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        loadContent();
        
        return () => {
            isMounted = false;
        };
    }, []); 

    const parseContactContent = (text) => {
        if (!text) return {
            email: 'info@seraphimluxe.com',
            phone: '+1 (555) 123-4567',
            address: '123 Fashion Avenue, Style District, City 10001',
            hours: 'Monday-Friday: 9AM-6PM\n Saturday: 10AM-4PM\n Sunday: Closed'
        };
        
        const sections = {
            email: 'info@seraphimluxe.com',
            phone: '+1 (555) 123-4567',
            address: '123 Fashion Avenue, Style District, City 10001',
            hours: 'Monday-Friday: 9AM-6PM\n Saturday: 10AM-4PM\n Sunday: Closed'
        };
        
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.toLowerCase().startsWith('email:')) {
                sections.email = line.substring(6).trim();
            } else if (line.toLowerCase().startsWith('phone:')) {
                sections.phone = line.substring(6).trim();
            } else if (line.toLowerCase().startsWith('address:')) {
                sections.address = line.substring(8).trim();
            } else if (line.toLowerCase().includes('business hours')) {
                let hoursLines = [];
                const hoursIndex = line.toLowerCase().indexOf('business hours');
                
                if (hoursIndex >= 0 && line.length > hoursIndex + 14) {
                    hoursLines.push(line.substring(hoursIndex + 14).trim());
                }
                
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (!nextLine) break;
                    if (nextLine.toLowerCase().startsWith('email:') || 
                        nextLine.toLowerCase().startsWith('phone:') ||
                        nextLine.toLowerCase().startsWith('address:')) {
                        break;
                    }
                    hoursLines.push(nextLine);
                }
                
                sections.hours = hoursLines.join('\n');
                break;
            }
        }
        
        return sections;
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log('Form submitted:', formData);
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    const contactData = parseContactContent(contactContent);

    if (isLoading || cmsLoading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading contact information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.banner}></div>
            <div className={styles.header}>
                <ReturnButton />
                <h1>Contact Us</h1>
            </div>
            
            {error && (
                <div className={styles.errorBanner}>
                    <span>{error}</span>
                </div>
            )}
            
            <div className={styles.content}>
                <div className={styles['contact-info']}>
                    <h2>We'd love to hear from you!</h2>
                    <p>Get in touch with our team for any questions or support.</p>
                    
                    <div className={styles['contact-details']}>
                        <div className={styles['contact-item']}>
                            <h3>Email</h3>
                            <p>{contactData.email}</p>
                        </div>
                        
                        <div className={styles['contact-item']}>
                            <h3>Phone</h3>
                            <p>{contactData.phone}</p>
                        </div>
                        
                        <div className={styles['contact-item']}>
                            <h3>Address</h3>
                            <p>{contactData.address}</p>
                        </div>
                        
                        <div className={styles['contact-item']}>
                            <h3>Business Hours</h3>
                            <p style={{whiteSpace: 'pre-line'}}>{contactData.hours}</p>
                        </div>
                    </div>
                </div>
                
                <div className={styles['form-section']}>
                    <h2>Send us a Message</h2>
                    <form className={styles['contact-form']} onSubmit={handleSubmit}>
                        <div className={styles['form-group']}>
                            <label htmlFor="name">Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                placeholder="Your name" 
                                value={formData.name}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        
                        <div className={styles['form-group']}>
                            <label htmlFor="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="Your email address" 
                                value={formData.email}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        
                        <div className={styles['form-group']}>
                            <label htmlFor="subject">Subject</label>
                            <input 
                                type="text" 
                                id="subject" 
                                placeholder="What is this regarding?" 
                                value={formData.subject}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        
                        <div className={styles['form-group']}>
                            <label htmlFor="message">Message</label>
                            <textarea 
                                id="message" 
                                rows="5" 
                                placeholder="How can we help you?"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                            ></textarea>
                        </div>
                        
                        <button type="submit" className={styles['submit-btn']}>
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
