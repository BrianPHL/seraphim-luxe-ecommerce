import { useState, useEffect } from 'react';
import { InputField, Button, Anchor, ReturnButton, Accordion, Modal, Dropdown, Banner } from '@components';
import { useToast, useAuth, useSettings, useBanners, useNotifications } from '@contexts';
import { useOAuth } from '@hooks';
import { getErrorMessage } from '@utils';
import styles from './Profile.module.css';
import { useNavigate, useSearchParams } from 'react-router';

const Profile = ({}) => {

    const navigate = useNavigate();
    const { user, loading, logout, isUpdatingAvatar, isRemovingAvatar, updateAvatar, removeAvatar, updatePersonalInfo: updatePersonalInfoAPI, addressBook, getAddressBook, addAddress, updateAddress, deleteAddress, updatePassword: updatePasswordAPI, remove } = useAuth();
    const { settings, updateSettings, loading: settingsLoading } = useSettings();
    const { sendChangePasswordVerificationLink, changePassword } = useOAuth()
    const { banners } = useBanners();
    const { showToast } = useToast();
    const { 
        notificationPreferences, 
        hasNotificationChanges, 
        loadingNotifications,
        handleNotificationToggle,
        handleSaveNotifications,
        handleResetNotifications,
        notifyAccountChange
    } = useNotifications();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const [ avatarFile, setAvatarFile ] = useState(null);
    const [ avatarPreview, setAvatarPreview ] = useState(null);
    const [ modalType, setModalType ] = useState('');
    const [ addressToDelete, setAddressToDelete ] = useState(null);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ personalInfo, setPersonalInfo ] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: ''
    });
    const [ addressInfo, setAddressInfo ] = useState({
        shipping_address: {
            street: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Philippines'
        },
        billing_address: {
            street: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Philippines',
            same_as_shipping: false
        }
    });
    const [ passwordInfo, setPasswordInfo ] = useState({
        newPassword: '',
        confirmNewPassword: ''
    })
    
    const [ platformSettings, setPlatformSettings ] = useState({
        currency: 'PHP',
        preferred_shipping_address: 'home',
        preferred_payment_method: 'cash_on_delivery'
    });
    
    const [dropdownStates, setDropdownStates] = useState({
        currency: false,
        shipping_address: false,
        payment_method: false
    });

    const [ generalAddressInfo, setGeneralAddressInfo ] = useState({
        address: ''
    });

    const [ addNewAddressFormData, setAddNewAddressFormData ] = useState({
        full_name: '',
        phone_number: '',
        province: '',
        city: '',
        barangay: '',
        postal_code: '',
        street_address: '',
        is_default_billing: false,
        is_default_shipping: false,
    });

    const [ editAddressFormData, setEditAddressFormData ] = useState({
        id: '',
        full_name: '',
        phone_number: '',
        province: '',
        city: '',
        barangay: '',
        postal_code: '',
        street_address: '',
        is_default_billing: false,
        is_default_shipping: false,
    });

    const toggleDropdown = (dropdownName) => {
        setDropdownStates(prev => ({
            ...prev,
            [dropdownName]: !prev[dropdownName]
        }));
    };

    const closeAllDropdowns = () => {
        setDropdownStates({
            currency: false,
            shipping_address: false,
            payment_method: false
        });
    };

    const [ isPlatformSettingsChanged, setIsPlatformSettingsChanged ] = useState(false);
    const [ isPersonalInfoChanged, setIsPersonalInfoChanged ] = useState(false);
    const [ isAddressInfoChanged, setIsAddressInfoChanged ] = useState(false);
    const [ isPasswordInfoChanged, setIsPasswordInfoChanged ] = useState(false);
    const [ isPasswordSet, setIsPasswordSet ] = useState(false);
    const [ isGeneralAddressChanged, setIsGeneralAddressChanged ] = useState(false);
    const [ doPasswordsMatch, setDoPasswordsMatch ] = useState(true);
    const [ showPassword, setShowPassword ] = useState(false);
    const [ showConfirmPassword, setShowConfirmPassword ] = useState(false);
    const [ validationErrors, setValidationErrors ] = useState({});
    const [ isShippingAddressChanged, setIsShippingAddressChanged ] = useState(false);
    const [ isBillingAddressChanged, setIsBillingAddressChanged ] = useState(false);
    const [ shippingAddressErrors, setShippingAddressErrors ] = useState({});
    const [ billingAddressErrors, setBillingAddressErrors ] = useState({});
    const queryToken = searchParams.get('token') || null;
    const errorToken = searchParams.get('error') || null;

    const [availableCurrencies, setAvailableCurrencies] = useState({});
    const [enabledPaymentMethods, setEnabledPaymentMethods] = useState({});
    const [customPaymentMethods, setCustomPaymentMethods] = useState([]);

    useEffect(() => {
        fetchAvailableCurrencies();
    }, [settings]);

    const fetchAvailableCurrencies = async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableCurrencies(data.availableCurrencies || {});
                setEnabledPaymentMethods(data.paymentMethods || {});
                setCustomPaymentMethods(data.customPaymentMethods || []);
            }
        } catch (error) {
            console.error('Error fetching available currencies:', error);
        }
    };

    const currencyLabels = {
        PHP: 'Philippine Peso (₱)',
        USD: 'US Dollar ($)',
        EUR: 'Euro (€)',
        JPY: 'Japanese Yen (¥)',
        CAD: 'Canadian Dollar (C$)'
    };

    const getCurrencyLabel = (currency) => {
        const labels = {
            'PHP': 'Philippine Peso (₱)',
            'USD': 'US Dollar ($)',
            'EUR': 'Euro (€)',
            'JPY': 'Japanese Yen (¥)',
            'CAD': 'Canadian Dollar (C$)'
        };
        return labels[currency] || 'Select Currency';
    };

    const getShippingLabel = (address) => {
        const labels = {
            'home': 'Home Address',
            'billing': 'Billing Address',
            'shipping': 'Shipping Address'
        };
        return labels[address] || 'Select Address';
    };

    const getPaymentLabel = (method) => {
        const labels = {
            'cash_on_delivery': 'Cash on Delivery',
            'bank_transfer': 'Bank Transfer',
            'paypal': 'Paypal',
            'credit_card': 'Credit Card'
        };
        
        const customMethod = customPaymentMethods.find(pm => pm.key === method);
        if (customMethod) {
            return customMethod.label;
        }
        
        return labels[method] || 'Select Payment Method';
    };

    const handlePlatformSettingsChange = (field, value) => {
        const updatedSettings = { ...platformSettings, [field]: value };
        setPlatformSettings(updatedSettings);
        
        const hasChanged = 
            updatedSettings.currency !== settings.currency ||
            updatedSettings.preferred_shipping_address !== settings.preferred_shipping_address ||
            updatedSettings.preferred_payment_method !== settings.preferred_payment_method;
        
        setIsPlatformSettingsChanged(hasChanged);
    };

    const updatePlatformSettings = async () => {
        const result = await updateSettings(platformSettings);
        
        if (result?.error) {
            showToast(`Failed to update platform settings: ${result.error}`, 'error');
        } else {
            showToast('Platform settings updated successfully', 'success');
            setIsPlatformSettingsChanged(false);

            // Force update the local platform settings to match what was saved
            if (result.settings) {
                setPlatformSettings({
                    currency: result.settings.currency,
                    preferred_shipping_address: result.settings.preferred_shipping_address,
                    preferred_payment_method: result.settings.preferred_payment_method
                });
            }
        }
    };

    const resetPlatformSettings = () => {
        setPlatformSettings({
            currency: settings?.currency || 'PHP',
            preferred_shipping_address: settings?.preferred_shipping_address || 'home',
            preferred_payment_method: settings?.preferred_payment_method || 'cash_on_delivery'
        });
        setIsPlatformSettingsChanged(false);
    };
    
    const handleFileChange = (event) => {
        
        const file = event['target']['files'][0];
        
        if (!file) return;

        const validTypes = [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp' ];

        if (!validTypes.includes(file['type'])) {
            showToast('Please select a valid image file! Valid image file types: .JPEG, .PNG, .GIF, and .WEBP', 'error');
            return;
        };

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image file must be smaller than 5MB', 'error');
            return;
        }

        setAvatarFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader['result']);
        };
        reader.readAsDataURL(file);

    };
    const handleAvatarUpload = async () => {
        
        if (!avatarFile) {
            showToast('Please select an image first!', 'error');
            return;
        }

        const result = await updateAvatar(avatarFile);

        if (result?.error) {
            showToast(`Failed to upload avatar: ${result.error}`, 'error');
        } else {
            showToast('Avatar uploaded successfully', 'success');
            setAvatarFile(null);
            setAvatarPreview(null);
        };

    };
    const handleAvatarRemoval = async () => {
        
        const result = await removeAvatar();

        if (result?.error) {
            showToast(`Failed to remove avatar: ${ result['error'] }`, 'error');
        } else {
            showToast('Avatar removed successfully!', 'success')
        }

    };
    const handlePersonalInfoChange = (field, value) => {
        
        const updatedInfo = { ...personalInfo, [ field ]: value };
        setPersonalInfo(updatedInfo);

        const hasChanged = updatedInfo['first_name'] !== (user?.first_name || '') || updatedInfo['last_name'] !== (user?.last_name || '') || updatedInfo['email'] !== (user?.email || '') || updatedInfo['phone_number'] !== (user?.phone_number || '')

        setIsPersonalInfoChanged(hasChanged);
    };
    const handleShippingAddressChange = (field, value) => {
        const updatedShippingAddress = { ...addressInfo.shipping_address, [field]: value };
        setAddressInfo({ ...addressInfo, shipping_address: updatedShippingAddress });
        
        const hasChanged = 
            updatedShippingAddress.street !== (user?.shipping_street || '') ||
            updatedShippingAddress.city !== (user?.shipping_city || '') ||
            updatedShippingAddress.state !== (user?.shipping_state || '') ||
            updatedShippingAddress.postal_code !== (user?.shipping_postal_code || '');
        
        setIsShippingAddressChanged(hasChanged);
    };
    const handleBillingAddressChange = (field, value) => {
        const updatedBillingAddress = { ...addressInfo.billing_address, [field]: value };
        setAddressInfo({ ...addressInfo, billing_address: updatedBillingAddress });
        
        const hasChanged = 
            updatedBillingAddress.same_as_shipping !== (user?.billing_same_as_shipping || true) ||
            (!updatedBillingAddress.same_as_shipping && (
                updatedBillingAddress.street !== (user?.billing_street || '') ||
                updatedBillingAddress.city !== (user?.billing_city || '') ||
                updatedBillingAddress.state !== (user?.billing_state || '') ||
                updatedBillingAddress.postal_code !== (user?.billing_postal_code || '')
            ));
        
        setIsBillingAddressChanged(hasChanged);
    };
    const handlePasswordChange = (field, value) => {
    
        const updatedInfo = { ...passwordInfo, [field]: value };
        const hasContent = updatedInfo['newPassword'] !== '' && updatedInfo['confirmNewPassword'] !== '';
        const doMatch = updatedInfo['newPassword'] === updatedInfo['confirmNewPassword'];

        setPasswordInfo(updatedInfo);
        setDoPasswordsMatch(doMatch);
        setIsPasswordInfoChanged(hasContent && doMatch);
    
    };
    const handleGeneralAddressChange = (value) => {
        setGeneralAddressInfo({ address: value });
        const hasChanged = value !== (user?.address || '');
        setIsGeneralAddressChanged(hasChanged);
    };
    const handleChangeAccountPassword = async () => {
        
        try {

            const { email } = user;

            await sendChangePasswordVerificationLink(email);
            
        } catch (err) {
            console.error("Profile page handleChangeAccountPassword function error: ", err);
        }

    };
    const handleAddNewAddressFormInputChange = (event) => {

        const { name, value, type, checked } = event.target;
        setAddNewAddressFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

    };

    const handleEditAddressFormInputChange = (event) => {

        const { name, value, type, checked } = event.target;
        setEditAddressFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

    };

    const handleAddNewAddressSubmit = async () => {
        
        try {

            const result = await addAddress(addNewAddressFormData);

            await getAddressBook();
            
            showToast('Address added successfully!', 'success');
            setIsModalOpen(false);

        } catch (err) {
            console.error("Profile page handleAddNewAddressSubmit function error: ", err);
            showToast('Failed to add the address! An error had occured.', 'error');
            setIsModalOpen(false);
        }

    };

    const handleEditAddressSubmit = async () => {
        
        try {

            const result = await updateAddress(editAddressFormData);

            await getAddressBook();
            
            showToast('Address modified successfully!', 'success');
            setIsModalOpen(false);

        } catch (err) {
            console.error("Profile page handleEditAddressSubmit function error: ", err);
            showToast('Failed to modify the address! An error had occured.', 'error');
            setIsModalOpen(false);
        }

    }

    const handleAddressRemoval = async () => {

        try {

            await deleteAddress(addressToDelete);
            await getAddressBook();

            showToast("Successfully deleted the address!", "success");

        } catch (err) {

            console.error("Profile pages handleRemovalAddress function error: ", err);
            showToast("Failed to delete address. An error had occured.", "error");

        }

    }
    const resetAddNewAddressFormData = () => {
        setAddNewAddressFormData({
            full_name: user.name,
            phone_number: user.phone_number,
            province: '',
            city: '',
            barangay: '',
            postal_code: '',
            street_address: '',
            is_default_billing: false,
            is_default_shipping: false,
        })
    }

    const resetEditAddressFormData = () => {
        setEditAddressFormData({
            id: '',
            full_name: '',
            phone_number: '',
            province: '',
            city: '',
            barangay: '',
            postal_code: '',
            street_address: '',
            is_default_billing: false,
            is_default_shipping: false,
        })
    }

    const updatePersonalInfo = async () => {
        
        const emailChanged = personalInfo.email !== user.email;
        const oldEmail = user.email;
        const newEmail = personalInfo.email;
        const fullName = `${personalInfo.first_name} ${personalInfo.last_name}`;
        const result = await updatePersonalInfoAPI(personalInfo);

        if (result?.error) {
            showToast(`Failed to update personal info: ${result.error}`, 'error');
        } else {
            showToast('Personal information updated successfully', 'success');

            if (emailChanged) {
                await notifyAccountChange('email_changed', {
                    name: fullName,
                    oldEmail: oldEmail,
                    newEmail: newEmail
                });
            }
            
            setIsPersonalInfoChanged(false);
        }
    };

    const updateShippingAddress = async () => {
        if (!validateShippingAddress()) {
            return;
        }
        const result = await updateAddressAPI({
            type: 'shipping',
            address: addressInfo.shipping_address
        });

        if (result?.error) {
            showToast(`Failed to update shipping address: ${result.error}`, 'error');
        } else {
            showToast('Shipping address updated successfully', 'success');
            setIsShippingAddressChanged(false);
        }
    };

    const updateBillingAddress = async () => {
        if (!validateBillingAddress()) {
            return;
        }
        const result = await updateAddressAPI({
            type: 'billing',
            address: addressInfo.billing_address
        });

        if (result?.error) {
            showToast(`Failed to update billing address: ${result.error}`, 'error');
        } else {
            showToast('Billing address updated successfully', 'success');
            setIsBillingAddressChanged(false);
        }
    };

    const updateGeneralAddress = async () => {
        const result = await updateAddressAPI({
            type: 'general',
            address: generalAddressInfo.address
        });

        if (result?.error) {
            showToast(`Failed to update address: ${result.error}`, 'error');
        } else {
            showToast('Address updated successfully', 'success');
            setIsGeneralAddressChanged(false);
        }
    };

    const updatePasswordInfo = async () => {

        try {

            const fullName = user?.first_name + ' ' + user?.last_name;
            const email = user?.email;
            const { newPassword, confirmNewPassword } = passwordInfo;
            const result = await changePassword(newPassword, queryToken);

            if (result?.error) {
                showToast(`Failed to update password: ${ result.error }`, 'error');
            } else {
                showToast('Password updated successfully', 'success');
                
                await notifyAccountChange('password_changed', {
                    name: fullName,
                    email: email
                });

                setPasswordInfo({ newPassword: '', confirmNewPassword: '' });
                setIsPasswordInfoChanged(false);
                setDoPasswordsMatch(true);
                logout();
            }

        } catch (err) {
            console.error("Profile page updatePasswordInfo function error: ", err);
        }

    };
    const resetPersonalInfo = () => {
        setPersonalInfo({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone_number: user.phone_number || ''
        });
        setIsPersonalInfoChanged(false);
    };
    const resetAddressInfo = () => {
        setAddressInfo({
            shipping_address: {
                street: user?.shipping_street || '',
                city: user?.shipping_city || '',
                state: user?.shipping_state || '',
                postal_code: user?.shipping_postal_code || '',
                country: 'Philippines'
            },
            billing_address: {
                street: user?.billing_street || '',
                city: user?.billing_city || '',
                state: user?.billing_state || '',
                postal_code: user?.billing_postal_code || '',
                country: 'Philippines',
                same_as_shipping: user?.billing_same_as_shipping ?? true
            }
        });
        setIsShippingAddressChanged(false);
        setIsBillingAddressChanged(false);
    };
    const resetGeneralAddress = () => {
        setGeneralAddressInfo({ address: user?.address || '' });
        setIsGeneralAddressChanged(false);
    };
    const resetPasswordInfo = () => {
        setPasswordInfo({ newPassword: '', confirmNewPassword: '' });
        setIsPasswordInfoChanged(false);
        setDoPasswordsMatch(true);
    };
    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };
    const handleConfirmPasswordToggle = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };
    const validatePersonalInfo = () => {
        const errors = {};
        
        if (!personalInfo.first_name.trim()) {
            errors.first_name = 'First name is required';
        }
        
        if (!personalInfo.last_name.trim()) {
            errors.last_name = 'Last name is required';
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(personalInfo.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        const phoneRegex = /^(\+63|0)?[0-9]{10}$/;
        if (!phoneRegex.test(personalInfo.phone_number.replace(/\s/g, ''))) {
            errors.phone_number = 'Please enter a valid Philippine phone number';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const validateShippingAddress = () => {
        const errors = {};
        if (!addressInfo.shipping_address.street.trim()) {
            errors.street = 'Street address is required';
        }
        if (!addressInfo.shipping_address.city.trim()) {
            errors.city = 'City is required';
        }
        if (!addressInfo.shipping_address.state.trim()) {
            errors.state = 'State/Province is required';
        }
        if (!addressInfo.shipping_address.postal_code.trim()) {
            errors.postal_code = 'Postal code is required';
        }
        setShippingAddressErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const validateBillingAddress = () => {
        const errors = {};
        if (!addressInfo.billing_address.same_as_shipping) {
            if (!addressInfo.billing_address.street.trim()) {
                errors.street = 'Street address is required';
            }
            if (!addressInfo.billing_address.city.trim()) {
                errors.city = 'City is required';
            }
            if (!addressInfo.billing_address.state.trim()) {
                errors.state = 'State/Province is required';
            }
            if (!addressInfo.billing_address.postal_code.trim()) {
                errors.postal_code = 'Postal code is required';
            }
        }
        setBillingAddressErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const validateIfPasswordExists = async () => {

        const response = await fetch(`/api/oauth/check-password-exists/${ user.email }`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const responseData = await response.json();
       
        if (!response.ok) {
            throw new Error(responseData.error);
        }

        if (responseData.doesPasswordExist)
            setIsPasswordSet(true);

    };

    useEffect(() => {

        if (user) {
            setPersonalInfo({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_number: user.phone_number || ''
            });
            setGeneralAddressInfo({
                address: user.address || ''
            });
            setAddressInfo({
                shipping_address: {
                    street: user.shipping_street || '',
                    city: user.shipping_city || '',
                    state: user.shipping_state || '',
                    postal_code: user.shipping_postal_code || '',
                    country: 'Philippines'
                },
                billing_address: {
                    street: user.billing_street || '',
                    city: user.billing_city || '',
                    state: user.billing_state || '',
                    postal_code: user.billing_postal_code || '',
                    country: 'Philippines',
                    same_as_shipping: false
                }
            });
            validateIfPasswordExists();
        }

       if (settings) {
            const newPlatformSettings = {
                currency: settings.currency || 'PHP',
                preferred_shipping_address: settings.preferred_shipping_address || 'home',
                preferred_payment_method: settings.preferred_payment_method || 'cash_on_delivery'
            };
            
            setPlatformSettings(newPlatformSettings);
        }

        const handleClickOutside = (event) => {
            if (!event.target.closest(`.${styles['dropdown-container']}`)) {
                closeAllDropdowns();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [ user, settings ]);

    const isAdmin = user?.role === 'admin';

    if (loading || !user) return null;

    return(
        <>
            <div className={ styles['wrapper'] }>
                <Banner
                    data={ banners.filter(banner => banner.page === 'profile') }
                />
                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>{isAdmin ? 'Admin Profile' : 'My Profile'}</h1>
                </div>

                <div className={ styles['container'] }>

                    <div className={ styles['avatar'] }>

                        <div className={styles['avatar-img']}>
                            {(isUpdatingAvatar || isRemovingAvatar) ? (
                                <div style={{ display: 'grid', placeContent: 'center', height: '100%' }} className={styles['avatar-loading']}>
                                    <i style={{ color: 'var(--accent-base)' }} className="fa-solid fa-spinner fa-spin"></i>
                                </div>
                            ) : (
                                <img
                                    src={
                                        !user?.image_url && !user?.image
                                            ? "https://static.vecteezy.com/system/resources/thumbnails/004/511/281/small_2x/default-avatar-photo-placeholder-profile-picture-vector.jpg"
                                            : (user?.image_url?.includes('lh3.googleusercontent.com') || user?.image?.includes('lh3.googleusercontent.com'))
                                                ? user?.image || user?.image_url
                                                : `https://res.cloudinary.com/dfvy7i4uc/image/upload/${user.image_url || user.image}` 
                                    }
                                    alt={`${user?.first_name || ''} ${user?.last_name || ''}'s profile avatar`} 
                                />
                            )}
                            <Button
                                id='profile-avatar-dropdown'
                                type='icon-outlined'
                                dropdownPosition='left'
                                externalStyles={ styles['avatar-img-edit'] }
                                options={[
                                    {
                                        label: 'Change avatar',
                                        action: () => {
                                            setModalType('change-avatar');
                                            setIsModalOpen(true);
                                        },
                                    },
                                    {
                                        label: 'Remove avatar',
                                        action: () => {
                                            setModalType('remove-avatar-confirmation');
                                            setIsModalOpen(true);
                                        },
                                    }
                                ]}
                            />
                        </div>

                        <div className={ styles['avatar-info'] }>
                            <span>
                                <h2>{ user['first_name'] + ' ' + user['last_name'] }</h2>
                                <h3>{ user['email'] }</h3>
                            </span>
                            <span>
                                <h4><strong>Member since:</strong> {user['createdAt'] ? new Date(user['createdAt']).toISOString().replace('T', ' ').slice(0, 19) : 'N/A'}</h4>
                                <h4><strong>Last modified since:</strong> {user['updatedAt'] ? new Date(user['updatedAt']).toISOString().replace('T', ' ').slice(0, 19) : 'N/A'}</h4>
                            </span>
                        </div>

                    </div>

                    <div className={ styles['divider-vertical'] }></div>

                    <div className={ styles['info'] }>

                        <div className={ styles['notice'] }>
                            <i className='fa-solid fa-triangle-exclamation'></i>
                            <p>Please double-check all information before saving. Changes will permanently replace your existing profile data and can no longer be restored.</p>
                        </div>
                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-personal'] }>
                            <h2>Personal Information</h2>
                            <div className={ styles['inputs-container'] }>
                                <div className={ styles['inputs-wrapper-vertical'] }>
                                    <div className={ styles['inputs-wrapper'] }>
                                        <div className={ styles['input-wrapper'] }>
                                            <label htmlFor="first_name">First name</label>
                                            <InputField
                                                hint='Your first name...'
                                                type='text'
                                                isSubmittable={ false }
                                                value={ personalInfo['first_name'] }
                                                onChange={ event => handlePersonalInfoChange('first_name', event['target']['value'] )}
                                                error={ validationErrors['first_name'] }
                                            />
                                        </div>
                                        <div className={ styles['input-wrapper'] }>
                                            <label htmlFor="last_name">
                                                Last name
                                            </label>
                                            <InputField
                                                hint='Your last name...'
                                                type='text'
                                                isSubmittable={ false }
                                                value={ personalInfo['last_name'] }
                                                onChange={ event => handlePersonalInfoChange('last_name', event['target']['value'] )}
                                                error={ validationErrors['last_name'] }
                                            />
                                        </div>
                                    </div>
                                    <div className={ styles['inputs-wrapper'] }>
                                        <div className={ styles['input-wrapper'] }>
                                            <label htmlFor="email_address">
                                                Email address
                                            </label>
                                            <InputField
                                                hint='Your email address...'
                                                type='text'
                                                isSubmittable={ false }
                                                value={ personalInfo['email'] }
                                                onChange={ event => handlePersonalInfoChange('email', event['target']['value'] )}
                                                error={ validationErrors['email'] }
                                            />
                                        </div>
                                        <div className={ styles['input-wrapper'] }>
                                            <label htmlFor="phone number">
                                                Phone number
                                            </label>
                                            <InputField
                                                hint='Your phone number...'
                                                type='text'
                                                isSubmittable={ false }
                                                value={ personalInfo['phone_number'] }
                                                onChange={ event => handlePersonalInfoChange('phone_number', event['target']['value'] )}
                                                error={ validationErrors['phone_number'] }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={ styles['info-personal-ctas'] }>
                                    <Button
                                        type='primary'
                                        icon='fa-solid fa-circle-check'
                                        iconPosition='left'
                                        label='Update personal info'
                                        action={ () => {
                                            setModalType('update-personal-info-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ !isPersonalInfoChanged }
                                    />
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        label='Reset'
                                        action={ () => {
                                            setModalType('reset-personal-info-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        externalStyles={ styles['action-warn'] }
                                        disabled={ !isPersonalInfoChanged }
                                    />
                                </div>
                            </div>
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>

                        {!isAdmin && (
                            <>
                                <section className={ styles['user-settings'] }>
                                    <h2>Settings</h2>
                                    <div className={ styles['inputs-container'] }>
                                        <div className={ styles['inputs-wrapper'] }>
                                            <div className={ styles['input-wrapper'] }>
                                                <label htmlFor="currency">Preferred Currency</label>
                                                <div className={ styles['dropdown-container'] }>
                                                    <Button
                                                        id='preferred-currency'
                                                        type='secondary'
                                                        label={`${getCurrencyLabel(platformSettings.currency)}`}
                                                        dropdownPosition='right'
                                                        options={
                                                            Object.entries(availableCurrencies)
                                                                .filter(([currency, enabled]) => enabled)
                                                                .map(([currency]) => ({
                                                                    label: currencyLabels[currency],
                                                                    action: () => handlePlatformSettingsChange('currency', currency)
                                                                }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={ styles['inputs-wrapper'] }>
                                            <div className={ styles['input-wrapper'] }>
                                                <label htmlFor="payment_method">Preferred Payment Method</label>
                                                <div className={ styles['dropdown-container'] }>
                                                    <Button
                                                        id='preferred-payment-method'
                                                        type='secondary'
                                                        label={`${getPaymentLabel(platformSettings.preferred_payment_method)}`}
                                                        dropdownPosition='right'
                                                        options={[
                                                            ...(enabledPaymentMethods.cash_on_delivery ? [{
                                                                label: 'Cash on Delivery',
                                                                action: () => handlePlatformSettingsChange('preferred_payment_method', 'cash_on_delivery')
                                                            }] : []),
                                                            ...(enabledPaymentMethods.bank_transfer ? [{
                                                                label: 'Bank Transfer',
                                                                action: () => handlePlatformSettingsChange('preferred_payment_method', 'bank_transfer')
                                                            }] : []),
                                                            ...(enabledPaymentMethods.paypal ? [{
                                                                label: 'Paypal',
                                                                action: () => handlePlatformSettingsChange('preferred_payment_method', 'paypal')
                                                            }] : []),
                                                            ...(enabledPaymentMethods.credit_card ? [{
                                                                label: 'Credit Card',
                                                                action: () => handlePlatformSettingsChange('preferred_payment_method', 'credit_card')
                                                            }] : []),
                                                            ...customPaymentMethods
                                                                .filter(method => method.enabled)
                                                                .map(method => ({
                                                                    label: method.label,
                                                                    action: () => handlePlatformSettingsChange('preferred_payment_method', method.key)
                                                                }))
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={ styles['info-platform-ctas'] }>
                                            <Button
                                                type='primary'
                                                icon='fa-solid fa-circle-check'
                                                iconPosition='left'
                                                label='Update settings'
                                                action={ () => {
                                                    setModalType('update-platform-settings-confirmation');
                                                    setIsModalOpen(true);
                                                }}
                                                disabled={ !isPlatformSettingsChanged || settingsLoading }
                                            />
                                            <Button
                                                type='secondary'
                                                icon='fa-solid fa-rotate-left'
                                                iconPosition='left'
                                                label='Reset'
                                                action={ () => {
                                                    setModalType('reset-platform-settings-confirmation');
                                                    setIsModalOpen(true);
                                                }}
                                                externalStyles={ styles['action-warn'] }
                                                disabled={ !isPlatformSettingsChanged || settingsLoading }
                                            />
                                        </div>
                                    </div>
                                    <div className={ styles['divider-horizontal'] }></div>
                                </section>
                            </>
                        )}
                        {!isAdmin && (
                            <>
                                <section className={ styles['info-address_book'] }>
                                    <div className={ styles['info-header'] }>
                                        <h2>Address Book</h2>
                                        <Button
                                            type="primary"
                                            icon="fa-solid fa-plus"
                                            iconPosition="left"
                                            label="Add new address"
                                            action={ () => {
                                                resetAddNewAddressFormData();
                                                setModalType('add-new-address-modal');
                                                setIsModalOpen(true);
                                            }}
                                        />
                                    </div>
                                    <div className={ styles['info-list'] }>
                                        <div className={styles['info-list-address']}>
                                            { !addressBook?.addresses || addressBook?.addresses?.length === 0 ? (
                                                <div className={styles['address-empty']}>No set addresses. You can add one.</div>
                                            ) : (
                                                addressBook.addresses.map((address) => (
                                                    <div key={address.id} className={styles['address-item']}>

                                                        <div className={ styles['address-item-left'] }>
                                                            <div className={styles['address-main']}>
                                                                <span className={styles['address-name']}>
                                                                    <strong>{address.full_name}</strong>
                                                                </span>
                                                                <span className={styles['address-phone']}>
                                                                    {address.phone_number && (
                                                                        <>
                                                                            {"|"}
                                                                            <span>(+63) {address.phone_number}</span>
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className={styles['address-details']}>
                                                                <div>
                                                                    {address.street_address}
                                                                    <br />
                                                                    {address.barangay}, {address.city}, {address.province}, {address.postal_code}
                                                                </div>
                                                            </div>
                                                            <div className={styles['address-tags']}>
                                                                    {(addressBook.defaults?.default_billing_address === address.id ||
                                                                    addressBook.defaults?.default_shipping_address === address.id) && (
                                                                    <div className={styles['address-tags']}>
                                                                        {addressBook.defaults?.default_billing_address === address.id && (
                                                                        <span className={styles['address-tag']}>Default Billing</span>
                                                                        )}
                                                                        {addressBook.defaults?.default_shipping_address === address.id && (
                                                                        <span className={styles['address-tag']}>Default Shipping</span>
                                                                        )}
                                                                    </div>
                                                                    )}
                                                            </div>
                                                        </div>

                                                        <div className={ styles['address-item-right'] }>
                                                            <div className={styles['address-actions']}>
                                                                <Button
                                                                    type="icon-outlined"
                                                                    icon="fa-solid fa-pen"
                                                                    action={() => {
                                                                        setEditAddressFormData({
                                                                            id: address.id,
                                                                            full_name: address.full_name,
                                                                            phone_number: address.phone_number,
                                                                            province: address.province,
                                                                            city: address.city,
                                                                            barangay: address.barangay,
                                                                            postal_code: address.postal_code,
                                                                            street_address: address.street_address,
                                                                            is_default_billing: address.id === addressBook.defaults?.default_billing_address,
                                                                            is_default_shipping: address.id === addressBook.defaults?.default_shipping_address,
                                                                        });
                                                                        setModalType('edit-address-modal');
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="icon-outlined"
                                                                    icon="fa-solid fa-trash-can"
                                                                    action={() => {
                                                                        setAddressToDelete(address.id);
                                                                        setModalType('delete-address-confirmation');
                                                                        setIsModalOpen('true');
                                                                    }}
                                                                    externalStyles={styles['address-delete']}
                                                                />
                                                            </div>                                                    
                                                        </div>

                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <div className={ styles['divider-horizontal'] }></div>
                            </>
                        )}
                        <section className={ styles['info-settings'] }>
                            <h2>Account Settings</h2>
                            <div className={ styles['inputs-container'] }>
                                { !doPasswordsMatch && (
                                    <div className={ styles['info-settings-notice'] }>
                                        <i className='fa-solid fa-triangle-exclamation'></i>
                                        <p>Passwords do not match</p>
                                    </div>
                                )}
                                { errorToken && (
                                    <div className={ styles['info-settings-notice'] }>
                                        <i className='fa-solid fa-triangle-exclamation'></i>
                                        <p>{ getErrorMessage(errorToken) }</p>
                                    </div>
                                )}
                                <div className={ styles['info-settings-set_password'] }>
                                    <Button
                                        type='primary'
                                        icon='fa-solid fa-key'
                                        iconPosition='left'
                                        label={ isPasswordSet ? 'Change account password' : 'Set account password' }
                                        action={ () => {
                                            setModalType('set-account-password-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ queryToken }
                                        externalStyles={ styles['info-settings-set_password-cta'] }
                                    />
                                    <p>{ isPasswordSet? "In order to change your password, you must verify first by clicking the link sent to your email." : "In order to sign in with password, set your password first." }</p>
                                </div>
                                <div className={ styles['inputs-wrapper'] }>
                                    <div className={ styles['input-wrapper'] }>
                                        <label htmlFor="new_password">
                                            New Password
                                        </label>
                                        <InputField
                                            value={ passwordInfo['newPassword'] }
                                            onChange={event => handlePasswordChange('newPassword', event['target']['value'])}
                                            hint='Your new password...'
                                            type={ showPassword ? 'text' : 'password' }
                                            icon={ showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                            action={ handlePasswordToggle }
                                            disabled={ !queryToken }
                                            isSubmittable={ false }
                                        />
                                    </div>
                                    <div className={ styles['input-wrapper'] }>
                                        <label htmlFor="confirmNewPassword">
                                            Confirm New Password
                                        </label>
                                        <InputField
                                            value={ passwordInfo['confirmNewPassword'] }
                                            onChange={event => handlePasswordChange('confirmNewPassword', event['target']['value'])}
                                            hint='Confirm your new password...'
                                            type={ showConfirmPassword ? 'text' : 'password' }
                                            icon={ showConfirmPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                            action={ handleConfirmPasswordToggle }
                                            disabled={ !queryToken }
                                            isSubmittable={ false }
                                        />
                                    </div>
                                </div>
                                <div className={ styles['info-settings-ctas'] }>
                                    <Button
                                        type='primary'
                                        icon='fa-solid fa-circle-check'
                                        iconPosition='left'
                                        label='Update account password'
                                        action={ () => {
                                            setModalType('update-account-password-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ !isPasswordInfoChanged }
                                    />
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        label='Reset'
                                        action={ () => {
                                            setModalType('reset-account-password-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        externalStyles={ styles['action-warn'] }
                                        disabled={ !isPasswordInfoChanged }
                                    />
                                </div>
                            </div>
                            <div className={ styles['info-settings-action'] }>
                                <p>Ready to leave? Sign out to protect your account. You'll need to log in again for your next visit.</p>
                                <Button
                                    type='secondary'
                                    label='Sign out of my account'
                                    icon='fa-solid fa-right-from-bracket'
                                    iconPosition='left'
                                    action={ () => {
                                        setModalType('sign-out-confirmation');
                                        setIsModalOpen(true);
                                    }}
                                    externalStyles={ styles['action-warn'] }
                                />
                            </div>
                        </section>

                        <div className={ styles['divider-horizontal'] }></div>

                        <section className={ styles['info-notifications'] }>
                            <div className={ styles['settings-section-header'] }>
                                <h2>Notification Preferences</h2>
                                <p>Manage your email and notification preferences</p>
                            </div>

                            <div className={ styles['notifications-grid'] }>
                                {!isAdmin && (
                                    <div className={ styles['notification-category'] }>
                                        <h3 className={ styles['category-title'] }>Shopping Activity</h3>
                                
                                        <div className={ styles['notification-card'] }>
                                            <div className={ styles['notification-header'] }>
                                                <div className={ styles['notification-info'] }>
                                                    <h4>Cart Updates</h4>
                                                    <p>Notifications when items are added or removed from cart</p>
                                                </div>
                                                <div className={ styles['toggle-container'] }>
                                                    <label className={ styles['toggle-switch'] }>
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPreferences.cart_updates}
                                                            onChange={() => handleNotificationToggle('cart_updates')}
                                                            disabled={loadingNotifications}
                                                        />
                                                        <span className={ styles['toggle-slider'] }></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={ styles['notification-status'] }>
                                                <span className={`${styles['status-badge']} ${notificationPreferences.cart_updates ? styles['enabled'] : styles['disabled']}`}>
                                                    {notificationPreferences.cart_updates ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                
                                        <div className={ styles['notification-card'] }>
                                            <div className={ styles['notification-header'] }>
                                                <div className={ styles['notification-info'] }>
                                                    <h4>Wishlist Updates</h4>
                                                    <p>Notifications when items are added or removed from wishlist</p>
                                                </div>
                                                <div className={ styles['toggle-container'] }>
                                                    <label className={ styles['toggle-switch'] }>
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPreferences.wishlist_updates}
                                                            onChange={() => handleNotificationToggle('wishlist_updates')}
                                                            disabled={loadingNotifications}
                                                        />
                                                        <span className={ styles['toggle-slider'] }></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={ styles['notification-status'] }>
                                                <span className={`${styles['status-badge']} ${notificationPreferences.wishlist_updates ? styles['enabled'] : styles['disabled']}`}>
                                                    {notificationPreferences.wishlist_updates ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isAdmin && (
                                    <div className={ styles['notification-category'] }>
                                        <h3 className={ styles['category-title'] }>Orders & Transactions</h3>
                                
                                        <div className={ styles['notification-card'] }>
                                            <div className={ styles['notification-header'] }>
                                                <div className={ styles['notification-info'] }>
                                                    <h4>Order Status Updates</h4>
                                                    <p>Get notified about order status changes</p>
                                                </div>
                                                <div className={ styles['toggle-container'] }>
                                                    <label className={ styles['toggle-switch'] }>
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPreferences.order_updates}
                                                            onChange={() => handleNotificationToggle('order_updates')}
                                                            disabled={loadingNotifications}
                                                        />
                                                        <span className={ styles['toggle-slider'] }></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={ styles['notification-status'] }>
                                                <span className={`${styles['status-badge']} ${notificationPreferences.order_updates ? styles['enabled'] : styles['disabled']}`}>
                                                    {notificationPreferences.order_updates ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className={ styles['notification-category'] }>
                                        <h3 className={ styles['category-title'] }>Admin Notifications</h3>
                                
                                        <div className={ styles['notification-card'] }>
                                            <div className={ styles['notification-header'] }>
                                                <div className={ styles['notification-info'] }>
                                                    <h4>New Orders</h4>
                                                    <p>Get notified when customers place new orders</p>
                                                </div>
                                                <div className={ styles['toggle-container'] }>
                                                    <label className={ styles['toggle-switch'] }>
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPreferences.admin_new_orders}
                                                            onChange={() => handleNotificationToggle('admin_new_orders')}
                                                            disabled={loadingNotifications}
                                                        />
                                                        <span className={ styles['toggle-slider'] }></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={ styles['notification-status'] }>
                                                <span className={`${styles['status-badge']} ${notificationPreferences.admin_new_orders ? styles['enabled'] : styles['disabled']}`}>
                                                    {notificationPreferences.admin_new_orders ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                
                                        <div className={ styles['notification-card'] }>
                                            <div className={ styles['notification-header'] }>
                                                <div className={ styles['notification-info'] }>
                                                    <h4>Customer Messages</h4>
                                                    <p>Notifications for new customer support messages</p>
                                                </div>
                                                <div className={ styles['toggle-container'] }>
                                                    <label className={ styles['toggle-switch'] }>
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPreferences.admin_customer_messages}
                                                            onChange={() => handleNotificationToggle('admin_customer_messages')}
                                                            disabled={loadingNotifications}
                                                        />
                                                        <span className={ styles['toggle-slider'] }></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={ styles['notification-status'] }>
                                                <span className={`${styles['status-badge']} ${notificationPreferences.admin_customer_messages ? styles['enabled'] : styles['disabled']}`}>
                                                    {notificationPreferences.admin_customer_messages ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                
                                        <div className={ styles['notification-card'] }>
                                            <div className={ styles['notification-header'] }>
                                                <div className={ styles['notification-info'] }>
                                                    <h4>Low Stock Alerts</h4>
                                                    <p>Get alerts when product inventory is running low</p>
                                                </div>
                                                <div className={ styles['toggle-container'] }>
                                                    <label className={ styles['toggle-switch'] }>
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationPreferences.admin_low_stock_alerts}
                                                            onChange={() => handleNotificationToggle('admin_low_stock_alerts')}
                                                            disabled={loadingNotifications}
                                                        />
                                                        <span className={ styles['toggle-slider'] }></span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className={ styles['notification-status'] }>
                                                <span className={`${styles['status-badge']} ${notificationPreferences.admin_low_stock_alerts ? styles['enabled'] : styles['disabled']}`}>
                                                    {notificationPreferences.admin_low_stock_alerts ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={ styles['notification-category'] }>
                                    <h3 className={ styles['category-title'] }>Security & Account</h3>
                            
                                    <div className={ styles['notification-card'] }>
                                        <div className={ styles['notification-header'] }>
                                            <div className={ styles['notification-info'] }>
                                                <h4>Account Security</h4>
                                                <p>Critical alerts about account changes and security</p>
                                            </div>
                                            <div className={ styles['toggle-container'] }>
                                                <label className={ styles['toggle-switch'] }>
                                                    <input
                                                        type="checkbox"
                                                        checked={notificationPreferences.account_security}
                                                        onChange={() => handleNotificationToggle('account_security')}
                                                        disabled={true}
                                                    />
                                                    <span className={ styles['toggle-slider'] }></span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className={ styles['notification-status'] }>
                                            <span className={`${styles['status-badge']} ${styles['enabled']}`}>
                                                Always Enabled
                                            </span>
                                            <span className={ styles['required-badge'] }>Required</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={ styles['notification-actions'] }>
                                <Button
                                    type="secondary"
                                    label="Reset Changes"
                                    action={handleResetNotifications}
                                    disabled={!hasNotificationChanges || loadingNotifications}
                                />
                                <Button
                                    type="primary"
                                    label={loadingNotifications ? 'Saving...' : 'Save Preferences'}
                                    action={handleSaveNotifications}
                                    disabled={!hasNotificationChanges || loadingNotifications}
                                />
                            </div>
                        </section>

                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-danger'] }>
                            <h2>Danger Zone</h2>
                            {!isAdmin && (
                                <>
                                    <div className={ styles['info-danger-action'] }>
                                        <p>This will permanently remove all past reservation records from your account. This action cannot be undone and your reservation history will be erased.</p>
                                        <Button
                                            type='secondary'
                                            label='Clear my reservation history'
                                            icon='fa-solid fa-trash-can'
                                            iconPosition='left'
                                            action={ () => {
                                                setModalType('clear-reservation-confirmation');
                                                setIsModalOpen(true);
                                            }}
                                            externalStyles={ styles['action-warn'] }
                                        />
                                    </div>
                                </>
                            )}
                            <div className={ styles['info-danger-action'] }>
                                <p>This will permanently delete your account and all associated data. You will lose access to your profile, reservation history, and saved payment methods. This action cannot be reversed.</p>
                                <Button
                                    type='primary'
                                    label='Delete my account'
                                    icon='fa-solid fa-explosion'
                                    iconPosition='left'
                                    action={ () => {
                                        setModalType('delete-account-confirmation');
                                        setIsModalOpen(true);
                                    }}
                                    externalStyles={ styles['action-danger'] }
                                />
                            </div>
                            <div className={ styles['divider-horizontal'] }></div>
                        </section>
                    </div>

                </div>

            </div>
            { modalType === 'remove-avatar-confirmation' ? (
                <Modal label='Remove Avatar Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to remove your profile picture? Your account will display the default avatar instead.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={ () => {
                                setIsModalOpen(false);
                                handleAvatarRemoval();
                            }}
                        
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'change-avatar' ? (
                <Modal label='Change Avatar' isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <p className={ styles['change-avatar-info'] }>Upload a new profile picture. We recommend using a square image for best results.</p>
                    { avatarPreview && (
                        <div className={ styles['change-avatar-preview'] }>
                            <img 
                                src={ avatarPreview } 
                                alt="Avatar preview" 
                            />
                        </div>
                    )}
                    <div className={ styles['input-wrapper'] }>
                        <label htmlFor="avatar-file">Select an image</label>
                        <InputField
                            type='file'
                            id='avatar-file'
                            hint='.'
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={ handleFileChange }
                            isSubmittable={ false }
                        />
                        <p className={ styles['change-avatar-info'] }>Recommended size: 500x500 pixels. Maximum size: 5MB.</p>
                    </div>
                    
                    <div className={styles['modal-ctas']}>
                        <Button
                            label='Upload'
                            type='primary'
                            action={() => {
                                handleAvatarUpload();
                                setIsModalOpen(false);
                            }}
                            disabled={!avatarFile}
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={() => {
                                setModalType('');
                                setIsModalOpen(false);
                                setAvatarFile(null);
                                setAvatarPreview(null);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'update-personal-info-confirmation' ? (
                <Modal label='Update Personal Info Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Confirm changes to your personal information? This will update your name, email, and contact details in your profile.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={ () => {
                                setIsModalOpen(false);
                                updatePersonalInfo();
                            }}
                        
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'reset-personal-info-confirmation' ? (
                <Modal label='Reset Personal Info Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to reset all personal information fields to their previous values? Any unsaved changes will be discarded.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                resetPersonalInfo();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'update-platform-settings-confirmation' ? (
                <Modal label='Update Platform Settings Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to update your platform settings? This will change how prices are displayed and your default preferences.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                updatePlatformSettings();
                            }}
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'reset-platform-settings-confirmation' ? (
                <Modal label='Reset Platform Settings Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to reset platform settings to their previous values? Any unsaved changes will be discarded.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                resetPlatformSettings();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'update-shipping-address-confirmation' ? (
                <Modal label='Update Shipping Address Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to save changes to your shipping address? This will update where your orders will be delivered.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                updateShippingAddress();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'update-billing-address-confirmation' ? (
                <Modal label='Update Billing Address Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to save changes to your billing address? This will update where your invoices will be sent.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                updateBillingAddress();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'reset-shipping-address-confirmation' ? (
                <Modal label='Reset Shipping Address Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to reset shipping address to its previous values? Any unsaved changes will be discarded.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                resetAddressInfo();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'reset-billing-address-confirmation' ? (
                <Modal label='Reset Billing Address Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to reset billing address to its previous values? Any unsaved changes will be discarded.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                resetAddressInfo();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'update-account-password-confirmation' ? (
                <Modal label='Update Account Password Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to update your account password? <span className={ styles['modal-warn'] }>You will be logged out of your account.</span></p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={ () => {
                                setIsModalOpen(false);
                                updatePasswordInfo();
                            }}
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                                resetPasswordInfo();
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'set-account-password-confirmation' ? (
                <Modal label={ isPasswordSet ? 'Change Account Password Confirmation' : 'Set Account Password Confirmation' } isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>
                        An email with a confirmation link will be sent to you. 
                    {
                        isPasswordSet
                        ? ' You will need to click that link in order to change your account password.'
                        : ' You will need to click that link in order to set your account password.'
                    }
                    </p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                handleChangeAccountPassword();
                            }}
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'reset-account-password-confirmation' ? (
                <Modal label='Reset Account Password Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to clear password fields? Any unsaved changes will be discarded.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={ () => {
                                setIsModalOpen(false);
                                resetPasswordInfo();
                            }}
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'sign-out-confirmation' ? (
                <Modal label='Sign Out Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to sign out? You'll need to log in again to access your account. Any unsaved changes will be lost.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                logout();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            ) : modalType === 'delete-account-confirmation' && (
                <Modal label='Delete Account Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>You are about to <strong>permanently delete your account</strong>. This will remove all your data including profile information, reservation history, and saved preferences. This action cannot be reversed. Are you absolutely sure you want to proceed?</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={ () => {
                                setIsModalOpen(false);
                                remove(user?.id);
                            }}
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            )}

            <Modal
                isOpen={ isModalOpen && modalType === 'add-new-address-modal' }
                onClose={ () => setIsModalOpen(false) }
                label={ 'Add new address' }
            >

                <div className={ styles['notice'] }>
                    <i className='fa-solid fa-triangle-exclamation'></i>
                    <p>Setting this address as your default billing or shipping will replace your current default. Only one address can be set as default for each.</p>
                </div>

                <div className={ styles['inputs-container'] }>

                    <div className={ styles['input-wrapper-horizontal'] }>

                        <div className={styles['input-wrapper']}>
                            <label>Full name</label>
                            <InputField
                                name="full_name"
                                hint="Your full name..."
                                value={ addNewAddressFormData.full_name }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                        <div className={styles['input-wrapper']} style={{ width: '24rem' }}>
                            <label>Phone number</label>
                            <InputField
                                name="phone_number"
                                hint="Your phone number..."
                                value={ addNewAddressFormData.phone_number }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                    </div>

                    <div className={ styles['input-wrapper-horizontal'] }>

                        <div className={ styles['input-wrapper'] }>
                            <label>Province</label>
                            <InputField
                                name="province"
                                hint="Your province..."
                                value={ addNewAddressFormData.province }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                        <div className={ styles['input-wrapper'] }>
                            <label>City</label>
                            <InputField
                                name="city"
                                hint="Your city..."
                                value={ addNewAddressFormData.city }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>
                            
                        <div className={styles['input-wrapper']}>
                            <label>Barangay</label>
                            <InputField
                                name="barangay"
                                hint="Your barangay..."
                                value={ addNewAddressFormData.barangay }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                    </div>

                    <div className={ styles['input-wrapper-horizontal'] }>

                        <div className={styles['input-wrapper']}>
                            <label>Street address</label>
                            <InputField
                                name="street_address"
                                hint="Your street address..."
                                value={ addNewAddressFormData.street_address }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                        <div className={ styles['input-wrapper'] } style={{ width: '8rem' }}>
                            <label>Postal code</label>
                            <InputField
                                name="postal_code"
                                hint=" "
                                value={ addNewAddressFormData.postal_code }
                                onChange={ handleAddNewAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                    </div>

                        <label className={ styles['checkbox-container'] }>
                            <input
                                type="checkbox"
                                name="is_default_billing"
                                onChange={ handleAddNewAddressFormInputChange }
                                className={ styles['checkbox'] }
                            />
                            <span className={ styles['checkmark'] }></span>
                            Set as default billing address
                        </label>

                        <label className={ styles['checkbox-container'] }>
                            <input
                                type="checkbox"
                                name="is_default_shipping"
                                onChange={ handleAddNewAddressFormInputChange }
                                className={ styles['checkbox'] }
                            />
                            <span className={ styles['checkmark'] }></span>
                            Set as default shipping address
                        </label>
                    
                </div>
                
                <div className={ styles['modal-ctas'] }>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={() => {
                            setIsModalOpen(false);
                            resetAddNewAddressFormData();
                        }} 
                    />
                    <Button 
                        type="primary" 
                        label={ 'Add new address' } 
                        action={ handleAddNewAddressSubmit }
                        disabled={
                            !addNewAddressFormData.full_name ||
                            !addNewAddressFormData.province ||
                            !addNewAddressFormData.city ||
                            !addNewAddressFormData.barangay ||
                            !addNewAddressFormData.street_address ||
                            !addNewAddressFormData.phone_number ||
                            !addNewAddressFormData.postal_code
                        }
                    />
                </div>
            </Modal>

            <Modal
                isOpen={ isModalOpen && modalType === 'edit-address-modal' }
                onClose={ () => setIsModalOpen(false) }
                label={ 'Edit address' }
            >

                <div className={ styles['notice'] }>
                    <i className='fa-solid fa-triangle-exclamation'></i>
                    <p>Setting this address as your default billing or shipping will replace your current default. Only one address can be set as default for each.</p>
                </div>

                <div className={ styles['inputs-container'] }>

                    <div className={ styles['input-wrapper-horizontal'] }>

                        <div className={styles['input-wrapper']}>
                            <label>Full name</label>
                            <InputField
                                name="full_name"
                                hint="Your full name..."
                                value={ editAddressFormData.full_name }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                        <div className={styles['input-wrapper']} style={{ width: '24rem' }}>
                            <label>Phone number</label>
                            <InputField
                                name="phone_number"
                                hint="Your phone number..."
                                value={ editAddressFormData.phone_number }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                    </div>

                    <div className={ styles['input-wrapper-horizontal'] }>

                        <div className={ styles['input-wrapper'] }>
                            <label>Province</label>
                            <InputField
                                name="province"
                                hint="Your province..."
                                value={ editAddressFormData.province }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                        <div className={ styles['input-wrapper'] }>
                            <label>City</label>
                            <InputField
                                name="city"
                                hint="Your city..."
                                value={ editAddressFormData.city }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>
                            
                        <div className={styles['input-wrapper']}>
                            <label>Barangay</label>
                            <InputField
                                name="barangay"
                                hint="Your barangay..."
                                value={ editAddressFormData.barangay }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                    </div>

                    <div className={ styles['input-wrapper-horizontal'] }>

                        <div className={styles['input-wrapper']}>
                            <label>Street address</label>
                            <InputField
                                name="street_address"
                                hint="Your street address..."
                                value={ editAddressFormData.street_address }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                        <div className={ styles['input-wrapper'] } style={{ width: '8rem' }}>
                            <label>Postal code</label>
                            <InputField
                                name="postal_code"
                                hint=" "
                                value={ editAddressFormData.postal_code }
                                onChange={ handleEditAddressFormInputChange }
                                isSubmittable={ false }
                                type="text"
                            />
                        </div>

                    </div>

                        <label className={ styles['checkbox-container'] }>
                            <input
                                type="checkbox"
                                name="is_default_billing"
                                checked={ editAddressFormData.is_default_billing }
                                onChange={ handleEditAddressFormInputChange }
                                className={ styles['checkbox'] }
                            />
                            <span className={ styles['checkmark'] }></span>
                            Set as default billing address
                        </label>

                        <label className={ styles['checkbox-container'] }>
                            <input
                                type="checkbox"
                                name="is_default_shipping"
                                checked={ editAddressFormData.is_default_shipping }
                                onChange={ handleEditAddressFormInputChange }
                                className={ styles['checkbox'] }
                            />
                            <span className={ styles['checkmark'] }></span>
                            Set as default shipping address
                        </label>
                    
                </div>
                
                <div className={ styles['modal-ctas'] }>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={() => {
                            setIsModalOpen(false);
                            resetEditAddressFormData();
                        }} 
                    />
                    <Button 
                        type="primary" 
                        label={ 'Update address' } 
                        action={ handleEditAddressSubmit }
                        disabled={
                            !editAddressFormData.full_name ||
                            !editAddressFormData.province ||
                            !editAddressFormData.city ||
                            !editAddressFormData.barangay ||
                            !editAddressFormData.street_address ||
                            !editAddressFormData.phone_number ||
                            !editAddressFormData.postal_code
                        }
                    />
                </div>
            </Modal>

            <Modal label='Delete Address Confirmation' isOpen={ isModalOpen && modalType === 'delete-address-confirmation' } onClose={ () => setIsModalOpen(false) }>
                <p className={ styles['modal-info'] }>You are about to <strong>permanently delete your address</strong>. This action cannot be reversed. Are you absolutely sure you want to proceed?</p>
                <div className={ styles['modal-ctas'] }>
                    <Button
                        label='Confirm'
                        type='secondary'
                        action={ () => {
                            setIsModalOpen(false);
                            handleAddressRemoval();
                        }}
                    />
                    <Button
                        label='Cancel'
                        type='primary'
                        action={ () => {
                            setModalType('');
                            setIsModalOpen(false);
                        }}
                    />
                </div>
            </Modal>
            {modalType === 'delete-account-confirmation' && (
                <Modal label='Delete Account Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>
                        You are about to <strong>permanently delete your account</strong>. 
                        {isAdmin 
                            ? " This will remove all your data including profile information and admin privileges."
                            : " This will remove all your data including profile information, reservation history, and saved preferences."
                        } This action cannot be reversed. Are you absolutely sure you want to proceed?
                    </p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='secondary'
                            action={ () => {
                                setIsModalOpen(false);
                                remove(user?.id);
                            }}
                        />
                        <Button
                            label='Cancel'
                            type='primary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            )}
            {!isAdmin && (
                <>
                    <Modal
                        isOpen={ isModalOpen && modalType === 'add-new-address-modal' }
                        onClose={ () => setIsModalOpen(false) }
                        label={ 'Add new address' }
                    >
                        <div className={ styles['notice'] }>
                            <i className='fa-solid fa-triangle-exclamation'></i>
                            <p>Setting this address as your default billing or shipping will replace your current default. Only one address can be set as default for each.</p>
                        </div>

                        <div className={ styles['inputs-container'] }>

                            <div className={ styles['input-wrapper-horizontal'] }>

                                <div className={styles['input-wrapper']}>
                                    <label>Full name</label>
                                    <InputField
                                        name="full_name"
                                        hint="Your full name..."
                                        value={ addNewAddressFormData.full_name }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                                <div className={styles['input-wrapper']} style={{ width: '24rem' }}>
                                    <label>Phone number</label>
                                    <InputField
                                        name="phone_number"
                                        hint="Your phone number..."
                                        value={ addNewAddressFormData.phone_number }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                            </div>

                            <div className={ styles['input-wrapper-horizontal'] }>

                                <div className={ styles['input-wrapper'] }>
                                    <label>Province</label>
                                    <InputField
                                        name="province"
                                        hint="Your province..."
                                        value={ addNewAddressFormData.province }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                                <div className={ styles['input-wrapper'] }>
                                    <label>City</label>
                                    <InputField
                                        name="city"
                                        hint="Your city..."
                                        value={ addNewAddressFormData.city }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>
                                    
                                <div className={styles['input-wrapper']}>
                                    <label>Barangay</label>
                                    <InputField
                                        name="barangay"
                                        hint="Your barangay..."
                                        value={ addNewAddressFormData.barangay }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                            </div>

                            <div className={ styles['input-wrapper-horizontal'] }>

                                <div className={styles['input-wrapper']}>
                                    <label>Street address</label>
                                    <InputField
                                        name="street_address"
                                        hint="Your street address..."
                                        value={ addNewAddressFormData.street_address }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                                <div className={ styles['input-wrapper'] } style={{ width: '8rem' }}>
                                    <label>Postal code</label>
                                    <InputField
                                        name="postal_code"
                                        hint=" "
                                        value={ addNewAddressFormData.postal_code }
                                        onChange={ handleAddNewAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                            </div>

                                <label className={ styles['checkbox-container'] }>
                                    <input
                                        type="checkbox"
                                        name="is_default_billing"
                                        onChange={ handleAddNewAddressFormInputChange }
                                        className={ styles['checkbox'] }
                                    />
                                    <span className={ styles['checkmark'] }></span>
                                    Set as default billing address
                                </label>

                                <label className={ styles['checkbox-container'] }>
                                    <input
                                        type="checkbox"
                                        name="is_default_shipping"
                                        onChange={ handleAddNewAddressFormInputChange }
                                        className={ styles['checkbox'] }
                                    />
                                    <span className={ styles['checkmark'] }></span>
                                    Set as default shipping address
                                </label>
                            
                        </div>
                        
                        <div className={ styles['modal-ctas'] }>
                            <Button 
                                type="secondary" 
                                label="Cancel" 
                                action={() => {
                                    setIsModalOpen(false);
                                    resetAddNewAddressFormData();
                                }} 
                            />
                            <Button 
                                type="primary" 
                                label={ 'Add new address' } 
                                action={ handleAddNewAddressSubmit }
                                disabled={
                                    !addNewAddressFormData.full_name ||
                                    !addNewAddressFormData.province ||
                                    !addNewAddressFormData.city ||
                                    !addNewAddressFormData.barangay ||
                                    !addNewAddressFormData.street_address ||
                                    !addNewAddressFormData.phone_number ||
                                    !addNewAddressFormData.postal_code
                                }
                            />
                        </div>
                    </Modal>

                    <Modal
                        isOpen={ isModalOpen && modalType === 'edit-address-modal' }
                        onClose={ () => setIsModalOpen(false) }
                        label={ 'Edit address' }
                    >
                        <div className={ styles['notice'] }>
                            <i className='fa-solid fa-triangle-exclamation'></i>
                            <p>Setting this address as your default billing or shipping will replace your current default. Only one address can be set as default for each.</p>
                        </div>

                        <div className={ styles['inputs-container'] }>

                            <div className={ styles['input-wrapper-horizontal'] }>

                                <div className={styles['input-wrapper']}>
                                    <label>Full name</label>
                                    <InputField
                                        name="full_name"
                                        hint="Your full name..."
                                        value={ editAddressFormData.full_name }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                                <div className={styles['input-wrapper']} style={{ width: '24rem' }}>
                                    <label>Phone number</label>
                                    <InputField
                                        name="phone_number"
                                        hint="Your phone number..."
                                        value={ editAddressFormData.phone_number }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                            </div>

                            <div className={ styles['input-wrapper-horizontal'] }>

                                <div className={ styles['input-wrapper'] }>
                                    <label>Province</label>
                                    <InputField
                                        name="province"
                                        hint="Your province..."
                                        value={ editAddressFormData.province }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                                <div className={ styles['input-wrapper'] }>
                                    <label>City</label>
                                    <InputField
                                        name="city"
                                        hint="Your city..."
                                        value={ editAddressFormData.city }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>
                                    
                                <div className={styles['input-wrapper']}>
                                    <label>Barangay</label>
                                    <InputField
                                        name="barangay"
                                        hint="Your barangay..."
                                        value={ editAddressFormData.barangay }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                            </div>

                            <div className={ styles['input-wrapper-horizontal'] }>

                                <div className={styles['input-wrapper']}>
                                    <label>Street address</label>
                                    <InputField
                                        name="street_address"
                                        hint="Your street address..."
                                        value={ editAddressFormData.street_address }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                                <div className={ styles['input-wrapper'] } style={{ width: '8rem' }}>
                                    <label>Postal code</label>
                                    <InputField
                                        name="postal_code"
                                        hint=" "
                                        value={ editAddressFormData.postal_code }
                                        onChange={ handleEditAddressFormInputChange }
                                        isSubmittable={ false }
                                        type="text"
                                    />
                                </div>

                            </div>

                                <label className={ styles['checkbox-container'] }>
                                    <input
                                        type="checkbox"
                                        name="is_default_billing"
                                        checked={ editAddressFormData.is_default_billing }
                                        onChange={ handleEditAddressFormInputChange }
                                        className={ styles['checkbox'] }
                                    />
                                    <span className={ styles['checkmark'] }></span>
                                    Set as default billing address
                                </label>

                                <label className={ styles['checkbox-container'] }>
                                    <input
                                        type="checkbox"
                                        name="is_default_shipping"
                                        checked={ editAddressFormData.is_default_shipping }
                                        onChange={ handleEditAddressFormInputChange }
                                        className={ styles['checkbox'] }
                                    />
                                    <span className={ styles['checkmark'] }></span>
                                    Set as default shipping address
                                </label>
                            
                        </div>
                        
                        <div className={ styles['modal-ctas'] }>
                            <Button 
                                type="secondary" 
                                label="Cancel" 
                                action={() => {
                                    setIsModalOpen(false);
                                    resetEditAddressFormData();
                                }} 
                            />
                            <Button 
                                type="primary" 
                                label={ 'Update address' } 
                                action={ handleEditAddressSubmit }
                                disabled={
                                    !editAddressFormData.full_name ||
                                    !editAddressFormData.province ||
                                    !editAddressFormData.city ||
                                    !editAddressFormData.barangay ||
                                    !editAddressFormData.street_address ||
                                    !editAddressFormData.phone_number ||
                                    !editAddressFormData.postal_code
                                }
                            />
                        </div>
                    </Modal>

                    <Modal label='Delete Address Confirmation' isOpen={ isModalOpen && modalType === 'delete-address-confirmation' } onClose={ () => setIsModalOpen(false) }>
                        <p className={ styles['modal-info'] }>You are about to <strong>permanently delete your address</strong>. This action cannot be reversed. Are you absolutely sure you want to proceed?</p>
                        <div className={ styles['modal-ctas'] }>
                            <Button
                                label='Confirm'
                                type='secondary'
                                action={ () => {
                                    setIsModalOpen(false);
                                    handleAddressRemoval();
                                }}
                            />
                            <Button
                                label='Cancel'
                                type='primary'
                                action={ () => {
                                    setModalType('');
                                    setIsModalOpen(false);
                                }}
                            />
                        </div>
                    </Modal>
                </>
            )}

        </>
    );
};

export default Profile;
