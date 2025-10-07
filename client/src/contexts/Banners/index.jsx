import { useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from '@contexts';
import { fetchWithTimeout } from "@utils";
import BannersContext from './context';

export const BannersProvider = ({ children }) => {

    const { user } = useAuth();
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

    const fetchSpecificBanner = async (page) => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/banners/${ page }`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error(`Failed to fetch ${ page } banner!`);

            const data = await response.json();

            setBanners(data || []);

        } catch (err) {

            console.error("Banners context fetchSpecificBanner function error: ", err);

        } finally {
            setLoading(false);
        }

    };

    const modifySpecificBanner = async () => {
        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/banners/${ page }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error(`Failed to modify ${ page } banner!`);

            const data = await response.json();

            setBanners(data || []);

        } catch (err) {

            console.error("Banners context modifySpecificBanner function error: ", err);

        } finally {
            setLoading(false);
        }
    };

    const removeSpecificBanner = async () => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/banners/${ page }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error(`Failed to remove ${ page } banner!`);

            const data = await response.json();

            setBanners(data || []);

        } catch (err) {

            console.error("Banners context removeSpecificBanner function error: ", err);

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
            fetchSpecificBanner,
            modifySpecificBanner,
            removeSpecificBanner

        }}>
            { children }
        </BannersContext.Provider>
    );

};

export const useBanners = () => useContext(BannersContext);
