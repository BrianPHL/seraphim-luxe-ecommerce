import { useState, useEffect } from 'react';
import { ReturnButton, Banner } from '@components';
import { useCMS, useBanners } from '@contexts';
import styles from './AboutUs.module.css';

const AboutUs = () => {

    const { fetchSpecificPage, loading } = useCMS();
    const { banners } = useBanners();
    const [ content, setContent ] = useState('');
    const [ error, setError ] = useState(null);

    useEffect(() => {

        const loadContent = async () => {
            try {

                const pageData = await fetchSpecificPage('about');
                
                if (pageData && pageData.content) {
                    setContent(pageData.content);
                } else {
                    throw new Error('No content received from server');
                }

            } catch (error) {
                console.error('Error loading content:', error);
                setError('Failed to load content from server. Using default content.');
                
                setContent(
                    "Driven by Style, Fueled by Expression\n\n" +
                    "At Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. " +
                    "Whether you're expressing your daily style, making a statement, or seeking the perfect complement " +
                    "to your personality, our mission is to provide you with top-quality unisex jewelry and accessories " +
                    "to enhance your personal expression.\n\n" +
                    "Who We Are\n\n" +
                    "Founded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown " +
                    "into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, " +
                    "offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style " +
                    "shines at its best."
                );
            }
        };

        loadContent();
    }, []);

    const parseAboutContent = (text) => {
        if (!text) return [];
        
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        const sections = [];
        let currentSection = { title: '', content: '' };
        
        paragraphs.forEach(paragraph => {
            const isTitle = paragraph.length < 80 && 
                           !paragraph.endsWith('.') && 
                           !paragraph.endsWith('!') && 
                           !paragraph.endsWith('?');
            
            if (isTitle) {
                if (currentSection.title) {
                    sections.push(currentSection);
                }
                currentSection = { title: paragraph, content: '' };
            } else {
                if (currentSection.content) {
                    currentSection.content += ' ' + paragraph;
                } else {
                    currentSection.content = paragraph;
                }
            }
        });
        
        if (currentSection.title) {
            sections.push(currentSection);
        }
        
        return sections;
    };

    const aboutSections = parseAboutContent(content);

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            
            <Banner
                data={ banners.filter(banner => banner.page === 'about-us') }
            />
            
            <div className={styles.header}>
                <ReturnButton />
                <h1>About Seraphim Luxe</h1>
            </div>
            
            {error && (
                <div className={styles.errorBanner}>
                    <span>{error}</span>
                </div>
            )}
            
            <div className={styles.about}>
                {aboutSections.length > 0 ? (
                    aboutSections.map((section, index) => (
                        <section key={index} className={styles['info-section']}>
                            <h2>{section.title}</h2>
                            <div className={styles.divider}></div>
                            <p>{section.content}</p>
                        </section>
                    ))
                ) : (
                    <>
                        <section className={styles['info-section']}>
                            <h2>Driven by Style, Fueled by Expression</h2>
                            <div className={styles.divider}></div>
                            <p>At Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. Whether you're expressing your daily style, making a statement, or seeking the perfect complement to your personality, our mission is to provide you with top-quality unisex jewelry and accessories to enhance your personal expression.</p>
                        </section>
                        <section className={styles['info-section']}>
                            <h2>Who We Are</h2>
                            <div className={styles.divider}></div>
                            <p>Founded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style shines at its best.</p>
                        </section>
                    </>
                )}
            </div>

            <div className={styles['meet-the-team']}>
                <div className={styles.header}>
                    <h2>Meet the Team</h2>
                    <div className={styles.divider}></div>
                    <p>We are a team of style enthusiasts, designers, and customer support experts dedicated to giving you the best shopping experience possible. Every recommendation we make is backed by years of experience and a true passion for fashion and self-expression.</p>
                </div>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles['team-placeholder']}></div>
                        <div className={styles.info}>
                            <h3>Pasco, Brian Lawrence C.</h3>
                            <h4>Full-stack Developer & UI/UX Designer</h4>
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles['team-placeholder']}></div>
                        <div className={styles.info}>
                            <h3>Ramos, Gerald Elli T.</h3>
                            <h4>Leader & Front-end Developer</h4>
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles['team-placeholder']}></div>
                        <div className={styles.info}>
                            <h3>Erandio, Cymon Railey A.</h3>
                            <h4>Front-end Developer</h4>
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles['team-placeholder']}></div>
                        <div className={styles.info}>
                            <h3>Ganapin, Aidan</h3>
                            <h4>Front-end Developer</h4>
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles['team-placeholder']}></div>
                        <div className={styles.info}>
                            <h3>Soliven, Sean Calvin</h3>
                            <h4>Front-end Developer</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;