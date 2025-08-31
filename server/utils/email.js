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
