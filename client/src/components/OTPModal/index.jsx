import styles from './OTPModal.module.css';
import { Modal, Button } from '@components';
import { performOperationWithTimeout, TIMEOUTS } from '@utils';
import { useAuth } from '@contexts';
import { useOAuth } from '@hooks';
import { useState, useRef, useEffect } from 'react';

const OTPModal = ({ isOpen, onClose }) => {
    const { otpModalData, hideOTP, handleOTPSuccess } = useAuth();
    const { sendVerificationOTP, verifyEmailOTP } = useOAuth();
    
    const [ otp, setOtp ] = useState("");
    const [ loading, setLoading ] = useState(false);
    const [ message, setMessage ] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setOtp("");
            setMessage("");
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !otpModalData.loading && inputRef.current) {
            const timeoutId = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, otpModalData.loading]);

    const handleInput = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
        setOtp(value);
        setMessage("");

        if (value.length === 6 && e.nativeEvent.inputType === "insertFromPaste") {
            handleVerify(value);
        }
    };

    const sendOTP = async () => {

        if (!otpModalData?.data?.email) return;
        
        setLoading(true);
        setMessage("");
        
        try {
            
            const result = await sendVerificationOTP(otpModalData?.data?.email, otpModalData?.data?.type);
            
            if (result.error) {
                setMessage('Failed to send verification code');
            } else {
                setMessage('Verification code sent!');
            }
        } catch (err) {
            console.error('OTPModal component sendOTP function error: ', err);
            setMessage('Error sending verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (otpValue = otp) => {
        if (otpValue.length !== 6) {
            setMessage('Please enter a 6-digit code');
            return;
        }

        if (!otpModalData?.data?.email) {
            setMessage('Missing email');
            return;
        }

        setLoading(true);
        setMessage("");
        
        try {
            const result = await verifyEmailOTP(otpModalData?.data?.email, otpValue);
            
            if (result.error) {
                setMessage('Invalid verification code');
                return;
            } else {
                await handleOTPSuccess(result);
            }
            
        } catch (err) {
            console.error('OTPModal component handleVerify function error: ', err);
            setMessage('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOtp("");
        setMessage("");
        setLoading(false);
        hideOTP();
    };

    const getTitle = () => {
        switch (otpModalData?.data?.type) {
            case 'signin': return 'Email Verification Required';
            case 'signup': return 'Verify Your Email';
            case 'forgot-password': return 'Reset Your Password';
            default: return 'Email Verification';
        }
    };

    const getDescription = () => {
        switch (otpModalData?.data?.type) {
            case 'signin': return 'Enter the 6-digit code sent to your email to sign in';
            case 'signup': return 'Enter the 6-digit code sent to your email to complete registration';
            case 'forgot-password': return 'Enter the 6-digit code sent to your email to reset password';
            default: return 'Enter the 6-digit code sent to your email';
        }
    };

    const LoadingPlaceholder = () => {
        return (
            <div className={ styles.loadingContainer }>
                <div className={ styles.loadingSpinner }></div>
                <h3>Sending verification code...</h3>
                <p className={ styles.description }>
                    Please wait while we send a verification code to your email address.
                </p>
                {otpModalData?.data?.email && (
                    <p className={ styles.email }>
                        Sending to: <strong>{ otpModalData.data.email }</strong>
                    </p>
                )}
            </div>
        );
    };

    const OTPInput = () => {

        return (
            <div className={ styles.content }>
                <h3>{ getTitle() }</h3>
                <p className={ styles.description }>{ getDescription() }</p>

                { otpModalData?.data?.email && (
                    <p className={ styles.email }>
                        Code sent to: <strong>{ otpModalData.email }</strong>
                    </p>
                )}

                { message && (
                    <p className={ `${styles.message } ${ message.includes('sent') ? styles.success : styles.error }`}>
                        { message }
                    </p>
                )}
                <div
                    className={ styles.otpBoxes }
                    onClick={ () => {
                        if (inputRef.current && !loading) {
                            inputRef.current.focus();
                        }
                    }}
                >
                    { Array.from({ length: 6 }).map((_, i) => (
                        <span key={ i } className={ styles.otpBox }>
                            {otp[i] || ""}
                        </span>
                    ))}
                </div>
                <input
                    ref={ inputRef }
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={ 6 }
                    value={ otp }
                    onInput={ handleInput }
                    className={ styles.otpHidden }
                    disabled={ loading }
                    autoFocus={ !loading }
                    onChange={ () => {} }
                />
                <div className={ styles.buttons }>
                    <Button
                        label="Resend Code"
                        type="secondary"
                        action={ sendOTP }
                        disabled={ loading }
                    />
                    <Button
                        label={ loading ? "Verifying..." : "Verify" }
                        type="primary"
                        action={ () => handleVerify(otp) }
                        disabled={ otp.length !== 6 || loading }
                    />
                </div>
            </div>
        );
    }

    return (
        <Modal label={ getTitle() } isOpen={ isOpen } onClose={ handleClose }>
            { otpModalData.loading ? <LoadingPlaceholder /> : <OTPInput /> }
        </Modal>
    );
};

export default OTPModal;
