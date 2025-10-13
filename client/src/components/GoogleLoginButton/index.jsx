import { useOAuth } from '@hooks';
import { performOperationWithTimeout, TIMEOUTS } from '@utils';
import { Button } from '@components';
import styles from './GoogleLoginButton.module.css';

const GoogleLoginButton = ({ type }) => {

    const { signInThruGoogleSSO } = useOAuth();
    const handleGoogleLogin = async () => {

        try {

            const result = await performOperationWithTimeout(
                await signInThruGoogleSSO({ type }),
                TIMEOUTS.AUTH_EXTERNAL
            );

            if (result?.error) {

                const errorData = {
                    code: result.error?.code,
                    message: result.error?.message,
                    details: result.error?.details || "No details provided."
                };

                console.error("GoogleLoginButton component Better Auth API error: ", errorData.code, errorData.message, errorData.details || "No error details provided");

                if (errorData.message?.includes('TYPE_DOES_NOT_MATCH_ROLE')) {
                    if (onError) {
                        onError(errorData.message);
                    }
                    return { error: errorData };
                }

                return { error: errorData };

            }
 
        } catch (err) {
            console.error("GoogleLoginButton component error: ", err);

            if (err.message?.includes('TYPE_DOES_NOT_MATCH_ROLE')) {
                if (onError) {
                    onError(err.message);
                }
            }

            return err.message;
        }

    };

    return (
        <button type='button' onClick={ handleGoogleLogin } className={ styles['button'] }>
            <img src="https://res.cloudinary.com/dfvy7i4uc/image/upload/google-icon_qmyhrv.webp" alt="Google icon" />
            Sign in with Google
        </button>
    );

}

export default GoogleLoginButton;
