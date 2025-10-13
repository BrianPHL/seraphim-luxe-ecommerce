import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '@contexts';
import { getErrorMessage } from '@utils';
import { InputField, Button, Anchor, GoogleLoginButton } from '@components';
import styles from './AuthPopup.module.css';

const AuthPopup = () => {

    const { isPopupOpen, setIsPopupOpen, user, signIn } = useAuth();
    
    const [ isLoading, setIsLoading ] = useState(false);
    const [ showPassword, setShowPassword ] = useState(false);
    const [ formError, setFormError ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ searchParams ] = useSearchParams();
    
    useEffect(() => {

        const handleRedirectErrors = () => {

            const error = searchParams.get('error');
            
            if (error && error.trim() !== '') {
                try {
                    const errorMessage = getErrorMessage(error.toUpperCase());
                    setFormError(errorMessage);
                } catch (err) {
                    console.error('SignIn page handleRedirectErrors function error: ', err);
                    setFormError('An error occurred during sign-in. Please try again.');
                }
            }

        };
        handleRedirectErrors();

    }, [ searchParams ]);

    const handlePasswordToggle = () =>
        setShowPassword((prev) => !prev);

    const handleSignIn = async (event) => {

        event?.preventDefault();

        if (isLoading) return;

        setIsLoading(true);
        setFormError('');

        try {
            
            const result = await signIn({
                email: email,
                password: password,
                type: 'customer'
            });

            if (result?.error) {
                const errorMessage = getErrorMessage(result.error.code === 'INVALID_EMAIL_OR_PASSWORD' ? "INCORRECT_PASSWORD" : result.error);
                setFormError(errorMessage);
                setIsLoading(false);
                return;
            } else {
                setIsLoading(false);
                setFormError('');
            }

        } catch (error) {
            setFormError('Server error. Please try again. Error: ' + error);
            setIsLoading(false);            
            console.error('Sign up page handleSignIn function error: ', err);
        }

    };

    const handleWrapperClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsPopupOpen(false);
        }
    };

    if (user) return;

    return (
        <div className={ styles['wrapper'] } data-open={ isPopupOpen } onClick={ handleWrapperClick }>
            <div className={ styles['modal'] }>
                <div className={ styles['modal-header'] }>
                    <h3>Sign in to continue.</h3>
                    <Button
                        type='icon'
                        icon='fa solid fa-times'
                        action={ () => setIsPopupOpen(false) }
                    />
                </div>
                <form className={ styles['modal-form'] }>
                    { formError &&
                        <div className={ styles['error'] }>
                            <i className='fa-solid fa-circle-exclamation'></i>
                            <p>{ formError }</p>
                        </div>
                    }
                    <div className={ styles['inputs-container'] }>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="email_address">
                                Email address
                            </label>
                            <InputField
                                hint='Your email address...'
                                type='text'
                                value={ email }
                                onChange={e => setEmail(e.target.value)}
                                isSubmittable={ false }
                            />
                        </div>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="password">
                                Password
                            </label>
                            <InputField
                                value={ password }
                                onChange={e => setPassword(e.target.value)}
                                hint='Your password...'
                                type={ showPassword ? 'text' : 'password' }
                                icon={ showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                action={ () => { handlePasswordToggle() } }
                                isSubmittable={ false }
                            />
                        </div>
                    </div>
                    <div className={ styles['ctas-container'] }>
                        <Button
                            type='primary'
                            label='Sign in'
                            action={ handleSignIn }
                            disabled={ !email || !password }
                        />
                        <p>or</p>
                        <GoogleLoginButton type='customer' />
                        <p>Don't have an account yet? <Anchor label="Sign up" link="/sign-up" isNested={ false } onClick={ () => setIsPopupOpen(false) } /></p>
                    </div>
                </form>
            </div>
        </div>
    );

};

export default AuthPopup;
