import { useOAuth } from '@hooks';
import { performOperationWithTimeout, TIMEOUTS } from '@utils';
import { Button } from '@components';

const GoogleLoginButton = ({ type, ...props }) => {

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
        <Button
            type='secondary'
            label='Sign in with Google'
            action={ handleGoogleLogin }
            { ...props }
        />
    );

}

export default GoogleLoginButton;
