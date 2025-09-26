import { useContext, useState, useEffect, useCallback } from 'react';
import SettingsContext from './context';
import { useAuth } from '../Auth';
import { useAuditTrail } from '../AuditTrail';

export const SettingsProvider = ({ children, auditLoggers = {} }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        currency: 'PHP',
        preferred_shipping_address: 'home',
        preferred_payment_method: 'cash_on_delivery'
    });
    const [ enabledPaymentMethods, setEnabledPaymentMethods ] = useState([]);
    const [loading, setLoading] = useState(false);
    const { logProfilePreferences } = auditLoggers;

    const updateSettings = async (newSettings) => {
        if (!user?.id) return { error: 'User not logged in' };

        const oldSettings = { ...settings };
        setLoading(true);
        try {
            const response = await fetch(`/api/user-settings/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(newSettings)
            });
            
            if (response.ok) {
                const result = await response.json();
                const updatedSettings = result.settings || result;
                setSettings(updatedSettings);

                // Log the preferences update with user info
                if (logProfilePreferences) {
                    await logProfilePreferences(
                        oldSettings,
                        newSettings,
                        {
                            user_id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                            role: user.role
                        }
                    );
                }

                return { success: true };
            } else {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }
                
                return { error: errorData.error || 'Failed to update settings' };
            }
        } catch (error) {
            console.error('Network error updating settings:', error);
            return { error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const [exchangeRates, setExchangeRates] = useState({
        PHP: 1,
        USD: 0.018,
        EUR: 0.016,
        JPY: 2.70,   
        CAD: 0.024   
    });

    const fetchExchangeRates = async () => {
        try {
            const rates = {
                PHP_TO_USD: 0.018,
                PHP_TO_EUR: 0.016,
                PHP_TO_JPY: 2.70,
                PHP_TO_CAD: 0.024,
                
                USD_TO_PHP: 55.56,
                USD_TO_EUR: 0.89,
                USD_TO_JPY: 150.00,
                USD_TO_CAD: 1.35,
                
                EUR_TO_PHP: 62.50,
                EUR_TO_USD: 1.12,
                EUR_TO_JPY: 168.50,
                EUR_TO_CAD: 1.51,
                
                JPY_TO_PHP: 0.37,
                JPY_TO_USD: 0.0067,
                JPY_TO_EUR: 0.0059,
                JPY_TO_CAD: 0.009,
                
                CAD_TO_PHP: 41.67,
                CAD_TO_USD: 0.74,
                CAD_TO_EUR: 0.66,
                CAD_TO_JPY: 111.11
            };
            
            setExchangeRates({
                PHP: 1,
                USD: rates.PHP_TO_USD,
                EUR: rates.PHP_TO_EUR,
                JPY: rates.PHP_TO_JPY,
                CAD: rates.PHP_TO_CAD
            });
        } catch (error) {
            setExchangeRates({
                PHP: 1,
                USD: 0.018,
                EUR: 0.016,
                JPY: 2.70,
                CAD: 0.024
            });
        }
    };

    const convertPrice = useCallback(async (price, targetCurrency) => {
        try {
            const numPrice = Number(price);
            if (isNaN(numPrice)) return price;

            const fromCurrency = 'PHP';
            const toCurrency = targetCurrency?.toUpperCase();

            if (fromCurrency === toCurrency) {
                return numPrice;
            }

            let convertedPrice;

            if (fromCurrency === 'PHP') {
                switch (toCurrency) {
                    case 'USD':
                        convertedPrice = numPrice * 0.018;
                        break;
                    case 'EUR':
                        convertedPrice = numPrice * 0.016;
                        break;
                    case 'JPY':
                        convertedPrice = numPrice * 2.70;
                        break;
                    case 'CAD':
                        convertedPrice = numPrice * 0.024;
                        break;
                    default:
                        convertedPrice = numPrice;
                }
            }

            if (toCurrency === 'JPY') {
                return Math.round(convertedPrice);
            }

            return Math.round(convertedPrice * 100) / 100; 

        } catch (error) {
            console.error('Currency conversion error:', error);
            return price; 
        }
    }, []);

    const formatPrice = useCallback((price, currency = null) => {
        try {
            const numPrice = Number(price);
            if (isNaN(numPrice)) {
                return 'Price unavailable';
            }

            const currentCurrency = currency || settings?.currency || 'PHP';
            
            switch (currentCurrency?.toUpperCase()) {
                case 'USD':
                    return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(numPrice);
                    
                case 'EUR':
                    return new Intl.NumberFormat('en-EU', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(numPrice);
                    
                case 'JPY':
                    return new Intl.NumberFormat('ja-JP', {
                        style: 'currency',
                        currency: 'JPY',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(numPrice);
                    
                case 'CAD':
                    return new Intl.NumberFormat('en-CA', {
                        style: 'currency',
                        currency: 'CAD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(numPrice);
                    
                case 'PHP':
                default:
                    return new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(numPrice);
            }
        } catch (error) {
            console.error('Error formatting price:', error);
            const currentCurrency = currency || settings?.currency || 'PHP';
            return `${currentCurrency} ${Number(price).toFixed(2)}`;
        }
    }, [ settings?.currency ]);

    const fetchSettings = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            
            const response = await fetch(`/api/user-settings/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else {
                console.error('Failed to fetch settings, using defaults');
                setSettings({
                    currency: 'PHP',
                    preferred_shipping_address: 'home',
                    preferred_payment_method: 'cash_on_delivery'
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setSettings({
                currency: 'PHP',
                preferred_shipping_address: 'home',
                preferred_payment_method: 'cash_on_delivery'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchEnabledPaymentMethods = async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                setEnabledPaymentMethods(data.paymentMethods || {});
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchExchangeRates();
    }, [user?.id]);

    const value = {
        settings,
        updateSettings,
        loading,
        fetchSettings,
        convertPrice,
        formatPrice,
        exchangeRates,
        fetchEnabledPaymentMethods,
        enabledPaymentMethods
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
