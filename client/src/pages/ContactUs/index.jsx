import React, { useState, useEffect } from 'react';
import { useCMS, useBanners, useToast, useSupportTickets, useAuth } from '@contexts';
import { ReturnButton, Banner, Button, SupportTicketChat } from '@components';
import { getErrorMessage } from '@utils';
import styles from './ContactUs.module.css';

const ContactUs = () => {
    const { fetchSpecificPage, loading: cmsLoading } = useCMS();
    const { banners } = useBanners();
    const { showToast } = useToast();
    const { createTicket } = useSupportTickets();
    const { user } = useAuth();
    const [createdTicketId, setCreatedTicketId] = useState(null);
    const [contactContent, setContactContent] = useState('');
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const loadContent = async () => {
            try {
                setError(null);

                const pageData = await fetchSpecificPage('contact');

                if (pageData && pageData.content) {
                    setContactContent(pageData.content);
                } else {
                    throw new Error('NO_CONTENT_RECEIVED');
                }
            } catch (err) {
                console.error('Error loading content:', err);
                try {
                    const errorMessage = getErrorMessage(err.message || 'DEFAULT_ERROR');
                    setError(errorMessage);
                } catch (errorErr) {
                    console.error('ContactUs page loadContent error handling:', errorErr);
                    setError('Failed to load content from server. Using default content.');
                }
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
            }
        };

        loadContent();
    }, [fetchSpecificPage]);

    const parseContactContent = (text) => {
        const defaultSections = {
            email: 'info@seraphimluxe.com',
            phone: '+1 (555) 123-4567',
            address: '123 Fashion Avenue, Style District, City 10001',
            hours: 'Monday-Friday: 9AM-6PM\nSaturday: 10AM-4PM\nSunday: Closed'
        };

        if (!text) return defaultSections;

        const sections = { ...defaultSections };
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
                    if (
                        nextLine.toLowerCase().startsWith('email:') ||
                        nextLine.toLowerCase().startsWith('phone:') ||
                        nextLine.toLowerCase().startsWith('address:')
                    ) {
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
        setFormData((prev) => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                const errorMessage = getErrorMessage('FIELDS_REQUIRED');
                setError(errorMessage);
                return;
            }

            setError(null);

            const result = await createTicket({
                customer_name: formData.name,
                customer_email: formData.email,
                subject: formData.subject,
                message: formData.message,
                priority: 'normal',
                category: 'general'
            });

            if (result.success) {
                showToast('Support ticket created! Continue the conversation below.', 'success');
                setCreatedTicketId(result.data.ticket_id);
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                throw new Error(result.message || 'Failed to create ticket');
            }

        } catch (err) {
            console.error('ContactUs page handleSubmit function error:', err);
            try {
                const errorMessage = getErrorMessage('MESSAGE_SEND_ERROR');
                setError(errorMessage);
            } catch (errorErr) {
                console.error('ContactUs page handleSubmit error handling:', errorErr);
                setError('Failed to send message. Please try again later.');
            }
        }
    };

    const contactData = parseContactContent(contactContent);

    if (cmsLoading) {
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
            <Banner data={banners.filter((banner) => banner.page === 'contact-us')} />
            <div className={styles.header}>
                <ReturnButton />
                <h1>Contact Us</h1>
            </div>

            {error && (
                <div className={styles.error}>
                    <i className='fa-solid fa-circle-exclamation'></i>
                    <p>{error}</p>
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
                            <p>{contactData.hours}</p>
                        </div>
                    </div>
                </div>

                <div className={styles['form-section']}>
                    <h2>Send us a Message</h2>
                    <div className={styles['form-notice']}>
                        <i className="fa-solid fa-info-circle"></i>
                        <p>After submitting this form, a support chat will open at the bottom of the page where you can continue the conversation with our team.</p>
                    </div>
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

                        <Button 
                            type="primary" 
                            label="Send Message & Open Chat" 
                            action={(e) => {
                                e.preventDefault();
                                handleSubmit(e);
                            }}
                            disabled={!user || !formData.name || !formData.email || !formData.subject || !formData.message}
                        />
                    </form>
                    {createdTicketId && (
                        <div className={styles['ticket-chat-section']}>
                            <SupportTicketChat ticketId={createdTicketId} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
