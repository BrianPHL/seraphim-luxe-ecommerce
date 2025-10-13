import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { performOperationWithTimeout, fetchWithTimeout, apiRequest, extractAccountData, TIMEOUTS, getBaseURL } from '@utils';
import { useOAuth } from "@hooks";
import { useToast } from "@contexts";
import AuthContext from "./context";
import { phoneNumber } from "better-auth/plugins";

export const AuthProvider = ({ children, auditLoggers = {} }) => {

    const [ user, setUser ] = useState(null);
    const [ userList, setUserList ] = useState([]);
    const [ addressBook, setAddressBook ] = useState(null);
    const [ isInitializing, setIsInitializing ] = useState(true);
    const [ isUpdatingAvatar, setIsUpdatingAvatar ] = useState(false);
    const [ isRemovingAvatar, setIsRemovingAvatar ] = useState(false);
    const [ isPopupOpen, setIsPopupOpen ] = useState(false);
    const [ userCount, setUserCount ] = useState(0);
    const [ otpModalData, setOtpModalData ] = useState({
        show: false,
        data: {
            type: null,
            email: null,
        },
        loading: false,
        onSuccess: null
    });
    const { signOut, getSession, signInThruEmail, signUpThruEmail, sendVerificationOTP, revokeSession } = useOAuth();
    const { showToast } = useToast();
    const { logSignIn, logSignUp, logSignOut, logProfileUpdate, logPasswordChange, logCustomerAccountDelete, logAdminAccountDelete, logAdminAccountUpdate, logAdminAccountCreate } = auditLoggers;
    const navigate = useNavigate();

    useEffect(() => {

        const initializeAuthentication = async () => {

            try {
                
                const session = await getSession();
                const sessionData = session?.data?.session;
                const sessionUser = session?.data?.user;

                if (!sessionUser)
                    return;

                if (sessionUser.is_suspended) {
                 
                    revokeSession(sessionData?.token);
                    
                    (sessionUser.role === 'admin')
                    ? window.location.href = `${ getBaseURL() }/admin/sign-in?error=ACCOUNT_CURRENTLY_SUSPENDED`
                    : window.location.href = (`${ getBaseURL() }/sign-in?error=ACCOUNT_CURRENTLY_SUSPENDED`)
                    
                    return;

                }

                setUser(session.data.user);

            } catch (err) {
                console.error("Auth context initializeAuth function error: ", err);
            } finally {
                setIsInitializing(false);
            }

        };

        initializeAuthentication();

    }, []);

    useEffect(() => {

        if (!user) return;
            getAddressBook();

    }, [ user ]);

    const showOTP = async (type, email, callback) => {

        try {

            setOtpModalData({
                show: true,
                data: {
                    type: type,
                    email: email,
                },
                loading: true,
                onSuccess: callback
            });

            await performOperationWithTimeout(
                await sendVerificationOTP(email, type),
                TIMEOUTS.AUTH_EXTERNAL
            );

            setOtpModalData({
                show: true,
                data: {
                    type: type,
                    email: email,
                },
                loading: false,
                onSuccess: callback
            });

        } catch (err) {
            console.error("Auth context showOTP function error: ", err);
            showToast('An error occured! Failed to send OTP verification code.', 'error');
            hideOTP();
        }
    };

    const hideOTP = () => {

        setOtpModalData({
            show: false,
            data: {
                type: null,
                email: null,
            },
            loading: false,
            onSuccess: null
        });

    };

    const handleOTPSuccess = async (result) => {

        if (otpModalData.onSuccess)
            await otpModalData.onSuccess(result);
        
        hideOTP();

    };

    const signIn = async (data) => {

        try {
            
            
            const signInThruEmailResult = await performOperationWithTimeout(
                await signInThruEmail(data),
                TIMEOUTS.AUTH_EXTERNAL
            );
            
            if (signInThruEmailResult?.error) {

                const errorData = {
                    code: signInThruEmailResult.error?.code,
                    message: signInThruEmailResult.error?.message,
                    details: signInThruEmailResult.error?.details || "No details provided."
                };

                if (errorData.code === 'EMAIL_NOT_VERIFIED') {
                    await showOTP('email-verification', data.email, async (result) => {

                        if (result.data.user) 
                            signIn(data);

                    });
                    return;
                }

                return { error: errorData };

            }

        await completeSignInProcess(); // This sets the user context

        // Get user info from signInThruEmailResult
        const signedInUser = signInThruEmailResult?.data?.user;
        // Pass user info directly to logSignIn
        if (logSignIn && signedInUser) {
            await logSignIn(
                `User signed in: ${signedInUser.email}`,
                {
                    user_id: signedInUser.id,
                    first_name: signedInUser.first_name,
                    last_name: signedInUser.last_name,
                    name: `${signedInUser.first_name || ''} ${signedInUser.last_name || ''}`.trim(),
                    email: signedInUser.email,
                    role: signedInUser.role
                },
                {
                    user_id: signedInUser.id,
                    first_name: signedInUser.first_name,
                    last_name: signedInUser.last_name,
                    name: `${signedInUser.first_name || ''} ${signedInUser.last_name || ''}`.trim(),
                    email: signedInUser.email,
                    role: signedInUser.role
                }
            );
        }

            return signInThruEmailResult;

        } catch (err) {
            console.error('Auth context signIn function error: ', err);
            return { error: err };
        }

    };

    const completeSignInProcess = async () => {

        try {

            const sessionResult = await performOperationWithTimeout(
                await getSession(),
                TIMEOUTS.AUTH_EXTERNAL
            );
            const sessionUser = sessionResult?.data?.user;
            
            if (sessionUser) {
                
                setUser(sessionUser);
                localStorage.setItem('user', JSON.stringify(sessionUser));
                showToast(`Welcome back, ${ sessionUser.name }!`, 'success');
                    
                return;

            }

            console.error("Auth contexts completeSignInProcess error: No session found! Logged in user failed to save!");

        } catch (err) {
            console.error('Auth context completeSignInProcess function error: ', err);
            return { error: err };
        }

    };

    const signUp = async(data) => {

        try {

            const result = await performOperationWithTimeout(
                await signUpThruEmail(data),
                TIMEOUTS.AUTH_EXTERNAL
            );

            if (result?.error) {
                const errorData = {
                    code: result?.error?.code,
                    message: result?.error?.message,
                    details: result?.error?.details || "No details provided."
                }
                console.error("Auth context create function Better Auth API error: ", errorData.code, errorData.message, errorData.details || "No error details provided");
                return { error: errorData };
            }

            showToast(`Account created successfully! You may now sign in.`, 'success');

            // Log successful sign up - Fix the parameter structure
            if (user && user.role === 'admin' && logAdminAccountCreate) {
                await logAdminAccountCreate(
                    result?.data?.user?.id,
                    {
                        email: result?.data?.user?.email,
                        first_name: result?.data?.user?.first_name,
                        last_name: result?.data?.user?.last_name,
                        role: result?.data?.user?.role
                    },
                    {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                        email: user.email,
                        role: user.role
                    }
                );
            } else if (logSignUp) {
                await logSignUp(
                    `New account created: ${data.email}`,
                    {
                        user_id: result?.data?.user?.id,
                        email: data.email,
                        first_name: data.firstName,
                        last_name: data.lastName,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        role: 'customer'
                    }
                );
            }

            return result;
        
        } catch (err) {
            console.error('Auth context create function error: ', err);
            return { error: err.message };
        }

    };

    const logout = async () => {
        try {

            let currentUser = user;

            if (!currentUser) {
                const sessionResult = await getSession();
                currentUser = sessionResult?.data?.user || JSON.parse(localStorage.getItem('user'));
            }

            if (currentUser && logSignOut) {
                await logSignOut(`User signed out: ${currentUser.email}`, {
                    user_id: currentUser.id,
                    first_name: currentUser.first_name,
                    last_name: currentUser.last_name,
                    email: currentUser.email,
                    name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
                    role: currentUser.role
                });
            }

            await signOut(); 
            localStorage.removeItem('user');
            setUser(null);
            showToast('Logged out successfully.', 'success');
            navigate('/sign-in');

        } catch (err) {
            console.error('Auth context logout function error:', err);
            localStorage.removeItem('user');
            setUser(null);
            showToast('Logged out successfully.', 'success');
            navigate('/sign-in');
        }
    };

    const updatePersonalInfo = async (personalInfo) => {
        
        try {

            // Capture old values for audit logging
            const oldValues = {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number,
                address: user.address,
            };
        
            const data = await apiRequest(`/api/accounts/${ !personalInfo.id ? user.id : personalInfo.id }/personal-info`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(personalInfo)
            }, TIMEOUTS.FILE_UPLOAD_API);

            if (logProfileUpdate) {
                await logProfileUpdate(oldValues, personalInfo, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    role: user.role,
                    phone_number: user.phone_number
                });
            }

            return data;
        
        } catch (err) {
            console.error('Error updating personal info:', err);
            return { error: err.message };
        }

    };

    const updatePassword = async (password) => {

        if (!user) return { error: 'User not logged in' };

        try {
            setIsInitializing(true);

            const response = await fetch(`/api/accounts/${user.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }
            showToast('Password updated successfully!', 'success');

            if (logPasswordChange) {
                await logPasswordChange(`Password changed for: ${user.email}`, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
            }

            return { success: true };
        } catch (err) {
            console.error("Failed to update password:", err);
            return { error: err.message };
        } finally {
            setIsInitializing(false);
        }
    };

    const getAddressBook = async () => {
    
        if (!user) return { error: 'User not logged in' };

        try {
            setIsInitializing(true);
            const response = await fetchWithTimeout(`/api/accounts/${ user.id }/address`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get address book');
            }
            
            setAddressBook(data);

        } catch (err) {
            console.error("AuthContext getAddressBook function error: ", err);
            return { error: err };
        } finally {
            setIsInitializing(false);
        }
    };

    const addAddress = async (addressData) => {

        if (!user) return { error: 'User not logged in' };

        try {

            setIsInitializing(true);

            const response = await fetchWithTimeout(`/api/accounts/${ user.id }/address`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add address');
            }

            const updatedUser = { ...data };
            setUser(updatedUser);

            if (logProfileUpdate) {
                await logProfileUpdate({}, addressData, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
            }

            localStorage.setItem('user', JSON.stringify(updatedUser));

        } catch (err) {
            console.error("AuthContext addNewAddress function error: ", err);
            return { error: err };
        } finally {
            setIsInitializing(false);
        }

    };

    const updateAddress = async (addressData) => {

        if (!user) return { error: 'User not logged in' };

        try {

            setIsInitializing(true);

            const response = await fetchWithTimeout(`/api/accounts/${ user.id }/${ addressData.id }/address`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to modify address');
            }

            const updatedUser = { ...data };
            setUser(updatedUser);

            if (logProfileUpdate) {
                await logProfileUpdate({}, addressData, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
            }

            localStorage.setItem('user', JSON.stringify(updatedUser));

        } catch (err) {
            console.error("AuthContext updateAddress function error: ", err);
            return { error: err };
        } finally {
            setIsInitializing(false);
        }

    };

    const deleteAddress = async (id) => {

        if (!user) return { error: 'User not logged in' };

        try {

            setIsInitializing(true);

            const response = await fetchWithTimeout(`/api/accounts/${ id }/address`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete address');
            }

            if (logProfileUpdate) {
                await logProfileUpdate({}, { deleted_address_id: id }, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    role: user.role
                });
            }

        } catch (err) {
            console.error("AuthContext deleteAddress function error: ", err);
            return { error: err };
        } finally {
            setIsInitializing(false);
        }

    }

    const remove = async (id) => {
        
        if (!user) return { error: 'User not logged in' };

        try {

            setIsInitializing(true);

            // Get account data before deletion for audit logging
            const accountResponse = await fetch(`/api/accounts/${id}`);
            const accountData = accountResponse.ok ? await accountResponse.json() : {};

            
            // Log customer self-deletion
            if (logCustomerAccountDelete && id === user.id) {
                await logCustomerAccountDelete(id, accountData, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
            }
            
            // Log admin deleting another user's account
            if (logAdminAccountDelete && user.role === 'admin' && id !== user.id) {
                await logAdminAccountDelete(id, accountData, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
            }

            const response = await fetch(`/api/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete account');
            }
            showToast('Account deleted successfully.', 'success');

            // Only log out if the deleted account is the current user
            if (id === user.id) {
                // Skip audit logging in logout since user is already deleted
                await signOut(); 
                // localStorage.removeItem('user');
                setUser(null);
                navigate('/sign-in');
            }

            return { success: true };
        } catch (err) {
            console.error("Failed to delete account:", err);
            return { error: err.message };
        } finally { setIsInitializing(false); }

    };

    const updateAvatar = async (file) => {

        if (!user || !file) return { error: 'Missing user or file!' };

        try {

            setIsUpdatingAvatar(true);

            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetchWithTimeout(`/api/accounts/${user['id']}/avatar`, {
                method: 'POST',
                body: formData
            }, TIMEOUTS.FILE_UPLOAD_API);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data['error'] || 'Failed to upload avatar!');
            }

            const updatedUser = { ...user, image_url: data['image_url'] };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser))

            if (logProfileUpdate) {
                await logProfileUpdate({}, { avatar_updated: true }, {
                    user_id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                });
            }

            return data;

        } catch (err) {
            console.error("Failed to update avatar:", err);
            return { error: err.message };
        } finally { setIsUpdatingAvatar(false); }

    }

    const removeAvatar = async () => {

        if (!user) return;

        try {

            setIsRemovingAvatar(true);

            const response = await fetch(`/api/accounts/${ user['id'] }/avatar`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data['error'] || 'Failed to remove avatar');
            }

            const updatedUser = { ...user };
            delete updatedUser['image_url'];

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            if (data.user) {
                setUser(data.user);
                showToast('Personal information updated successfully!', 'success');

                // Log avatar removal
                if (logProfileUpdate) {
                    await logProfileUpdate({}, { avatar_removed: true }, {
                        user_id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                        email: user.email,
                        role: user.role
                    });
                }
            }

            return { success: true };

        } catch (err) {
            console.error("Failed to remove avatar:", err);
            return { error: err.message };
        } finally { setIsRemovingAvatar(false); }

    };

    const fetchUsers = async () => {

        if (!user && user.role !== 'admin') return;

        try {
            
            const response = await fetchWithTimeout('/api/accounts/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (!response.ok)
                throw new Error(data.error || 'Failed to fetch all users');

            setUserList(data);

        } catch (err) {
            console.error("AuthContext fetchUsers function error: ", err);
            return { error: err };
        }

    }

    const fetchUserCount = async () => {

        if (!user) return;
        
        try {
            const response = await fetch('/api/accounts/count');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user count');
            }
            
            setUserCount(data.count);
            return data.count;
        } catch (error) {
            console.error('Error fetching user count:', error);
            return 0;
        }
    };

    const suspendAccount = async (accountId, isSuspended) => {

        
        if (!user || user.role !== 'admin') return { error: 'Unauthorized' };

        try {
            const response = await fetch(`/api/accounts/${ accountId }/suspend`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_suspended: isSuspended }),
            });

            if (!response.ok)
                throw new Error('Failed to suspend account');

            showToast(`Account ${ isSuspended ? 'suspended' : 're-activated' } successfully!`, 'success');
            fetchUsers();

            try {
                if (logAdminAccountUpdate) {
                    const targetUser = userList.find(u => u.id === accountId);
                    await logAdminAccountUpdate(
                        accountId,
                        { is_suspended: !isSuspended },
                        { is_suspended: isSuspended, },
                        {
                            user_id: user.id,
                            email: targetUser?.email,
                            first_name: targetUser?.first_name,
                            last_name: targetUser?.last_name,
                            role: targetUser?.role,
                            details: `Account updated for ${targetUser?.email}`
                        }
                    );
                }
            } catch (auditError) {
                console.warn('Failed to log account suspension audit trail:', auditError);
            }

            return { success: true };
        } catch (error) {
            console.error('Error suspending account:', error);
            showToast('Failed to suspend account', 'error');
            return { error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userList,
            fetchUsers,
            userCount,
            fetchUserCount,
            isLoading: isInitializing,
            isUpdatingAvatar,
            isRemovingAvatar,
            isPopupOpen,
            setIsPopupOpen,
            otpModalData,
            handleOTPSuccess,
            hideOTP,
            showOTP,
            signIn,
            signUp,
            logout,
            remove,
            updatePersonalInfo,
            updatePassword,
            updateAvatar,
            removeAvatar,
            addressBook,
            getAddressBook,
            addAddress,
            updateAddress,
            deleteAddress,
            suspendAccount,
        }}>
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);