import { useState, useEffect } from 'react';
import { InputField, Button, Anchor, ReturnButton, Accordion, Modal, Dropdown } from '@components';
import { useToast, useAuth, useReservation, useSettings } from '@contexts';
import { useOAuth } from '@hooks';
import { getErrorMessage } from '@utils';
import styles from './Profile.module.css';
import { useNavigate, useSearchParams } from 'react-router';

const Profile = ({}) => {

    const navigate = useNavigate();
    const { user, loading, logout, isUpdatingAvatar, isRemovingAvatar, updateAvatar, removeAvatar, updatePersonalInfo: updatePersonalInfoAPI, updateAddress: updateAddressAPI, updatePassword: updatePasswordAPI, remove } = useAuth();
    const { reservationItems, clearReservations } = useReservation();
    const { settings, updateSettings, loading: settingsLoading } = useSettings();
    const { sendChangePasswordVerificationLink, changePassword } = useOAuth()
    const { showToast } = useToast();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const [ avatarFile, setAvatarFile ] = useState(null);
    const [ avatarPreview, setAvatarPreview ] = useState(null);
    const [ modalType, setModalType ] = useState('');
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ personalInfo, setPersonalInfo ] = useState({
        first_name: '',
        last_name: '',
        email: '',
        contact_number: ''
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

    const [ generalAddressInfo, setGeneralAddressInfo ] = useState({
        address: ''
    });
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
    const [ shippingAddressErrors, setShippingAddressErrors] = useState({});
    const [ billingAddressErrors, setBillingAddressErrors] = useState({});
    const queryToken = searchParams.get('token') || null;
    const errorToken = searchParams.get('error') || null;

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
            'gcash': 'GCash'
        };
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

        const hasChanged = updatedInfo['first_name'] !== (user?.first_name || '') || updatedInfo['last_name'] !== (user?.last_name || '') || updatedInfo['email'] !== (user?.email || '') || updatedInfo['contact_number'] !== (user?.contact_number || '')

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
    const updatePersonalInfo = async () => {
        const result = await updatePersonalInfoAPI(personalInfo);

        if (result?.error) {
            showToast(`Failed to update personal info: ${result.error}`, 'error');
        } else {
            showToast('Personal information updated successfully', 'success');
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

            const { newPassword, confirmNewPassword } = passwordInfo;
            const result = await changePassword(newPassword, queryToken);

            if (result?.error) {
                showToast(`Failed to update password: ${ result.error }`, 'error');
            } else {
                showToast('Password updated successfully', 'success');
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
          contact_number: user.contact_number || ''
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
        if (!phoneRegex.test(personalInfo.contact_number.replace(/\s/g, ''))) {
            errors.contact_number = 'Please enter a valid Philippine phone number';
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
                contact_number: user.contact_number || ''
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
            setPlatformSettings({
                currency: settings.currency || 'PHP',
                preferred_shipping_address: settings.preferred_shipping_address || 'home',
                preferred_payment_method: settings.preferred_payment_method || 'cash_on_delivery'
            });
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

    if (loading || !user) return null;

    return(
        <>
            <div className={ styles['wrapper'] }>

                <div className={ styles['header'] }>
                    <ReturnButton />
                    <h1>My Profile</h1>
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
                                <h4><strong>Member since:</strong> {user['created_at'] ? new Date(user['created_at']).toISOString().replace('T', ' ').slice(0, 19) : 'N/A'}</h4>
                                <h4><strong>Last modified since:</strong> {user['modified_at'] ? new Date(user['modified_at']).toISOString().replace('T', ' ').slice(0, 19) : 'N/A'}</h4>
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
                                            value={ personalInfo['contact_number'] }
                                            onChange={ event => handlePersonalInfoChange('contact_number', event['target']['value'] )}
                                            error={ validationErrors['contact_number'] }
                                        />
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
                                                options= {[
                                                    {
                                                        label: 'Philippine Peso (₱)',
                                                        action: () => { handlePlatformSettingsChange ('currency', 'PHP')},
                                                    },
                                                    {
                                                        label: 'US Dollar ($)',
                                                        action: () => { handlePlatformSettingsChange ('currency', 'USD')},
                                                    },
                                                    {
                                                        label: 'Euro (€)',
                                                        action: () => { handlePlatformSettingsChange ('currency', 'EUR')},
                                                    },
                                                    {
                                                        label: 'Japanese Yen (¥)',
                                                        action: () => { handlePlatformSettingsChange ('currency', 'JPY')},
                                                    },
                                                    {
                                                        label: 'Canadian Dollar (C$)',
                                                        action: () => { handlePlatformSettingsChange ('currency', 'CAD')},
                                                    },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <div className={ styles['input-wrapper'] }>
                                        <label htmlFor="shipping_address">Preferred Shipping Address</label>
                                        <div className={ styles['dropdown-container'] }>
                                            <Button
                                                id='preferred-shipping-address'
                                                type='secondary'
                                                label={`${getShippingLabel(platformSettings.preferred_shipping_address)}`}
                                                dropdownPosition='right'
                                                options= {[
                                                    {
                                                        label: 'Home Address',
                                                        action: () => { handlePlatformSettingsChange ('preferred_shipping_address', 'home')},
                                                    },
                                                    {
                                                        label: 'Billing Address',
                                                        action: () => { handlePlatformSettingsChange ('preferred_shipping_address', 'billing')},
                                                    },
                                                    {
                                                        label: 'Shipping Address',
                                                        action: () => { handlePlatformSettingsChange ('preferred_shipping_address', 'billing')},
                                                    },
                                                ]}
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
                                                options= {[
                                                    {
                                                        label: 'Cash on Delivery',
                                                        action: () => { handlePlatformSettingsChange ('preferred_payment_method', 'cash_on_delivery')},
                                                    },
                                                    {
                                                        label: 'Bank Transfer',
                                                        action: () => { handlePlatformSettingsChange ('preferred_payment_method', 'bank_transfer')},
                                                    },
                                                    {
                                                        label: 'GCash',
                                                        action: () => { handlePlatformSettingsChange ('preferred_payment_method', 'gcash')},
                                                    },
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
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-address-general'] }>
                            <h2> Home Address</h2>
                            <div className={ styles['inputs-container'] }>
                                <div className={ styles['input-wrapper'] }>
                                    <label htmlFor="general_address">Address</label>
                                    <InputField
                                        value={ generalAddressInfo.address }
                                        onChange={ event => handleGeneralAddressChange(event['target']['value']) }
                                        hint='Your address...'
                                        type='text'
                                        isSubmittable={ false }
                                    />
                                </div>
                                <div className={ styles['info-address-ctas'] }>
                                    <Button
                                        type='primary'
                                        icon='fa-solid fa-circle-check'
                                        iconPosition='left'
                                        label='Update address info'
                                        action={ () => {
                                            setModalType('update-general-address-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ !isGeneralAddressChanged }
                                    />
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        label='Reset'
                                        action={ () => {
                                            setModalType('reset-general-address-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        externalStyles={ styles['action-warn'] }
                                        disabled={ !isGeneralAddressChanged }
                                    />
                                </div>
                            </div>
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-address'] }>
                            <h2>Shipping Address</h2>
                            <div className={ styles['inputs-container'] }>
                                <div className={ styles['inputs-wrapper'] }>
                                    <div className={`${styles['input-wrapper']} ${shippingAddressErrors.street ? styles['has-error'] : ''}`}>
                                        <label htmlFor="shipping_street">Street Address</label>
                                        <InputField
                                            value={ addressInfo.shipping_address.street }
                                            onChange={ event => handleShippingAddressChange('street', event['target']['value']) }
                                            hint='Your street address...'
                                            type='text'
                                            isSubmittable={ false }
                                            error={ shippingAddressErrors.street }
                                        />
                                        {shippingAddressErrors.street && (
                                            <div className={ styles['input-error'] }>{shippingAddressErrors.street}</div>
                                        )}
                                    </div>
                                    <div className={`${styles['input-wrapper']} ${shippingAddressErrors.city ? styles['has-error'] : ''}`}>
                                        <label htmlFor="shipping_city">City</label>
                                        <InputField
                                            value={ addressInfo.shipping_address.city }
                                            onChange={ event => handleShippingAddressChange('city', event['target']['value']) }
                                            hint='Your city...'
                                            type='text'
                                            isSubmittable={ false }
                                            error={ shippingAddressErrors.city }
                                        />
                                        {shippingAddressErrors.city && (
                                            <div className={ styles['input-error'] }>{shippingAddressErrors.city}</div>
                                        )}
                                    </div>
                                </div>
                                <div className={ styles['inputs-wrapper'] }>
                                    <div className={`${styles['input-wrapper']} ${shippingAddressErrors.state ? styles['has-error'] : ''}`}>
                                        <label htmlFor="shipping_state">State/Province</label>
                                        <InputField
                                            value={ addressInfo.shipping_address.state }
                                            onChange={ event => handleShippingAddressChange('state', event['target']['value']) }
                                            hint='Your state or province...'
                                            type='text'
                                            isSubmittable={ false }
                                            error={ shippingAddressErrors.state }
                                        />
                                        {shippingAddressErrors.state && (
                                            <div className={ styles['input-error'] }>{shippingAddressErrors.state}</div>
                                        )}
                                    </div>
                                    <div className={`${styles['input-wrapper']} ${shippingAddressErrors.postal_code ? styles['has-error'] : ''}`}>
                                        <label htmlFor="shipping_postal">Postal Code</label>
                                        <InputField
                                            value={ addressInfo.shipping_address.postal_code }
                                            onChange={ event => handleShippingAddressChange('postal_code', event['target']['value']) }
                                            hint='Your postal code...'
                                            type='text'
                                            isSubmittable={ false }
                                            error={ shippingAddressErrors.postal_code }
                                        />
                                        {shippingAddressErrors.postal_code && (
                                            <div className={ styles['input-error'] }>{shippingAddressErrors.postal_code}</div>
                                        )}
                                    </div>
                                </div>
                                <div className={ styles['info-address-ctas'] }>
                                    <Button
                                        type='primary'
                                        icon='fa-solid fa-circle-check'
                                        iconPosition='left'
                                        label='Update shipping address'
                                        action={ () => {
                                            setModalType('update-shipping-address-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ !isShippingAddressChanged }
                                    />
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        label='Reset'
                                        action={ () => {
                                            setModalType('reset-shipping-address-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        externalStyles={ styles['action-warn'] }
                                        disabled={ !isShippingAddressChanged }
                                    />
                                </div>
                            </div>
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-billing'] }>
                            <h2>Billing Address</h2>
                            <div className={ styles['inputs-container'] }>
                                <div className={ styles['billing-same-address'] }>
                                    <label className={ styles['checkbox-label'] }>
                                        <input
                                            type="checkbox"
                                            checked={addressInfo.billing_address.same_as_shipping}
                                            onChange={(e) => handleBillingAddressChange('same_as_shipping', e.target.checked)}
                                        />
                                        <span>Same as shipping address</span>
                                    </label>
                                </div>
                                {!addressInfo.billing_address.same_as_shipping && (
                                    <>
                                        <div className={ styles['inputs-wrapper'] }>
                                            <div className={`${styles['input-wrapper']} ${billingAddressErrors.street ? styles['has-error'] : ''}`}>
                                                <label htmlFor="billing_street">Street Address</label>
                                                <InputField
                                                    value={ addressInfo.billing_address.street }
                                                    onChange={ event => handleBillingAddressChange('street', event['target']['value']) }
                                                    hint='Your billing street address...'
                                                    type='text'
                                                    isSubmittable={ false }
                                                    error={ billingAddressErrors.street }
                                                />
                                                {billingAddressErrors.street && (
                                                    <div className={ styles['input-error'] }>{billingAddressErrors.street}</div>
                                                )}
                                            </div>
                                            <div className={`${styles['input-wrapper']} ${billingAddressErrors.city ? styles['has-error'] : ''}`}>
                                                <label htmlFor="billing_city">City</label>
                                                <InputField
                                                    value={ addressInfo.billing_address.city }
                                                    onChange={ event => handleBillingAddressChange('city', event['target']['value']) }
                                                    hint='Your billing city...'
                                                    type='text'
                                                    isSubmittable={ false }
                                                    error={ billingAddressErrors.city }
                                                    disabled={true}
                                                />
                                                {billingAddressErrors.city && (
                                                    <div className={ styles['input-error'] }>{billingAddressErrors.city}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={ styles['inputs-wrapper'] }>
                                            <div className={`${styles['input-wrapper']} ${billingAddressErrors.state ? styles['has-error'] : ''}`}>
                                                <label htmlFor="billing_state">State/Province</label>
                                                <InputField
                                                    value={ addressInfo.billing_address.state }
                                                    onChange={ event => handleBillingAddressChange('state', event['target']['value']) }
                                                    hint='Your billing state or province...'
                                                    type='text'
                                                    isSubmittable={ false }
                                                    error={ billingAddressErrors.state }
                                                />
                                                {billingAddressErrors.state && (
                                                    <div className={ styles['input-error'] }>{billingAddressErrors.state}</div>
                                                )}
                                            </div>
                                            <div className={`${styles['input-wrapper']} ${billingAddressErrors.postal_code ? styles['has-error'] : ''}`}>
                                                <label htmlFor="billing_postal">Postal Code</label>
                                                <InputField
                                                    value={ addressInfo.billing_address.postal_code }
                                                    onChange={ event => handleBillingAddressChange('postal_code', event['target']['value']) }
                                                    hint='Your billing postal code...'
                                                    type='text'
                                                    isSubmittable={ false }
                                                    error={ billingAddressErrors.postal_code }
                                                />
                                                {billingAddressErrors.postal_code && (
                                                    <div className={ styles['input-error'] }>{billingAddressErrors.postal_code}</div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className={ styles['info-address-ctas'] }>
                                    <Button
                                        type='primary'
                                        icon='fa-solid fa-circle-check'
                                        iconPosition='left'
                                        label='Update billing address'
                                        action={ () => {
                                            setModalType('update-billing-address-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ !isBillingAddressChanged }
                                    />
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        label='Reset'
                                        action={ () => {
                                            setModalType('reset-billing-address-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        externalStyles={ styles['action-warn'] }
                                        disabled={ !isBillingAddressChanged }
                                    />
                                </div>
                            </div>
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>
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
                        <section className={ styles['info-danger'] }>
                            <h2>Danger Zone</h2>
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
            ) : modalType === 'clear-reservation-confirmation' ? (
                <Modal label='Clear Reservation History Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to permanently delete all cancelled reservations from your history. This action cannot be undone.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                clearReservations();
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
        </>
    );
};

export default Profile;
