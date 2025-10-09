import { useState, useEffect, useRef } from 'react';
import { Anchor, Button, InputField, ReturnButton, GoogleLoginButton, Banner } from '@components';
import { useSearchParams, useNavigate } from 'react-router';
import styles from './SignIn.module.css';
import { useAuth, useToast, useBanners } from '@contexts';
import { getErrorMessage, getBaseURL, equalizeChildrenHeightInContainer } from '@utils';

const SignIn = () => {
    const containerRef = useRef(null);
    const [ showPassword, setShowPassword ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ formError, setFormError ] = useState('');
    const [ searchParams ] = useSearchParams();
    const { banners } = useBanners();
    const { signIn } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (containerRef.current)
            equalizeChildrenHeightInContainer(containerRef.current);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current)
                equalizeChildrenHeightInContainer(containerRef.current);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['header'] }>
                <ReturnButton />
                <h1>Sign into your account</h1>
            </div>
            <div ref={ containerRef } className={ styles['container'] }>
                <form className={ styles['form'] }>
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
                        <p>Don't have an account yet? <Anchor label="Sign up" link="/sign-up" isNested={ false }/></p>
                    </div>
                </form>
                <div className={ styles['banner-wrapper'] }>
                    <Banner
                        data={ banners.filter(banner => banner.page === 'sign-in') }
                    />
                </div>
            </div>
        </div>
    );
};

export default SignIn;
