import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { performOperationWithTimeout, apiRequest, extractAccountData, TIMEOUTS } from '@utils';
import { useOAuth } from "@hooks";
import { useToast } from "@contexts";
import AuthContext from "./context";

export const AuthProvider = ({ children }) => {

    const [ user, setUser ] = useState(null);
    const [ isInitializing, setIsInitializing ] = useState(true);
    const [ isUpdatingAvatar, setIsUpdatingAvatar ] = useState(false);
    const [ isRemovingAvatar, setIsRemovingAvatar ] = useState(false);
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
    const { signOut, getSession, signInThruEmail, signUpThruEmail, sendVerificationOTP } = useOAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {

        const initializeAuthentication = async () => {

            try {
                const session = await getSession();

                if (session?.data?.user)
                    setUser(session.data.user);

            } catch (err) {
                console.error("Auth context initializeAuth function error: ", err);
            } finally {
                setIsInitializing(false);
            }

        };
        initializeAuthentication();

    }, []);

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

                        if (signInThruEmailResult.data.user) 
                            signIn(data);

                    });
                    return;
                }

                return { error: errorData };

            }

            completeSignInProcess();

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
            
            return result;
        
        } catch (err) {
            console.error('Auth context create function error: ', err);
            return { error: err.message };
        }

    };

    const logout = async () => {
        try {

            await signOut();
            localStorage.removeItem('user');
            setUser(null);

        } catch (err) {
            console.error('Auth context logout function error:', err);
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updatePersonalInfo = async (personalInfo) => {
        
        try {
        
            const data = await apiRequest(`/api/accounts/${user.id}/personal-info`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(personalInfo)
            }, TIMEOUTS.FILE_UPLOAD_API);

            if (data.user) {
                setUser(data.user);
                showToast('Personal information updated successfully!', 'success');
            }
            return data;
        
        } catch (err) {
            console.error('Error updating personal info:', err);
            return { error: err.message };
        }

    };

    const updateAddress = async (address) => {
        if (!user) return { error: 'User not logged in' };

        try {
            setIsInitializing(true);

            const response = await fetch(`/api/accounts/${user.id}/address`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update address');
            }

            const updatedUser = { ...data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

        } catch (err) {
            console.error("Failed to update address:", err);
            return { error: err.message };
        } finally {
            setIsInitializing(false);
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

            return { success: true };
        } catch (err) {
            console.error("Failed to update password:", err);
            return { error: err.message };
        } finally {
            setIsInitializing(false);
        }
    };

    const remove = async (id) => {
        
        if (!user) return { error: 'User not logged in' };

        try {

            setIsInitializing(true);

            const response = await fetch(`/api/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete account');
            }

            logout();

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
            localStorage.setItem('user', JSON.stringify(updatedUser));

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

            return { success: true };

        } catch (err) {
            console.error("Failed to remove avatar:", err);
            return { error: err.message };
        } finally { setIsRemovingAvatar(false); }

    };

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

    return (
        <AuthContext.Provider value={{
            user,
            userCount,
            fetchUserCount,
            isLoading: isInitializing,
            isUpdatingAvatar,
            isRemovingAvatar,
            otpModalData,
            handleOTPSuccess,
            hideOTP,
            showOTP,
            signIn,
            signUp,
            logout,
            remove,
            updatePersonalInfo,
            updateAvatar,
            removeAvatar,
        }}>
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);