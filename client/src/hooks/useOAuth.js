import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
    baseURL: 'http://localhost:3000/api/auth',
    fetchOptions: {
        credentials: 'include'
    },
    plugins: [
        emailOTPClient()
    ]
});

const useOAuth = () => {

    return {
        authClient,
        signInThruGoogleSSO: async (data) => {

            const { type, callbackURL } = data;
            const result = await authClient.signIn.social({
                provider: 'google',
                callbackURL: callbackURL,
                errorCallbackURL: callbackURL,
                fetchOptions: {
                    body: JSON.stringify({
                        expectedRole: type,
                        callbackURL: callbackURL
                    })
                }
            });
        
            return result;
        },
        signInThruEmail: async (data) => {

            try {

                const { email, password, type } = data;
                
                const passwordCheckResponse = await fetch(`/api/oauth/check-password-exists/${ email }`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const passwordCheckResponseData = await passwordCheckResponse.json();

                if (!passwordCheckResponse.ok) {
                    throw new Error(passwordCheckResponseData.error);
                }

                if (!passwordCheckResponseData.doesPasswordExist)
                    throw new Error("ACCOUNT_DOES_NOT_HAVE_A_PASSWORD");

                const typeCheckResponse = await fetch(`/api/oauth/check-role-matches/${ type }/${ email }`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const typeCheckResponseData = await typeCheckResponse.json();

                if (!typeCheckResponseData.doesRoleMatchType)
                    throw new Error(`TYPE_DOES_NOT_MATCH_ROLE_${ type.toUpperCase() }`);

                const result = await authClient.signIn.email({
                    email: email,
                    password: password,
                    rememberMe: false
                });

                return result;

            } catch (err) {
                console.error("useOauth hook signInThruEmail function error: ", err);
                throw err;
            }

        },
        signUpThruEmail: (data, callbackURL = 'http://localhost:5173/') => {

            const result = authClient.signUp.email({
                email: data.email,
                name: `${ data.firstName } ${ data.lastName }`,
                first_name: data.firstName,
                last_name: data.lastName,
                contact_number: data.contactNumber,
                address: data.address,
                password: data.password,
                callbackURL: callbackURL
            });

            return result;

        },
        sendVerificationOTP: async (email, type) => {
            
            const result = await authClient.emailOtp.sendVerificationOtp({
                email: email,
                type: type
            });

            return result;

        },
        sendChangePasswordVerificationLink: async (email, redirectToURL) => {

            const result = await authClient.requestPasswordReset({
                email: email,
                redirectTo: redirectToURL
            });

            return result;

        },
        changePassword: async (newPassword, token) => {

            const result = authClient.resetPassword({
                newPassword: newPassword,
                token: token
            });
            
            return result;
            
        },
        resetPassword: (email, otp, password) => {
            
            const result = authClient.emailOtp.resetPassword({
                email: email,
                otp: otp,
                password: password
            });

            return result;

        },
        verifyEmailOTP: async (email, otp) => {

            const result = await authClient.emailOtp.verifyEmail({
                email: email,
                otp: otp
            });
            return result;
            
        },
        signOut: () => authClient.signOut(),
        getSession: () => authClient.getSession()
    };

};

export default useOAuth;
