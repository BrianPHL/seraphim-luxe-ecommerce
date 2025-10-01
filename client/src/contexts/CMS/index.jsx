import { useCallback, useContext, useEffect, useState } from "react";
import { fetchWithTimeout } from '@utils';
import CMSContext from "./context";

export const CMSProvider = ({ children }) => {
    const [pages, setPages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const defaultContent = {
        home: "FEATURED_TITLE: Featured Products\n\n" +
            "FEATURED_DESC: Discover our handpicked selection of standout pieces, carefully chosen for their exceptional quality and style.\n\n" +
            "BESTSELLERS_TITLE: Best Sellers\n\n" +
            "BESTSELLERS_DESC: Shop our most popular items loved by customers worldwide for their quality and timeless appeal.\n\n" +
            "NEWARRIVALS_TITLE: New Arrivals\n\n" +
            "NEWARRIVALS_DESC: Be the first to discover our latest additions – fresh styles and trending pieces just added to our collection.\n\n" +
            "TRUST_TITLE: Why Style Enthusiasts Trust Seraphim Luxe\n\n" +
            "TRUST_DESC: At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality. Whether you're expressing your daily style or seeking the perfect statement piece, we've got what you need to make every look elegant and authentic.\n\n" +
            "TRUST_CARD1_ICON: fa-solid fa-truck\n" +
            "TRUST_CARD1_TITLE: Fast Delivery\n" +
            "TRUST_CARD1_DESC: Get your accessories delivered quickly and securely anywhere in the Philippines.\n\n" +
            "TRUST_CARD2_ICON: fa-solid fa-star\n" +
            "TRUST_CARD2_TITLE: Quality Guaranteed\n" +
            "TRUST_CARD2_DESC: Every piece is carefully selected and quality-tested for durability and style.\n\n" +
            "TRUST_CARD3_ICON: fa-solid fa-headset\n" +
            "TRUST_CARD3_TITLE: Expert Support\n" +
            "TRUST_CARD3_DESC: Our team is ready to help you find the perfect pieces for your unique style.",

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

    const fetchCMSContent = useCallback(async () => {
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
            console.error('Error loading CMS content:', error);
            setError('Failed to load content from server. Using default content.');
            setPages(defaultContent);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAllPages = useCallback(async () => {
        return await fetchCMSContent();
    }, [fetchCMSContent]);

    const fetchSpecificPage = useCallback(async (pageSlug) => {
        
        try {

            const response = await fetchWithTimeout(`/api/cms/${pageSlug}`);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const responseData = await response.json();
            const pageContent = responseData.content || responseData;

            setPages(prev => ({ 
                ...prev, 
                [pageSlug]: pageContent 
            }));

            return pageContent;

        } catch (error) {
            console.error(`Error fetching ${pageSlug} page:`, error);
            // Return default content for the page if available
            const defaultPageContent = defaultContent[pageSlug];
            if (defaultPageContent) {
                setPages(prev => ({ 
                    ...prev, 
                    [pageSlug]: defaultPageContent 
                }));
                return defaultPageContent;
            }
            throw error;
        }
    }, [defaultContent]);

    const updatePage = async (pageSlug, content, title) => {
        try {
            const response = await fetchWithTimeout(`/api/cms/${pageSlug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content,
                    title: title
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const updatedPages = { ...pages, [pageSlug]: content };
            setPages(updatedPages);
            return true;
        } catch (err) {
            console.error('Error updating CMS content:', err);
            throw err;
        }
    };

    const updateSpecificPage = useCallback(async (pageSlug, content, title) => {
        return await updatePage(pageSlug, content, title);
    }, [updatePage]);

    // Parse home content into usable sections
    const parseHomeContent = useCallback((homeContent) => {
        if (!homeContent) return {};

        const lines = homeContent.split('\n\n');
        const parsed = {};

        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                parsed[key.trim()] = value;
            }
        });

        return parsed;
    }, []);

    // Helper function to get CMS text with fallback
    const getCMSText = useCallback((key, fallback) => {
        const homeContent = parseHomeContent(pages.home);
        return homeContent[key] || fallback;
    }, [pages.home, parseHomeContent]);

    useEffect(() => {
        fetchCMSContent();
    }, [fetchCMSContent]);

    return (
        <CMSContext.Provider value={{
            // Data
            pages,
            loading,
            error,

            // Functions
            fetchCMSContent,
            fetchAllPages,
            fetchSpecificPage,
            updatePage,
            updateSpecificPage,
            getCMSText,
            parseHomeContent: () => parseHomeContent(pages.home),

            homeContent: pages.home || '',
            aboutContent: pages.about || '',
            contactContent: pages.contact || '',
            faqsContent: pages.faqs || '',
            privacyContent: pages.privacy || ''
        }}>
            {children}
        </CMSContext.Provider>
    );
};

export const useCMS = () => useContext(CMSContext);
