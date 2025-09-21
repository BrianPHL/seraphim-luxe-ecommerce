import { useState, useContext } from 'react';
import CMSContext from './context';
import { fetchWithTimeout } from '@utils';

export const CMSProvider = ({ children }) => {
    const [ staticPages, setStaticPages ] = useState({});
    const [ loading, setLoading ] = useState(false);

    const fetchAllPages = async () => {
    
        setLoading(true);
    
        try {
            
            const response = fetchWithTimeout('/api/cms');
            const data = await response.json();
            
            return json.data;

        } catch (err) {

            console.error("CMSContext fetchAllPages function error: ", err);

        } finally {
            setLoading(false);
        }
    
    };

    const fetchSpecificPage = async (pageSlug) => {
        
        setLoading(true);
        
        try {
            const response = await fetchWithTimeout(`/api/cms/${ pageSlug }`);
            const data = await response.json();

            setStaticPages(prev => ({ ...prev, [pageSlug]: data.data }));
            return data.data;

        } catch (err) {

            console.error("CMSContext fetchSpecificPage function error: ", err);

        } finally {
            setLoading(false);
        }
    };

    const updateSpecificPage = async (pageSlug, { title, content }) => {
        
        setLoading(true);
        
        try {
            const response = await fetchWithTimeout(`/api/cms/${ pageSlug }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            });
            const data = await response.json();

            await fetchSpecificPage(pageSlug);
            return data;

        } catch (err) {

            console.error("CMSContext updateSpecificPage function error: ", err);

        } finally {
            setLoading(false);
        }
    };

    return (
        <CMSContext.Provider value={{
            staticPages,
            loading,
            fetchAllPages,
            fetchSpecificPage,
            updateSpecificPage,
        }}>
            { children }
        </CMSContext.Provider>
    );
};

export const useCMS = () => useContext(CMSContext);