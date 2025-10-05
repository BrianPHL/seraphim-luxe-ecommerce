import { useState, useEffect } from 'react';
import { useCMS } from '@contexts';
import { ReturnButton, Banner } from '@components';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
    const { fetchSpecificPage, loading } = useCMS();
    const [ content, setContent ] = useState('');
    const [ error, setError ] = useState(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const pageData = await fetchSpecificPage('privacy');
                if (pageData && pageData.content) {
                    setContent(pageData.content);
                } else {
                    throw new Error('No content received from server');
                }
            } catch (error) {
                console.error('Error loading content:', error);
                setError('Failed to load content from server. Using default content.');
                setContent(
                    "Privacy Policy\n\n" +
                    "Introduction\n\n" +
                    "At Seraphim Luxe, we value your privacy and are committed to protecting your personal information. " +
                    "This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.\n\n" +
                    "Information We Collect\n\n" +
                    "We collect information you provide directly to us, such as when you create an account, make a purchase, " +
                    "or contact us. This may include your name, email address, shipping address, payment information, and any " +
                    "other details you choose to provide."
                );
            }
        };
        loadContent();
    }, []);

    const parsePrivacyContent = (text) => {
        if (!text) return [];
        
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        const sections = [];
        let currentSection = { title: '', content: '' };
        
        paragraphs.forEach(paragraph => {
            const isTitle = paragraph.length < 80 && 
                           !paragraph.endsWith('.') && 
                           !paragraph.endsWith('!') && 
                           !paragraph.endsWith('?') &&
                           !paragraph.includes(':') &&
                           !paragraph.toLowerCase().includes('effective date');
            
            if (isTitle) {
                if (currentSection.title) {
                    sections.push(currentSection);
                }
                currentSection = { title: paragraph, content: '' };
            } else if (currentSection.title) {
                if (currentSection.content) {
                    currentSection.content += '\n\n' + paragraph;
                } else {
                    currentSection.content = paragraph;
                }
            } else if (sections.length === 0) {
                sections.push({ title: 'Introduction', content: paragraph });
            }
        });
        
        if (currentSection.title) {
            sections.push(currentSection);
        }
        
        return sections;
    };

    const privacySections = parsePrivacyContent(content);

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading privacy policy...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Banner
                type="header"
                imageURL="" // TODO: Add banner image later.
            />
            <div className={styles.header}>
                <ReturnButton />
                <h1>Privacy Policy</h1>
            </div>
            
            {error && (
                <div className={styles.errorBanner}>
                    <span>{error}</span>
                </div>
            )}
            
            <div className={styles.content}>
                
                {privacySections.length > 0 ? (
                    privacySections.map((section, index) => (
                        <section key={index} className={styles['policy-section']}>
                            <h2>{section.title}</h2>
                            <p style={{whiteSpace: 'pre-line'}}>{section.content}</p>
                        </section>
                    ))
                ) : (
                    <>
                        <section className={styles['policy-section']}>
                            <h2>Introduction</h2>
                            <p>At Seraphim Luxe, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.</p>
                        </section>
                        <section className={styles['policy-section']}>
                            <h2>Information We Collect</h2>
                            <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, shipping address, payment information, and any other details you choose to provide.</p>
                        </section>
                    </>
                )}
                
                <div className={styles['update-notice']}>
                    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;