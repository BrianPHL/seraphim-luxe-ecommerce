import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCMS, useBanners } from '@contexts';
import { ReturnButton, Banner, Button } from '@components';
import styles from './FAQs.module.css';


const FAQs = () => {
    const navigate = useNavigate(); 
    const { fetchSpecificPage, loading } = useCMS();
    const { banners } = useBanners();
    const [ content, setContent ] = useState('');
    const [ error, setError ] = useState(null);
    const [ activeIndex, setActiveIndex ] = useState(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const pageData = await fetchSpecificPage('faqs');
                if (pageData && pageData.content) {
                    setContent(pageData.content);
                } else {
                    throw new Error('No content received from server');
                }
            } catch (error) {
                console.error('Error loading content:', error);
                setError('Failed to load content from server. Using default content.');
                setContent(
                    "Frequently Asked Questions\n\n" +
                    "Find answers to common questions about our products, services, and policies.\n\n" +
                    "Orders & Shipping:\n\n" +
                    "Q: How long does shipping take?\n" +
                    "A: Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.\n\n" +
                    "Q: Do you ship internationally?\n" +
                    "A: Yes, we ship to most countries worldwide. International shipping times vary by location.\n\n" +
                    "Returns & Exchanges:\n\n" +
                    "Q: What is your return policy?\n" +
                    "A: We accept returns within 30 days of purchase with original receipt and tags attached.\n\n" +
                    "Q: How do I exchange an item?\n" +
                    "A: Please contact our customer service team to initiate an exchange."
                );
            }
        };
        loadContent();
    }, []);

    const parseFAQsContent = (text) => {
        if (!text) return [];
        
        const lines = text.split('\n').filter(line => line.trim());
        const faqs = [];
        let currentCategory = 'General';
        let currentQuestion = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            

            if (line.endsWith(':') && line.length > 1) {
                currentCategory = line.slice(0, -1).trim();
            } 

            else if ((line.startsWith('Q:') || line.startsWith('Q.')) && line.length > 3) {
                if (currentQuestion) {
                    faqs.push(currentQuestion);
                }
                currentQuestion = {
                    category: currentCategory,
                    question: line.replace(/^Q[:.]\s*/, '').trim(),
                    answer: ''
                };
            } 

            else if ((line.startsWith('A:') || line.startsWith('A.')) && currentQuestion) {
                currentQuestion.answer = line.replace(/^A[:.]\s*/, '').trim();
                

                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (!nextLine || 
                        nextLine.endsWith(':') || 
                        nextLine.startsWith('Q:') || 
                        nextLine.startsWith('Q.') ||
                        nextLine.startsWith('A:') || 
                        nextLine.startsWith('A.')) {
                        break;
                    }
                    currentQuestion.answer += '\n' + nextLine;
                    i = j; 
                }
                
                faqs.push(currentQuestion);
                currentQuestion = null;
            }

            else if (currentQuestion && !currentQuestion.answer && line) {
                currentQuestion.question += ' ' + line;
            }
        }
        
        return faqs;
    };

    const faqsData = parseFAQsContent(content);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    if (loading) {
        return <div className={styles['wrapper']}>Loading...</div>;
    }

    return (
        <div className={styles['wrapper']}>
            <Banner
                data={ banners.filter(banner => banner.page === 'faqs') }
            />
            <div className={styles['header']}>
                <ReturnButton />
                <h1>Frequently Asked Questions</h1>
            </div>
            
            <div className={styles['content']}>
                <p>Find answers to common questions about our products, services, and policies.</p>
                
                {faqsData.length > 0 ? (
                    <div className={styles['faqs-container']}>
                        {Array.from(new Set(faqsData.map(faq => faq.category))).map((category, categoryIndex) => (
                            <div key={categoryIndex} className={styles['category']}>
                                <h2>{category}</h2>
                                <div className={styles['faqs-list']}>
                                    {faqsData
                                        .filter(faq => faq.category === category)
                                        .map((faq, faqIndex) => {
                                            const index = `${categoryIndex}-${faqIndex}`;
                                            return (
                                                <div key={index} className={styles['faq-item']}>
                                                    <button 
                                                        className={`${styles['faq-question']} ${activeIndex === index ? styles['active'] : ''}`}
                                                        onClick={() => toggleFAQ(index)}
                                                    >
                                                        {faq.question}
                                                        <span className={styles['icon']}>{activeIndex === index ? '−' : '+'}</span>
                                                    </button>
                                                    
                                                    <div className={`${styles['faq-answer']} ${activeIndex === index ? styles['active'] : ''}`}>
                                                        <p style={{whiteSpace: 'pre-line'}}>{faq.answer}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    
                    <div className={styles['faqs-container']}>
                        <div className={styles['category']}>
                            <h2>Orders & Shipping</h2>
                            <div className={styles['faqs-list']}>
                                <div className={styles['faq-item']}>
                                    <button 
                                        className={`${styles['faq-question']} ${activeIndex === '0-0' ? styles['active'] : ''}`}
                                        onClick={() => toggleFAQ('0-0')}
                                    >
                                        How long does shipping take?
                                        <span className={styles['icon']}>{activeIndex === '0-0' ? '−' : '+'}</span>
                                    </button>
                                    {activeIndex === '0-0' && (
                                        <div className={`${styles['faq-answer']} ${styles['active']}`}>
                                            <p>Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.</p>
                                        </div>
                                    )}
                                </div>
                                <div className={styles['faq-item']}>
                                    <button 
                                        className={`${styles['faq-question']} ${activeIndex === '0-1' ? styles['active'] : ''}`}
                                        onClick={() => toggleFAQ('0-1')}
                                    >
                                        Do you ship internationally?
                                        <span className={styles['icon']}>{activeIndex === '0-1' ? '−' : '+'}</span>
                                    </button>
                                    {activeIndex === '0-1' && (
                                        <div className={`${styles['faq-answer']} ${styles['active']}`}>
                                            <p>Yes, we ship to most countries worldwide. International shipping times vary by location.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className={styles['support-section']}>
                    <h2>Still have questions?</h2>
                    <p>Contact our customer support team for assistance.</p>
                    <Button
                        type='primary'
                        label='Get Help'
                        action={() => navigate('/contact-us')}
                        externalStyles={styles['support-button']}
                    />
                </div>
            </div>
        </div>
    );
};

export default FAQs;