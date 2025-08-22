import { useContext, useState, useRef, useEffect } from "react";
import { useAuth, useToast, useProducts } from '@contexts';
import ReservationContext from "./context";

export const ReservationProvider = ({ children }) => {
    const [ reservationItems, setReservationItems ] = useState([]);
    const [ loading, setLoading ] = useState(false);
    const [ recentReservations, setRecentReservations ] = useState([]);
    const [ pendingReservationsCount, setPendingReservationsCount ] = useState(0);
    const [installmentRequests, setInstallmentRequests] = useState([]);
    const [pendingInstallmentsCount, setPendingInstallmentsCount] = useState(0);
    const { user } = useAuth();
    const { refreshProducts } = useProducts();
    const { showToast } = useToast();
    const reservationCounter = useRef(1);

    const fetchReservations = async () => {
        if (!user) return;

        try {
            setLoading(true);
            
            const response = await fetch(`/api/reservations/${user.account_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch reservations!');
            }
            
            setReservationItems(data || []);
        } catch (err) {
            console.error("Failed to fetch reservations:", err);
            showToast(`Failed to load your reservations: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentReservations = async () => {
        if (!user) return;
        
        try {
            const response = await fetch('/api/reservations/recent', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch recent reservations');
            }
            
            setRecentReservations(data);
            const pendingCount = data.filter(r => r.status === 'pending').length;
            setPendingReservationsCount(pendingCount);
            
            return data;
        } catch (error) {
            console.error('Error fetching recent reservations:', error);
            return [];
        }
    };

    const fetchInstallmentRequests = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            
            const response = await fetch(`/api/installments/${user.account_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch installment requests!');
            }
            
            setInstallmentRequests(data || []);
        } catch (err) {
            console.error("Failed to fetch installment requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingInstallmentsCount = async () => {
        if (!user || user.role !== 'admin') return;
        
        try {
            const response = await fetch('/api/installments/pending/count');
            const data = await response.json();
            
            if (response.ok) {
                setPendingInstallmentsCount(data.count);
            }
        } catch (error) {
            console.error("Error fetching pending installments count:", error);
        }
    };

    const addToReservations = async (item) => {
        if (!user) {
            showToast("You must be logged in to make reservations.", "error");
            return { error: "Not authenticated" };
        }

        try {
            setLoading(true);

            const products = Array.isArray(item.products)
                ? item.products
                : item.product
                    ? [item.product]
                    : [];

            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: user.account_id,
                    preferred_date: item.preferredDate,
                    notes: item.notes,
                    products: products,
                    payment_method: item.paymentMethod || 'cash',
                    installment_details: item.installmentDetails
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create reservation!');
            }
            
            await fetchReservations();
            
            if (item.paymentMethod === 'cash_installment') {
                await fetchInstallmentRequests();
                showToast(`Your installment request has been submitted for approval!`, "success");
            } else {
                showToast(`Successfully added to your reservations!`, "success");
            }
            
            refreshProducts();
            
            return { success: true, reservation_id: data.reservation_id };
        } catch (err) {
            console.error("Failed to add reservation:", err);
            showToast(`Failed to add reservation: ${err.message}`, "error");
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const cancelReservation = async (reservation_id) => {
        if (!user) return;

        try {
            setLoading(true);
            
            const response = await fetch(`/api/reservations/${reservation_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'cancelled',
                    admin_id: user['account_id']
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to cancel reservation!');
            }
            
            setReservationItems(prev => 
                prev.map(item => 
                    item.reservation_id === reservation_id 
                    ? { ...item, status: 'cancelled' } 
                    : item
                )
            );
            
            showToast("Reservation cancelled successfully!", "success");
            refreshProducts();

        } catch (err) {
            console.error("Failed to cancel reservation:", err);
            showToast(`Failed to cancel reservation: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const reactivateReservation = async (reservation_id) => {

        if (!user) return;

        try {
            setLoading(true);

            const response = await fetch(`/api/reservations/${reservation_id}/reactivate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: user['account_id']
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reactivate reservation!');
            }

            const updatedResponse = await fetch(`/api/reservations/${user.account_id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!updatedResponse.ok) {
                throw new Error('Failed to fetch updated reservation status');
            }

            const updatedReservations = await updatedResponse.json();
            const reactivatedReservation = updatedReservations.find(
                res => res.reservation_id === parseInt(reservation_id)
            );

            if (!reactivatedReservation) {
                throw new Error('Could not find the reactivated reservation');
            }
            
            const newStatus = reactivatedReservation.status;

            setReservationItems(prev => 
                prev.map(item => 
                    item.reservation_id === reservation_id 
                    ? { ...item, status: newStatus } 
                    : item
                )
            );

            if (recentReservations) {
                setRecentReservations(prev => 
                    prev.map(item => 
                        item.reservation_id === reservation_id 
                        ? { ...item, status: newStatus } 
                        : item
                    )
                );
            }

            if (newStatus === 'pending') {
                setPendingReservationsCount(prev => prev + 1);
            }

            showToast("Reservation reactivated successfully!", "success");
            refreshProducts();
            return true;

        } catch (err) {
            console.error("Failed to reactivate reservation:", err);
            showToast(`Failed to reactivate reservation: ${err.message}`, "error");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteReservation = async (reservation_id) => {
        if (!user) return;

        try {
            setLoading(true);

            const response = await fetch(`/api/reservations/${reservation_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete reservation!');
            }
            
            setReservationItems(prev => 
                prev.filter(item => item.reservation_id !== reservation_id)
            );

            if (recentReservations) {
                setRecentReservations(prev => 
                    prev.filter(item => item.reservation_id !== reservation_id)
                );
            }

            showToast("Reservation deleted successfully!", "success");
            refreshProducts();
            return true;
            
        } catch (err) {
            console.error("Failed to delete reservation:", err);
            showToast(`Failed to delete reservation: ${err.message}`, "error");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const processInstallment = async (installmentId, status, notes) => {
        if (!user || user.role !== 'admin') return false;
        
        try {
            setLoading(true);
            
            const response = await fetch(`/api/installments/${installmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    admin_id: user.account_id,
                    notes
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to ${status} installment!`);
            }
            
            showToast(`Installment ${status === 'completed' ? 'approved' : 'rejected'} successfully!`, "success");
            refreshProducts();
            return true;
        } catch (err) {
            console.error(`Failed to process installment:`, err);
            showToast(`Failed to process installment: ${err.message}`, "error");
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.account_id) {
            fetchReservations();
        }
    }, [user]);

    return (
        <ReservationContext.Provider value={{ 
            reservationItems,
            recentReservations,
            pendingReservationsCount,
            installmentRequests,
            pendingInstallmentsCount,
            fetchRecentReservations,
            fetchPendingInstallmentsCount,
            addToReservations,
            cancelReservation,
            reactivateReservation,
            deleteReservation,
            processInstallment,
            refreshReservations: fetchReservations,
            refreshInstallmentRequests: fetchInstallmentRequests
        }}>
            { children }
        </ReservationContext.Provider>
    );
};

export const useReservation = () => useContext(ReservationContext);
