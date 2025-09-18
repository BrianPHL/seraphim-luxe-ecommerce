import { getBaseURL } from "./urls.js";

export const createOTPEmail = (email, otp, type) => {

    const titles = {
        'sign-in': 'Sign In',
        'email-verification': 'Email Verification',
        'forget-password': 'Reset Password'
    };

    return `
        <div style="background: #f6f1ea; font-family: 'Lora', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 2px 8px rgba(180, 140, 90, 0.08); border: 1px solid #e5d4c0;">
            <h2 style="color: #a67c52; font-size: 2em; margin-bottom: 8px; font-family: 'Lora', serif;">${ titles[type] || "OTP Verification" }</h2>
            <p style="color: #7c5a3a; font-size: 1.1em;">Hi <strong>${ email }</strong>,</p>
            <p style="color: #7c5a3a;">Your verification code is:</p>
            <div style="text-align: center; margin: 32px 0;">
                <div style="background: #fff8f0; border: 2px dashed #a67c52; padding: 24px 32px; border-radius: 12px; display: inline-block;">
                    <span style="color: #a67c52; font-size: 2.5em; letter-spacing: 0.2em; font-family: monospace; font-weight: bold;">
                        ${ otp }
                    </span>
                </div>
            </div>
            <p style="color: #7c5a3a; word-break: break-all; text-align: center; font-size: 1em; margin-bottom: 24px;">
                Enter this code to verify your email address. Code expires in 5 minutes.
            </p>
            <p style="text-align: center; color: #b08d57; font-size: 14px;">
                If you did not request this, please ignore this email.
            </p>
        </div>
    `;
};

export const createChangePasswordVerificationLinkEmail = (email, url) => {
    return `
        <div style="background: #f6f1ea; font-family: 'Lora', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 2px 8px rgba(180, 140, 90, 0.08); border: 1px solid #e5d4c0;">
            <h2 style="color: #a67c52; font-size: 2em; margin-bottom: 8px; font-family: 'Lora', serif;">Change Password Verification</h2>
            <p style="color: #7c5a3a; font-size: 1.1em;">Hi <strong>${email}</strong>,</p>
            <p style="color: #7c5a3a;">Here is your verification link encapsulated in a button:</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${url}" style="background: #a67c52; color: #fff; padding: 16px 32px; border-radius: 8px; font-size: 1.2em; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 1px 4px rgba(166,124,82,0.10); border: none;">
                    Change Password
                </a>
            </div>
            <p style="color: #7c5a3a; word-break: break-all; text-align: center; font-size: 0.95em; margin-bottom: 24px;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <span style="background: #fff8f0; color: #a67c52; padding: 6px 10px; border-radius: 6px; display: inline-block; margin-top: 8px; font-family: monospace;">${url}</span>
            </p>
            <p style="text-align: center; color: #b08d57; font-size: 14px;">
                Click the provided link to change your password.<br>
                If you did not request this, please ignore this email.
            </p>
        </div>
    `;
}

export const createWelcomeEmail = (email, name = '') => {
    return `
        <div style="background: #f6f1ea; font-family: 'Lora', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 2px 8px rgba(180, 140, 90, 0.08); border: 1px solid #e5d4c0;">
            <h2 style="color: #a67c52; font-size: 2em; margin-bottom: 8px; font-family: 'Lora', serif;">Welcome to Seraphim Luxe!</h2>
            <p style="color: #7c5a3a; font-size: 1.1em;">
                Hi <strong>${name ? name : email}</strong>,
            </p>
            <p style="color: #7c5a3a; font-size: 1.05em;">
                Your account has been successfully created. We're excited to have you join our community!
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${ getBaseURL('client') }/profile" style="background: #a67c52; color: #fff; padding: 16px 32px; border-radius: 8px; font-size: 1.2em; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 1px 4px rgba(166,124,82,0.10); border: none;">
                    Go to My Profile
                </a>
            </div>
            <p style="color: #7c5a3a; text-align: center; font-size: 1em; margin-bottom: 24px;">
                Explore our latest collections, manage your account, and enjoy exclusive member benefits.
            </p>
            <p style="text-align: center; color: #b08d57; font-size: 14px;">
                If you have any questions, feel free to reply to this email.<br>
                Thank you for choosing Seraphim Luxe!
            </p>
        </div>
    `;
};

export const createOrderPendingEmail = (name, orderNumber, totalAmount) => {
    return `
        <div style="background: #f6f1ea; font-family: 'Lora', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 2px 8px rgba(180, 140, 90, 0.08); border: 1px solid #e5d4c0;">
            <h1 style="color: #a67c52; font-size: 2em; margin-bottom: 8px; font-family: 'Lora', serif;">Order Received | ${ orderNumber }</h1>
            <p style="color: #7c5a3a; font-size: 1.1em;">Hi <strong>${ name }</strong>,</p>
            <p style="color: #7c5a3a; font-size: 1.05em;">
                Thank you for your order! We've received your order and it's currently being reviewed.
            </p>
            <div style="background: #fff8f0; border: 2px solid #e5d4c0; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: #a67c52; margin-bottom: 16px; font-size: 1.3em;">Order Details</h3>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Order Number:</strong> ${ orderNumber }</p>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Total Amount:</strong> PHP ${ totalAmount }</p>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Status:</strong> Pending</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${ getBaseURL('client') }/orders" style="background: #a67c52; color: #fff; padding: 16px 32px; border-radius: 8px; font-size: 1.2em; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 1px 4px rgba(166,124,82,0.10); border: none;">
                    View Order Details
                </a>
            </div>
            <p style="text-align: center; color: #b08d57; font-size: 14px;">
                We'll send you an update once your order is confirmed and processing begins.<br>
                Thank you for choosing Seraphim Luxe!
            </p>
        </div>
    `;
};

export const createOrderProcessingEmail = (name, orderNumber) => {
    return `
        <div style="background: #f6f1ea; font-family: 'Lora', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 2px 8px rgba(180, 140, 90, 0.08); border: 1px solid #e5d4c0;">
            <h1 style="color: #a67c52; font-size: 2em; margin-bottom: 8px; font-family: 'Lora', serif;">Order Being Prepared | ${ orderNumber }</h1>
            <p style="color: #7c5a3a; font-size: 1.1em;">Hi <strong>${ name }</strong>,</p>
            <p style="color: #7c5a3a; font-size: 1.05em;">
                Great news! Your order is now being processed and prepared for shipment.
            </p>
            <div style="background: #fff8f0; border: 2px solid #e5d4c0; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: #a67c52; margin-bottom: 16px; font-size: 1.3em;">Order Status</h3>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Order Number:</strong> ${ orderNumber }</p>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Status:</strong> Processing</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${ getBaseURL('client') }/orders" style="background: #a67c52; color: #fff; padding: 16px 32px; border-radius: 8px; font-size: 1.2em; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 1px 4px rgba(166,124,82,0.10); border: none;">
                    Track Your Order
                </a>
            </div>
            <p style="text-align: center; color: #b08d57; font-size: 14px;">
                We'll notify you as soon as your order ships with tracking information.<br>
                Thank you for your patience!
            </p>
        </div>
    `;
};


export const createOrderRefundedEmail = (name, orderNumber, refundAmount, refundMethod) => {
    return `
        <div style="background: #f6f1ea; font-family: 'Lora', serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; box-shadow: 0 2px 8px rgba(180, 140, 90, 0.08); border: 1px solid #e5d4c0;">
            <h1 style="color: #a67c52; font-size: 2em; margin-bottom: 8px; font-family: 'Lora', serif;">Refund Completed | ${ orderNumber }</h1>
            <p style="color: #7c5a3a; font-size: 1.1em;">Hi <strong>${ name }</strong>,</p>
            <p style="color: #7c5a3a; font-size: 1.05em;">
                Your refund has been successfully processed and should appear in your account soon.
            </p>
            <div style="background: #fff8f0; border: 2px solid #e5d4c0; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: #a67c52; margin-bottom: 16px; font-size: 1.3em;">Refund Details</h3>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Order Number:</strong> ${ orderNumber }</p>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Refund Amount:</strong> ${ refundAmount }</p>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Payment Method:</strong> ${ refundMethod }</p>
                <p style="color: #7c5a3a; margin: 8px 0;"><strong>Status:</strong> Refunded</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${ getBaseURL('client') }" style="background: #a67c52; color: #fff; padding: 16px 32px; border-radius: 8px; font-size: 1.2em; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 1px 4px rgba(166,124,82,0.10); border: none;">
                    Shop Again
                </a>
            </div>
            <p style="text-align: center; color: #b08d57; font-size: 14px;">
                The refund may take 1-2 business days to appear in your account.<br>
                We hope to serve you again in the future!
            </p>
        </div>
    `;
};
