import { useState, useEffect } from 'react';
import { InputField, Button, Anchor, ReturnButton, Accordion, Modal } from '@components';
import { useToast, useAuth, useReservation } from '@contexts';
import styles from './Profile.module.css';
import { useNavigate } from 'react-router';

const Profile = ({}) => {

    const navigate = useNavigate();
    const { user, loading, logout, isUpdatingAvatar, isRemovingAvatar, updateAvatar, removeAvatar, updatePersonalInfo: updatePersonalInfoAPI, updateAddress: updateAddressAPI, updatePassword: updatePasswordAPI, remove } = useAuth();
    const { reservationItems, clearReservations } = useReservation();
    const { showToast } = useToast();
    const cancelledReservations = reservationItems.filter(reservation => reservation['status'].toLowerCase() === 'cancelled');
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
        address: ''
    });
    const [ passwordInfo, setPasswordInfo ] = useState({
        password: '',
        confirmPassword: ''
    })
    const [ isPersonalInfoChanged, setIsPersonalInfoChanged ] = useState(false);
    const [ isAddressInfoChanged, setIsAddressInfoChanged ] = useState(false);
    const [ isPasswordInfoChanged, setIsPasswordInfoChanged ] = useState(false);
    const [ doPasswordsMatch, setDoPasswordsMatch ] = useState(true);
    const [ showPassword, setShowPassword ] = useState(false);
    const [ showConfirmPassword, setShowConfirmPassword ] = useState(false);
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
    const handleAddressInfoChange = (value) => {
        setAddressInfo({ address: value });
        setIsAddressInfoChanged(value !== (user?.address || ''));
    };
    const handlePasswordChange = (field, value) => {

        const updatedInfo = { ...passwordInfo, [ field ]: value };
        setPasswordInfo(updatedInfo);

        setDoPasswordsMatch(updatedInfo['password'] === '' || updatedInfo['confirmPassword'] === '' || updatedInfo['password'] === updatedInfo['confirmPassword']);

        const hasContent = updatedInfo['password'] !== '' && updatedInfo['confirmPassword'] !== '';
        setIsPasswordInfoChanged(hasContent && updatedInfo['password'] === updatedInfo['confirmPassword']);

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

    const updateAddressInfo = async () => {
        const result = await updateAddressAPI(addressInfo.address);

        if (result?.error) {
            showToast(`Failed to update address: ${result.error}`, 'error');
        } else {
            showToast('Address updated successfully', 'success');
            setIsAddressInfoChanged(false);
        }
    };

    const updatePasswordInfo = async () => {
        if (passwordInfo.password !== passwordInfo.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const result = await updatePasswordAPI(passwordInfo.password);

        if (result?.error) {
            showToast(`Failed to update password: ${result.error}`, 'error');
        } else {
            showToast('Password updated successfully', 'success');
            setPasswordInfo({ password: '', confirmPassword: '' });
            setIsPasswordInfoChanged(false);
            setDoPasswordsMatch(true);
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
        setAddressInfo({ address: user?.address || '' })
        setIsAddressInfoChanged(false);
    };
    const resetPasswordInfo = () => {
        setAddressInfo({ password: '', confirmPassword: '' });
        setIsPasswordInfoChanged(false);
        setDoPasswordsMatch(true);
    };
    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };
    const handleConfirmPasswordToggle = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    useEffect(() => {
        if (user) {
            setPersonalInfo({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                contact_number: user.contact_number || ''
            });
            setAddressInfo({
                address: user.address || ''
            });
        }
    }, [user]);

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
                                    src={user?.image_url 
                                        ? `https://res.cloudinary.com/dfvy7i4uc/image/upload/${user['image_url']}` 
                                        : "https://static.vecteezy.com/system/resources/thumbnails/004/511/281/small_2x/default-avatar-photo-placeholder-profile-picture-vector.jpg"} 
                                    alt="User avatar" 
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
                        <section className={ styles['info-address'] }>
                            <h2>Address Information</h2>
                            <div className={ styles['inputs-container'] }>
                                <div className={ styles['input-wrapper'] }>
                                    <label htmlFor="address">
                                        Address
                                    </label>
                                    <InputField
                                        value={ addressInfo['address'] }
                                        onChange={ event => handleAddressInfoChange(event['target']['value']) }
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
                                            setModalType('update-address-info-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        disabled={ !isAddressInfoChanged }
                                    />
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-rotate-left'
                                        iconPosition='left'
                                        label='Reset'
                                        action={ () => {
                                            setModalType('reset-address-info-confirmation');
                                            setIsModalOpen(true);
                                        }}
                                        externalStyles={ styles['action-warn'] }
                                        disabled={ !isAddressInfoChanged }
                                    />
                                </div>
                            </div>
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-reservation'] }>
                            <h2>Reservation History</h2>
                            { cancelledReservations.length === 0 ? (
                                <div className={ styles['info-reservation-empty'] }>
                                    <h3>You Currently Do Not Have a Cancelled Reservation</h3>
                                    <p>Start browsing for items in <Anchor label="Motorcycles" link="/motorcycles" isNested={ false }/> or <Anchor label="Parts & Accessories" link="/parts-and-accessories" isNested={ false }/>.</p>
                                    <p>or</p>
                                    <p>Add items to <Anchor label="Cart" link="/cart" isNested={ false }/> to reserve by batch.</p>
                                </div>
                            ) : (
                                <div className={ styles['info-reservation-list'] }>
                                    { cancelledReservations.map(reservation => (
                                        <Accordion
                                            key={ reservation['reservation_id'] }
                                            label={` Reservation #${ reservation['reservation_id'] } `}
                                            externalStyles={ styles['info-reservation-list-item'] }
                                            isOpenByDefault={ false }
                                        >
                                            <div className={ styles['info-reservation-list-item-container'] }>
                                                <div className={ styles['info-reservation-list-item-details'] }>
                                                    <span>
                                                        <h3>Reservation Details</h3>
                                                        <h4>{ reservation['status'].charAt(0).toUpperCase() + reservation['status'].slice(1) }</h4>
                                                    </span>
                                                    <div className={ styles['info-reservation-list-item-details-container'] }>
                                                        <div className={ styles['info-reservation-list-item-details-item'] }>
                                                            <h4>Account Id</h4>
                                                            <h4>{ user['account_id'] }</h4>
                                                        </div>
                                                        <div className={ styles['info-reservation-list-item-details-item'] }>
                                                            <h4>Full Name</h4>
                                                            <h4>{ user['first_name'] + ' ' + user['last_name'] }</h4>
                                                        </div>
                                                        <div className={ styles['info-reservation-list-item-details-item'] }>
                                                            <h4>Contact Number</h4>
                                                            <h4>{ user['contact_number'] }</h4>
                                                        </div>
                                                        <div className={ styles['info-reservation-list-item-details-item'] }>
                                                            <h4>Email Address</h4>
                                                            <h4>{ user['email'] }</h4>
                                                        </div>
                                                        <div className={ styles['info-reservation-list-item-details-item'] }>
                                                            <h4>Preferred Date</h4>
                                                            <h4>{new Date(reservation['preferred_date']).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long', 
                                                                day: 'numeric'
                                                            })}</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={ styles['divider-horizontal'] }></div>
                                                <div className={ styles['info-reservation-list-item-products'] }>
                                                    <h3>Reserved Products</h3>
                                                    { reservation['products'] && reservation['products'].map(product => (
                                                        <div 
                                                            key={ product['product_id'] }
                                                            className={ styles['info-reservation-list-item-product'] }
                                                            onClick={ () => {
                                                                product['category'].toLowerCase() === 'motorcycles'
                                                                ? navigate(`/motorcycles/${ product['product_id'] }`)
                                                                : navigate(`/parts-and-accessories/${ product['product_id'] }`)
                                                            }}
                                                        > 
                                                            <span>
                                                                <img src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${ product['image_url'] }`} alt="" />
                                                                <div className={ styles['info-reservation-list-item-product-details'] }>
                                                                    <span>
                                                                        <h3>{ product['label'] }</h3>
                                                                        <h4>₱{ parseFloat(product['price']).toLocaleString('en-PH', {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2
                                                                            })}
                                                                        </h4>
                                                                    </span>
                                                                    <h4>{`Qty.: ${ product['quantity'] }`}</h4>
                                                                </div>
                                                            </span>
                                                            <i className='fa-solid fa-square-up-right'></i>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Accordion>
                                    ))}
                                </div>
                            )}
                            <div className={ styles['info-reservation-action'] }>
                                <p>View your complete reservation history, including active, completed, and cancelled reservations with detailed status tracking.</p>
                                <Button
                                    type='secondary'
                                    label='Go to my reservations'
                                    icon='fa-solid fa-arrow-up-right-from-square'
                                    iconPosition='right'
                                    action={ () => navigate('/reservations') }
                                />
                            </div>
                        </section>
                        <div className={ styles['divider-horizontal'] }></div>
                        <section className={ styles['info-settings'] }>
                            <h2>Account Settings</h2>
                            <div className={ styles['inputs-container'] }>
                                {!doPasswordsMatch && (
                                    <div className={ styles['info-settings-notice'] }>
                                        <i className='fa-solid fa-triangle-exclamation'></i>
                                        <p>Passwords do not match</p>
                                    </div>
                                )}
                                <div className={ styles['inputs-wrapper'] }>
                                    <div className={ styles['input-wrapper'] }>
                                        <label htmlFor="password">
                                            Password
                                        </label>
                                        <InputField
                                            value={ passwordInfo['password'] }
                                            onChange={event => handlePasswordChange('password', event['target']['value'])}
                                            hint='Your password...'
                                            type={ showPassword ? 'text' : 'password' }
                                            icon={ showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                            action={ handlePasswordToggle }
                                            isSubmittable={ false }
                                        />
                                    </div>
                                    <div className={ styles['input-wrapper'] }>
                                        <label htmlFor="confirmPassword">
                                            Confirm Password
                                        </label>
                                        <InputField
                                            value={ passwordInfo['confirmPassword'] }
                                            onChange={event => handlePasswordChange('confirmPassword', event['target']['value'])}
                                            hint='Confirm your new password...'
                                            type={ showConfirmPassword ? 'text' : 'password' }
                                            icon={ showConfirmPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                            action={ handleConfirmPasswordToggle }
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
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                handleAvatarRemoval();
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
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                updatePersonalInfo();
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
            ) : modalType === 'update-address-info-confirmation' ? (
                <Modal label='Update Address Info Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to save changes to your address information? This will update address information.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                updateAddressInfo();
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
            ) : modalType === 'reset-address-info-confirmation' ? (
                <Modal label='Reset Address Info Confirmation' isOpen={ isModalOpen } onClose={ () => setIsModalOpen(false) }>
                    <p className={ styles['modal-info'] }>Are you sure you want to reset address information to its previous value? Any unsaved changes will be discarded.</p>
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
                    <p className={ styles['modal-info'] }>Are you sure you want to change your account password? You'll need to use your new password the next time you log in.</p>
                    <div className={ styles['modal-ctas'] }>
                        <Button
                            label='Confirm'
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                updatePasswordInfo();
                            }}
                            externalStyles={ styles['modal-warn'] }
                        />
                        <Button
                            label='Cancel'
                            type='secondary'
                            action={ () => {
                                setModalType('');
                                setIsModalOpen(false);
                                resetPasswordInfo();
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
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
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
                            type='primary'
                            action={ () => {
                                setIsModalOpen(false);
                                remove(user['account_id']);
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
            )}
        </>
    );
};

export default Profile;
