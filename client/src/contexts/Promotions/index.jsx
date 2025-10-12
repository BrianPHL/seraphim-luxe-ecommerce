import { useCallback, useContext, useEffect, useState } from "react";
import { useAuth, useToast } from '@contexts';
import { fetchWithTimeout } from "@utils";
import PromotionsContext from './context';

export const PromotionsProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const [ promotions, setPromotions ] = useState([]);
    const [ loading, setLoading ] = useState(true);

    const fetchPromotions = useCallback(async () => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/promotions/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to fetch promotions!");

            const data = await response.json();

            setPromotions(data.promotions || []);

        } catch (err) {

            console.error("Promotions context fetchPromotions function error: ", err);

        } finally {
            setLoading(false);
        }

    }, []);

    const addPromotion = async (data) => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/promotions/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok)
                throw new Error("Failed to add promotion");

            await fetchPromotions();
            showToast('Promotion updated successfully!', 'success');
            return true;

        } catch (err) {

            console.error("Promotions context addPromotions function error: ", err);
            showToast('Failed to create promotion', 'error');
            return false;

        } finally {
            setLoading(false);
        }

    };

    const modifySpecificPromotion = async (id, data) => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/promotions/modify/${ id }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok)
                throw new Error("Failed to modify promotion");

            await fetchPromotions();
            showToast('Promotion updated successfully!', 'success');
            return true;

        } catch (err) {

            console.error("Promotions context modifySpecificPromotion function error: ", err);
            showToast('Failed to update promotion', 'error');
            return false;

        } finally {
            setLoading(false);
        }

    };

    const toggleSpecificPromotion = async (id, state) => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/promotions/${ id }/toggle-availability/${ state }`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to toggle availability of promotion");

            await fetchPromotions();
            showToast(`Promotion ${ state === 1 ? 'activated' : 'deactivated' } successfully!`, 'success');
            return true;

        } catch (err) {

            console.error("Promotions context toggleSpecificPromotion function error: ", err);
            showToast('Failed to toggle promotion status', 'error');
            return false;

        } finally {
            setLoading(false);
        }

    };

    const removeSpecificPromotion = async (id) => {

        try {

            setLoading(true);

            const response = await fetchWithTimeout(`/api/cms/promotions/remove/${ id }`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok)
                throw new Error("Failed to remove promotion");

            await fetchPromotions();
            showToast('Promotion deleted successfully!', 'success');
            return true;

        } catch (err) {

            console.error("Promotions context removeSpecificPromotion function error: ", err);
            showToast('Failed to delete promotion', 'error');
            return false;

        } finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        fetchPromotions()
    }, [ user ]);

    return (
        <PromotionsContext.Provider value={{
            
            // Data
            promotions,

            // Functions
            fetchPromotions,
            addPromotion,
            modifySpecificPromotion,
            toggleSpecificPromotion,
            removeSpecificPromotion

        }}>
            { children }
        </PromotionsContext.Provider>
    );

};

export const usePromotions = () => useContext(PromotionsContext);
