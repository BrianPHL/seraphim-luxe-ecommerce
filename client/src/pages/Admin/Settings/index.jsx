import { useState, useEffect } from 'react';
import { Button } from '@components';
import { useToast } from '@contexts';
import styles from './Settings.module.css';

const Settings = () => {
    const [hasPaymentChanges, setHasPaymentChanges] = useState(false);
    const [hasCurrencyChanges, setHasCurrencyChanges] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState({
        cash_on_delivery: true,
        bank_transfer: true,
        paypal: true,
        credit_card: false
    });
    const [availableCurrencies, setAvailableCurrencies] = useState({
        PHP: true,
        USD: true,
        EUR: true,
        JPY: true,
        CAD: true
    });
    const [customPaymentMethods, setCustomPaymentMethods] = useState([]);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [loadingCurrency, setLoadingCurrency] = useState(false);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [newPaymentMethod, setNewPaymentMethod] = useState({
        key: '',
        label: '',
        description: ''
    });
    const [loadingSettings, setLoadingSettings] = useState(false); 
    const [activeTab, setActiveTab] = useState('payment');
    const { showToast } = useToast();

    const paymentMethodLabels = {
        cash_on_delivery: "Cash on Delivery",
        bank_transfer: "Bank Transfer",
        paypal: "Paypal",
        credit_card: "Credit Card"
    };

    const paymentMethodDescriptions = {
        cash_on_delivery: "Pay when you receive your order",
        bank_transfer: "Direct bank account transfer",
        paypal: "Mobile payment through Paypal",
        credit_card: "Pay using credit or debit card"
    };

    const currencyLabels = {
        PHP: "Philippine Peso (₱)",
        USD: "US Dollar ($)",
        EUR: "Euro (€)",
        JPY: "Japanese Yen (¥)",
        CAD: "Canadian Dollar (C$)"
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoadingSettings(true);
            const response = await fetch('/api/admin/settings', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                setPaymentMethods(data.paymentMethods || paymentMethods);
                setCustomPaymentMethods(data.customPaymentMethods || []);
                setAvailableCurrencies(data.availableCurrencies || availableCurrencies);
            } else {
                showToast('Failed to fetch settings', 'error');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showToast('Error loading settings', 'error');
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleSavePaymentMethods = async () => {
        setLoadingPayment(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethods,
                    customPaymentMethods,
                    availableCurrencies
                })
            });
            if (response.ok) {
                showToast('Payment methods updated!', 'success');
                setHasPaymentChanges(false);
                fetchSettings();
            } else {
                showToast('Failed to update payment methods', 'error');
            }
        } catch (error) {
            showToast('Network error while saving payment methods', 'error');
        }
        setLoadingPayment(false);
    };

    const handleResetPaymentMethods = () => {
        fetchSettings();
        setHasPaymentChanges(false);
    };

    const handleSaveCurrencies = async () => {
        setLoadingCurrency(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethods,
                    customPaymentMethods,
                    availableCurrencies
                })
            });
            if (response.ok) {
                showToast('Currencies updated!', 'success');
                setHasCurrencyChanges(false);
                fetchSettings();
            } else {
                showToast('Failed to update currencies', 'error');
            }
        } catch (error) {
            showToast('Network error while saving currencies', 'error');
        }
        setLoadingCurrency(false);
    };

    const handleResetCurrencies = () => {
        fetchSettings();
        setHasCurrencyChanges(false);
    };

    const handlePaymentMethodToggle = (method) => {
        setPaymentMethods(prev => ({
            ...prev,
            [method]: !prev[method]
        }));
        setHasPaymentChanges(true); 
    };

    const handleCustomPaymentToggle = (method) => {
        setCustomPaymentMethods(prev => 
            prev.map(pm => 
                pm.key === method 
                    ? { ...pm, enabled: !pm.enabled }
                    : pm
            )
        );
        setHasPaymentChanges(true);
    };

    const handleCurrencyToggle = (currency) => {
        setAvailableCurrencies(prev => ({
            ...prev,
            [currency]: !prev[currency]
        }));
        setHasCurrencyChanges(true);
    };

    const handleAddPaymentMethod = async () => {
        if (!newPaymentMethod.key || !newPaymentMethod.label) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const keyExists = customPaymentMethods.some(pm => pm.key === newPaymentMethod.key) || Object.keys(paymentMethods).includes(newPaymentMethod.key);
        
        if (keyExists) {
            showToast('Payment method key already exists', 'error');
            return;
        }

        const newMethod = {
            ...newPaymentMethod,
            enabled: true,
            is_custom: true
        };

        setCustomPaymentMethods(prev => [...prev, newMethod]);
        setNewPaymentMethod({ key: '', label: '', description: '' });
        setShowAddPaymentModal(false);
        setHasPaymentChanges(true);
        showToast('Payment method added successfully', 'success');
    };

    const handleDeleteCustomPayment = (methodKey) => {
        setCustomPaymentMethods(prev => prev.filter(pm => pm.key !== methodKey));
        setHasPaymentChanges(true);
        showToast('Payment method removed', 'success');
    };

    return (
        <div className={styles['wrapper']}>
            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Settings and Configurations</h2>
                    <p>Manage your platform settings and configurations</p>
                </div>

                <div className={styles['settingsTabs']}>
                    <Button
                        type="secondary"
                        label="Payment Methods"
                        externalStyles={`${styles['tabButton']} ${activeTab === 'payment' ? styles['active'] : ''}`}
                        action={() => setActiveTab('payment')}
                    />
                    <Button
                        type="secondary"
                        label="Available Currencies"
                        externalStyles={`${styles['tabButton']} ${activeTab === 'currency' ? styles['active'] : ''}`}
                        action={() => setActiveTab('currency')}
                    />
                </div>

                <div className={styles['settings-container']}>
                    {activeTab === 'payment' && (
                        <div className={styles['settings-section']}>
                            <div className={styles['settings-section-header']}>
                                <h3>Payment Methods</h3>
                                <p>Enable or disable payment methods available to customers</p>
                                <Button
                                    type="primary"
                                    label="Add Custom Payment Method"
                                    action={() => setShowAddPaymentModal(true)}
                                />
                            </div>

                            <div className={styles['payment-methods-grid']}>
                                {Object.entries(paymentMethods)
                                    .filter(([method]) => paymentMethodLabels[method]) 
                                    .map(([method, isEnabled]) => (
                                        <div key={method} className={styles['payment-method-card']}>
                                            <div className={styles['payment-method-header']}>
                                                <div className={styles['payment-method-info']}>
                                                    <h4>{paymentMethodLabels[method]}</h4>
                                                    <p>{paymentMethodDescriptions[method]}</p>
                                                </div>
                                                <div className={styles['toggle-container']}>
                                                    <label className={styles['toggle-switch']}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isEnabled}
                                                            onChange={() => handlePaymentMethodToggle(method)}
                                                            disabled={loadingSettings || loadingPayment}
                                                        />
                                                        <span className={styles['toggle-slider']}></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={styles['payment-method-status']}>
                                                <span className={`${styles['status-badge']} ${isEnabled ? styles['enabled'] : styles['disabled']}`}>
                                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                }

                                {customPaymentMethods.map((method) => (
                                    <div key={method.key} className={styles['payment-method-card']}>
                                        <div className={styles['payment-method-header']}>
                                            <div className={styles['payment-method-info']}>
                                                <h4>{method.label}</h4>
                                                <p>{method.description}</p>
                                            </div>
                                            <div className={styles['toggle-container']}>
                                                <Button
                                                    type="icon"
                                                    icon="fa-solid fa-trash"
                                                    action={() => handleDeleteCustomPayment(method.key)}
                                                    externalStyles={styles['delete-btn']}
                                                />
                                                <label className={styles['toggle-switch']}>
                                                    <input
                                                        type="checkbox"
                                                        checked={method.enabled}
                                                        onChange={() => handleCustomPaymentToggle(method.key)}
                                                        disabled={loadingSettings || loadingPayment}
                                                    />
                                                    <span className={styles['toggle-slider']}></span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className={styles['payment-method-status']}>
                                            <span className={`${styles['status-badge']} ${method.enabled ? styles['enabled'] : styles['disabled']}`}>
                                                {method.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                            <span className={styles['custom-badge']}>Custom</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles['settings-actions']}>
                                <Button
                                    type="secondary"
                                    label="Reset Changes"
                                    action={handleResetPaymentMethods}
                                    disabled={!hasPaymentChanges || loadingPayment || loadingSettings}
                                />
                                <Button
                                    type="primary"
                                    label={loadingPayment ? 'Saving...' : 'Save Settings'}
                                    action={handleSavePaymentMethods}
                                    disabled={!hasPaymentChanges || loadingPayment || loadingSettings}
                                />
                            </div>                        
                        </div>
                    )}

                    {activeTab === 'currency' && (
                        <div className={styles['settings-section']}>
                            <div className={styles['settings-section-header']}>
                                <h3>Available Currencies</h3>
                                <p>Select which currencies users can choose from in their settings</p>
                            </div>

                            <div className={styles['currency-grid']}>
                                {Object.entries(availableCurrencies).map(([currency, isEnabled]) => (
                                    <div key={currency} className={styles['currency-card']}>
                                        <div className={styles['currency-header']}>
                                            <div className={styles['currency-info']}>
                                                <h4>{currencyLabels[currency]}</h4>
                                            </div>
                                            <div className={styles['toggle-container']}>
                                                <label className={styles['toggle-switch']}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isEnabled}
                                                        onChange={() => handleCurrencyToggle(currency)}
                                                        disabled={loadingSettings || loadingCurrency}
                                                    />
                                                    <span className={styles['toggle-slider']}></span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className={styles['currency-status']}>
                                            <span className={`${styles['status-badge']} ${isEnabled ? styles['enabled'] : styles['disabled']}`}>
                                                {isEnabled ? 'Available' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles['settings-actions']}>
                                <Button
                                    type="secondary"
                                    label="Reset Currencies"
                                    action={handleResetCurrencies}
                                    disabled={!hasCurrencyChanges || loadingCurrency || loadingSettings}
                                />
                                <Button
                                    type="primary"
                                    label={loadingCurrency ? 'Saving...' : 'Save Currencies'}
                                    action={handleSaveCurrencies}
                                    disabled={!hasCurrencyChanges || loadingCurrency || loadingSettings}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showAddPaymentModal && (
                <div className={styles['modal-overlay']}>
                    <div className={styles['modal']}>
                        <div className={styles['modal-header']}>
                            <h3>Add Custom Payment Method</h3>
                            <button 
                                className={styles['close-btn']}
                                onClick={() => setShowAddPaymentModal(false)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className={styles['modal-body']}>
                            <div className={styles['input-wrapper']}>
                                <label>Payment Method Key *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., paypal, stripe, etc."
                                    value={newPaymentMethod.key}
                                    onChange={(e) => setNewPaymentMethod(prev => ({
                                        ...prev,
                                        key: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                    }))}
                                />
                                <small>Used internally (lowercase, underscores only)</small>
                            </div>
                            <div className={styles['input-wrapper']}>
                                <label>Display Label *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., PayPal, Stripe"
                                    value={newPaymentMethod.label}
                                    onChange={(e) => setNewPaymentMethod(prev => ({
                                        ...prev,
                                        label: e.target.value
                                    }))}
                                />
                            </div>
                            <div className={styles['input-wrapper']}>
                                <label>Description</label>
                                <textarea
                                    placeholder="Brief description of the payment method"
                                    value={newPaymentMethod.description}
                                    onChange={(e) => setNewPaymentMethod(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                        <div className={styles['modal-footer']}>
                            <Button
                                type="secondary"
                                label="Cancel"
                                action={() => setShowAddPaymentModal(false)}
                            />
                            <Button
                                type="primary"
                                label="Add Payment Method"
                                action={handleAddPaymentMethod}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;