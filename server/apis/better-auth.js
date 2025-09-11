import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { createOTPEmail, createChangePasswordVerificationLinkEmail, createWelcomeEmail } from "../utils/email.js";
import { getBaseURL } from "../utils/urls.js";
import { sendEmail } from "./resend.js";
import pool from "./db.js";

export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 * 1000
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 1, // TODO: REMOVE ON PRODUCTION
        maxPasswordLength: 10000, // TODO: REMOVE ON PRODUCTION
        sendResetPassword: async ({ user, url, token }, request) => {
            const { email } = user;
            const { _, err } = await sendEmail({
                from: 'Seraphim Luxe <noreply@seraphimluxe.store>',
                to: email,
                subject: "Change Password Confirmation | Seraphim Luxe",
                html: createChangePasswordVerificationLinkEmail(email, url)
            });
            if (err) console.error(err);
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectURI: `${ getBaseURL() }/api/auth/callback/google`,
            prompt: "select_account",
            disableImplicitSignUp: false
        },
    },
    plugins: [
        emailOTP({
            overrideDefaultEmailVerification: false,
            otpLength: 6,
            expiresIn: 300,
            allowedAttempts: 3,
            async sendVerificationOTP({ email, otp, type }) {
                const { _, err } = await sendEmail({
                    from: 'Seraphim Luxe <noreply@seraphimluxe.store>',
                    to: email,
                    subject: "Email Verification Code | Seraphim Luxe",
                    html: createOTPEmail(email, otp, type)
                });
                if (err) console.error(err);
            }
        })
    ],
    trustedOrigins: [
      'https://seraphim-luxe-ecommerce-production.up.railway.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    user: {
        modelName: "accounts",
        fields: {
            emailVerified: "email_verified",
            createdAt: "created_at",
            updatedAt: "updated_at",
            image: "image_url"
        },
        additionalFields: {
            first_name: {
                type: "string",
                required: false,
                defaultValue: ""
            },
            last_name: {
                type: "string",
                required: false,
                defaultValue: ""
            },
            address: {
                type: "string",
                required: false,
                defaultValue: ""
            },
            phone_number: {
                type: "string",
                required: false,
                defaultValue: ""
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "customer"
            }
        }
    },
    session: {
        modelName: "oauth_sessions",
        fields: {
            userId: "user_id",
            ipAddress: "ip_address",
            userAgent: "user_agent",
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    },
    account: {
        modelName: "oauth_accounts",
        fields: {
            userId: "user_id",
            accountId: "oauth_account_id",
            providerId: "provider_id",
            accessToken: "access_token",
            refreshToken: "refresh_token",
            accessTokenExpiresAt: "access_token_expires_at",
            refreshTokenExpiresAt: "refresh_token_expires_at",
            idToken: "id_token",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
    verification: {
        modelName: "oauth_verifications",
        fields: {
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at"
        },
    },
    advanced: {
        database: {
            generateId: false
        }
    },
    hooks: {

        after: createAuthMiddleware(async (ctx) => {

            if (ctx.path === '/sign-up/email') {

                const email = ctx.context?.returned?.user?.email || '';
                const name = ctx.context?.returned?.user?.name || '';

                if (!email) return;
                
                const { _, err } = await sendEmail({
                    from: 'Seraphim Luxe <noreply@seraphimluxe.store>',
                    to: email,
                    subject: "Welcome | Seraphim Luxe",
                    html: createWelcomeEmail(email, name)
                });
                
                if (err) console.error(err);

            }

            if (ctx.path === '/callback/:id') {

                const user = ctx?.context?.session?.user || ctx?.context?.newSession?.user;
                const responseHeaders = ctx.context?.responseHeaders?.get('location') || '';

                if (user) {

                    const isAdminPlatform = responseHeaders.includes('/admin');
                    const expectedRole = isAdminPlatform ? 'admin' : 'customer';
                    const isNewlyCreated = (!user.first_name || !user.last_name) && user.name;

                    if (!isNewlyCreated) {
                                                
                        try {

                            if (expectedRole === user.role)
                                return;
                            
                            await ctx?.context?.internalAdapter?.deleteSessions(user.id);
                            const redirectURL = isAdminPlatform 
                                ? `http://localhost:5173/admin/sign-in?error=TYPE_DOES_NOT_MATCH_ROLE_ADMIN`
                                : `http://localhost:5173/sign-in?error=TYPE_DOES_NOT_MATCH_ROLE_CUSTOMER`;
                            ctx.redirect(redirectURL);
                            return;

                        } catch (err) {
                            console.error("Auth betterAuth signIn hook error: ", err);
                        }

                    } else {

                        try {

                            const capitalizeWord = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            const fullName = user.name.trim().split(' ').filter(part => part.length > 0);
                            let firstName, lastName;

                            if (fullName.length === 0)
                                return;

                            if (fullName.length === 1) {

                                firstName = capitalizeWord(fullName[0]);
                                lastName = '';

                            } else if (fullName.length === 2) {

                                firstName = capitalizeWord(fullName[0]);
                                lastName = capitalizeWord(fullName[1]);
                            } else {

                                const lastNamePart = fullName[fullName.length - 1];
                                const firstNameParts = fullName.slice(0, -1);
                                firstName = firstNameParts.map(capitalizeWord).join(' ');
                                lastName = capitalizeWord(lastNamePart);
                            }

                            await ctx?.context?.internalAdapter?.updateUser(user.id, {
                                first_name: firstName,
                                last_name: lastName,
                                role: expectedRole
                            });

                            console.log("SHOULD BE EMAILING 2");

                            const { _, err } = await sendEmail({
                                from: 'Seraphim Luxe <noreply@seraphimluxe.store>',
                                to: user.email,
                                subject: "Welcome | Seraphim Luxe",
                                html: createWelcomeEmail(user.email, user.name)
                            });

                            if (err) console.error(err);

                            return;

                        } catch(err) {
                            console.error("Auth betterAuth signUp hook error: ", err);
                        }

                    }

                }
            }

        })
    }
});
