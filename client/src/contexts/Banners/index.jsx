import { useCallback, useContext, useEffect, useState } from "react";
import { useAuth, useToast } from '@contexts';
import { fetchWithTimeout } from "@utils";
import BannersContext from './context';

export const BannersProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const [ banners, setBanners ] = useState([]);
    const [ loading, setLoading ] = useState(true);

    const fetchBanners = useCallback(async () => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/banners/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch banners!");

            const data = await response.json();

            setBanners(data.banners || []);

        } catch (err) {

            console.error("Banners context fetchBanners function error: ", err);

        } finally {
            setLoading(false);
        }

    }, []);

    const removeSpecificBanner = async (page) => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/banners/reset/${ page }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error(`Failed to remove ${ page } banner!`);

            const data = await response.json();

            await fetchBanners();

        } catch (err) {

            console.error("Banners context removeSpecificBanner function error: ", err);

        } finally {
            setLoading(false);
        }

    };

    const modifySpecificBanner = async (page, image_url) => {
        try {

            setLoading(true);

            const doesImageExist = await fetchWithTimeout(image_url, { method: 'HEAD' });

            if (!doesImageExist.ok || (doesImageExist.status >= 300 && doesImageExist.status < 400)) {
                showToast('The Image URL you\'ve set does not exist, using placeholder image as fallback.', 'error');
                removeSpecificBanner(page);
                return;
            };

            const response = await fetchWithTimeout(`/api/cms/banners/modify/${ page }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: image_url })
            });

            if (!response.ok)
                throw new Error(`Failed to modify ${ page } banner!`);

            const data = await response.json();

            await fetchBanners();

        } catch (err) {

            console.error("Banners context modifySpecificBanner function error: ", err);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners()
    }, [ user ]);

    return (
        <BannersContext.Provider value={{
            
            // Data
            banners,

            // Functions
            fetchBanners,
            modifySpecificBanner,
            removeSpecificBanner

        }}>
            { children }
        </BannersContext.Provider>
    );

};

export const useBanners = () => useContext(BannersContext);
