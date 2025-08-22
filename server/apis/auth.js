import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { createOTPEmail } from "../utils/email.js";
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
        maxPasswordLength: 10000 // TODO: REMOVE ON PRODUCTION
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectURI: "http://localhost:3000/api/auth/callback/google",
            prompt: "select_account",
            disableImplicitSignUp: true
            
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
                    subject: 'Your Verification Code | Seraphim Luxe',
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
                required: false
            },
            last_name: {
                type: "string",
                required: false,
            },
            address: {
                type: "string",
                required: false,
            },
            contact_number: {
                type: "string",
                required: false,
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
    }
});
