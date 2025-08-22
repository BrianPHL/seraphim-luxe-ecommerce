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
        signInThruGoogleSSO: async (callbackURL = 'http://localhost:5173') => {
            
            const result = await authClient.signIn.social({
                provider: 'google',
                callbackURL: callbackURL,
                errorCallbackURL: callbackURL
            });
            
            return result;
        },
        signInThruEmail: async (data) => {

            
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
                rememberMe: false
            });

            return result;

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
        sendForgetAndResetPasswordOTP: async (email) => {

            const result = authClient.forgetPassword.emailOtp({
                email: email
            })

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
