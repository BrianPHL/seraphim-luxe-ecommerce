import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { getBaseURL, fetchWithTimeout } from "@utils";

const authClient = createAuthClient({
    baseURL: `${ getBaseURL() }/api/auth`,
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

            const { type } = data;
            const parsedURL = type === 'admin' ? `${ getBaseURL() }/admin` : `${ getBaseURL() }/customer` 
            const result = await authClient.signIn.social({
                provider: 'google',
                callbackURL: parsedURL,
                errorCallbackURL: parsedURL,
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

                if (!passwordCheckResponse.ok)
                    throw new Error(passwordCheckResponseData.error);

                if (!passwordCheckResponseData.doesPasswordExist)
                    throw new Error("ACCOUNT_DOES_NOT_HAVE_A_PASSWORD");

                const typeCheckResponse = await fetch(`/api/oauth/check-role-matches/${ type }/${ email }`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const typeCheckResponseData = await typeCheckResponse.json();

                if (!typeCheckResponse.ok)
                    throw new Error(typeCheckResponseData.error);

                if (!typeCheckResponseData.doesRoleMatchType)
                    throw new Error(`TYPE_DOES_NOT_MATCH_ROLE_${ type.toUpperCase() }`);

                const suspendStatusCheckResponse = await fetchWithTimeout(`/api/oauth/check-suspension-status/${ email }`)
                const suspendStatusCheckResponseData = await suspendStatusCheckResponse.json();

                if (!suspendStatusCheckResponse.ok)
                    throw new Error(suspendStatusCheckResponseData.error);

                if (suspendStatusCheckResponseData.isAccountSuspended)
                    throw new Error('ACCOUNT_CURRENTLY_SUSPENDED');

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
        signUpThruEmail: (data) => {

            const result = authClient.signUp.email({
                email: data.email,
                name: `${ data.firstName } ${ data.lastName }`,
                first_name: data.firstName,
                last_name: data.lastName,
                phone_number: data.phoneNumber,
                password: data.password,
                role: data.role
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
        sendChangePasswordVerificationLink: async (email) => {

            const result = await authClient.requestPasswordReset({
                email: email,
                redirectTo: `${ getBaseURL() }/profile?redirect=yes`
            });

            return result;

        },
        changePassword: async (newPassword, token) => {

            try {

                const result = await authClient.resetPassword({
                    newPassword: newPassword,
                    token: token
                });

                return result;

            } catch (err) {

                console.error("useOAuth hook changePassword function error: ", err);
                throw err;

            }
            
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
        getSession: () => authClient.getSession(),
        revokeSession: async (token) => {

            const result = await authClient.revokeSession({
                token: token
            });

            return result;
        }
    };

};

export default useOAuth;
