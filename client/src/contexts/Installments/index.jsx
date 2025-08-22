import { useContext, useState, useEffect } from "react";
import InstallmentsContext from "./context";
import { useAuth, useToast } from '@contexts';

export const InstallmentsProvider = ({ children }) => {
    const [pendingInstallments, setPendingInstallments] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchPendingCount = async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            const response = await fetch('/api/installments/pending/count');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch installments count');
            }
            
            setPendingCount(data.count);
        } catch (error) {
            console.error("Error fetching pending installments count:", error);
            showToast("Failed to load installments data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingInstallments = async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            const response = await fetch('/api/installments/pending');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch installments');
            }
            
            setPendingInstallments(data);
        } catch (error) {
            console.error("Error fetching pending installments:", error);
            showToast("Failed to load installments data", "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    const processInstallment = async (installmentId) => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`/api/installments/${installmentId}/process`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    admin_id: user.account_id,
                    status: 'completed'
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to process installment');
            }
            
            setPendingInstallments(prev => 
                prev.filter(item => item.installment_id !== installmentId)
            );
            setPendingCount(prev => prev - 1);
            
            showToast('Installment processed successfully', 'success');
            return true;
        } catch (error) {
            console.error("Error processing installment:", error);
            showToast(`Failed to process installment: ${error.message}`, "error");
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (user && user.account_id) {
            fetchPendingCount();
            fetchPendingInstallments();
        }
    }, [user]);

    return (
        <InstallmentsContext.Provider value={{
            pendingInstallments,
            pendingCount,
            isLoading,
            fetchPendingCount,
            fetchPendingInstallments,
            processInstallment
        }}>
            {children}
        </InstallmentsContext.Provider>
    );
};

export const useInstallments = () => useContext(InstallmentsContext);