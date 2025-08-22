import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Anchor, Button, InputField, ReturnButton, Modal } from '@components';
import styles from './SignUp.module.css';
import { useAuth, useToast } from '@contexts';
import { getErrorMessage } from '@utils';

const SignIn = () => {
    const [ modalOpen, setModalOpen ] = useState(false);
    const [ showPassword, setShowPassword ] = useState(false);
    const [ showConfirmPassword, setShowConfirmPassword ] = useState(false);
    const [ firstName, setFirstName ] = useState('');
    const [ lastName, setLastName ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ address, setAddress ] = useState('');
    const [ contactNumber, setContactNumber ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ formError, setFormError ] = useState('');
    const [ searchParams ] = useSearchParams();
    const { signUp } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {

        const handleRedirectErrors = () => {

            const error = searchParams.get('error');

            if (error && error.trim() !== '') {
                try {
                    const errorMessage = getErrorMessage(error.toUpperCase());
                    setFormError(errorMessage);
                } catch (err) {
                    console.error('SignUp page handleRedirectErrors function error:', err);
                    setFormError('An error occurred during sign-up. Please try again.');
                }
            }

        };
        handleRedirectErrors();

    }, [ searchParams ]);

    const handlePasswordToggle = () => {
        setShowPassword((prev) => !prev);
    };
    const handleConfirmPasswordToggle = () => {
        setShowConfirmPassword((prev) => !prev);
    };
    const handleSignUp = async () => {

        try { 

            if (password !== confirmPassword) {
                const errorMessage = getErrorMessage("PASSWORDS_DO_NOT_MATCH");
                setFormError(errorMessage);
                return;
            }

            const result = await signUp({
                firstName: firstName,
                lastName: lastName,
                email: email,
                address: address,
                contactNumber: contactNumber,
                password: password
            });

            if (result?.error) {
                const errorMessage = getErrorMessage(result.error);
                setFormError(errorMessage);
                return;
            } else {
                setFormError('');
                navigate('/sign-in');
            }
        } catch (err) {
            setFormError('Server error. Please try again later.')
            console.error('Sign up page handleSignUp function error: ', err);
        }

    };
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['header'] }>
                <ReturnButton />
                <h1>Create your account</h1>
            </div>
            <div className={ styles['container'] }>
                <form className={ styles['form'] }>
                    { formError &&
                        <div className={ styles['error'] }>
                            <i className='fa-solid fa-circle-exclamation'></i>
                            <p>{ formError }</p>
                        </div>
                    }
                    <div className={ styles['inputs-container'] }>
                        <span style={{
                                'flexDirection': 'row',
                                'display': 'flex',
                                'gap': '1rem' 
                            }}
                        >
                            <div className={ styles['input-wrapper'] }>
                                <label htmlFor="first_name">
                                    First name <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                                </label>
                                <InputField
                                    hint='Your first name...'
                                    type='text'
                                    isSubmittable={ false }
                                    onChange={ event => setFirstName(event['target']['value']) }
                                />
                            </div>
                            <div className={ styles['input-wrapper'] }>
                                <label htmlFor="last_name">
                                    Last name <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                                </label>
                                <InputField
                                    hint='Your last name...'
                                    type='text'
                                    isSubmittable={ false }
                                    onChange={ event => setLastName(event['target']['value']) }
                                />
                            </div>
                        </span>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="email_address">
                                Email address <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                            </label>
                            <InputField
                                hint='Your email address...'
                                type='email'
                                isSubmittable={ false }
                                onChange={ event => setEmail(event['target']['value']) }
                            />
                        </div>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="address">
                                Address <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                            </label>
                            <InputField
                                hint='Your address...'
                                type='email'
                                isSubmittable={ false }
                                onChange={ event => setAddress(event['target']['value']) }
                            />
                        </div>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="contact_number">
                                Contact number <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                            </label>
                            <InputField
                                hint='Your contact number...'
                                type='text'
                                isSubmittable={ false }
                                onChange={ event => setContactNumber(event['target']['value']) }
                            />
                        </div>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="password">
                                Password <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                            </label>
                            <InputField
                                hint='Your password...'
                                type={ showPassword ? 'text' : 'password' }
                                icon={ showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                action={ () => { handlePasswordToggle() } }
                                isSubmittable={ false }
                                onChange={ event => setPassword(event['target']['value']) }
                            />
                        </div>
                        <div className={ styles['input-wrapper'] }>
                            <label htmlFor="confirm_password">
                                Confirm password <span style={{ 'color': 'var(--accent-base)' }}>*</span>
                            </label>
                            <InputField
                                hint='Confirm your password...'
                                type={ showConfirmPassword ? 'text' : 'password' }
                                icon={ showConfirmPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash' }
                                action={ () => { handleConfirmPasswordToggle() } }
                                isSubmittable={ false }
                                onChange={ event => setConfirmPassword(event['target']['value']) }
                            />
                        </div>
                    </div>
                    <div className={ styles['ctas-container'] }>
                        <Button
                            type='primary'
                            label='Sign up'
                            action={ () => setModalOpen(true) }
                            disabled={ !firstName || !lastName || !email || !address || !password ||!confirmPassword }
                        />
                        <p>Already have an account? <Anchor label="Sign in" link="/sign-in" isNested={ false }/></p>
                    </div>
                </form>
                <div className={ styles['banner'] }></div>
            </div>
            <Modal label='Account Creation Confirmation' isOpen={ modalOpen } onClose={ () => setModalOpen(false) }>
                <p className={ styles['modal-info'] }>Creating an account with <strong>Seraphim Luxe</strong> means you agree with our Terms and Conditions. Do you wish to continue?</p>
                <div className={ styles['modal-ctas'] }>
                    <Button
                        label='Confirm'
                        type='primary'
                        action={ () => {
                            handleSignUp();
                            setModalOpen(false);
                        } }
                    />
                    <Button
                        label='Cancel'
                        type='secondary'
                        action={ () => setModalOpen(false) }
                    />
                </div>
            </Modal>
        </div>
    );
};

export default SignIn;
