import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { createOTPEmail, createChangePasswordVerificationLinkEmail } from "../utils/email.js";
import nodemailer from 'nodemailer';
import pool from "./db.js";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_APP_EMAIL_USER,
        pass: process.env.GOOGLE_APP_EMAIL_PASS
    }
})
export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 1, // TODO: REMOVE ON PRODUCTION
        maxPasswordLength: 10000, // TODO: REMOVE ON PRODUCTION
        sendResetPassword: async ({ user, url, token }, request) => {
            const { email } = user;
            await transporter.sendMail({
                from: process.env.GOOGLE_APP_EMAIL_USER,
                to: email,
                subject: "Change Password Confirmation | Seraphim Luxe",
                html: createChangePasswordVerificationLinkEmail(email, url)
            });
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectURI: "http://localhost:3000/api/auth/callback/google",
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
                await transporter.sendMail({
                    from: process.env.GOOGLE_APP_EMAIL_USER,
                    to: email,
                    subject: "Email Verification Code | Seraphim Luxe",
                    html: createOTPEmail(email, otp, type)
                });
            }
        })
    ],
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:3000"
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
            contact_number: {
                type: "string",
                required: false,
                defaultValue: ""
            },
            role: {
                type: "string",
                required: false,
                input: false,
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

            if (ctx.path === '/callback/:id') {

                const user = ctx?.context?.session?.user || ctx?.context?.newSession?.user;
                const responseHeaders = ctx.context?.responseHeaders?.get('location') || '';

                if (user?.email) {

                    const isAdminPlatform = responseHeaders.includes('/admin');
                    const expectedRole = isAdminPlatform ? 'admin' : 'customer';

                    const [rows] = await pool.query('SELECT role FROM accounts WHERE email = ?', [ user.email ]);

                    if (rows.length > 0 && rows[0].role !== expectedRole) {

                        await pool.query('DELETE FROM oauth_sessions WHERE user_id = ?', [ user.id ]);

                        const redirectURL = isAdminPlatform 
                            ? `http://localhost:5173/admin?error=TYPE_DOES_NOT_MATCH_ROLE_ADMIN`
                            : `http://localhost:5173/sign-in?error=TYPE_DOES_NOT_MATCH_ROLE_CUSTOMER`;

                        ctx.redirect(redirectURL);
                        return;
                    }
                }
            }

            const user = ctx?.context?.session?.user || ctx?.context?.newSession?.user;

            if (user) {

                const isProfileSetupNeeded = (!user.first_name || !user.last_name) && user.name;

                if (isProfileSetupNeeded) {

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
                            last_name: lastName
                        });

                    } catch(err) {
                        console.error("betterAuth hook error: ", err);
                    }

                }

            }

        })
    }
});
