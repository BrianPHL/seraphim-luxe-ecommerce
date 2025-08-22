// * API Timeout Constants
export const TIMEOUTS = {
    QUICK_API: 5000,        // Simple operations like count queries
    STANDARD_API: 8000,     // Standard database queries  
    HEAVY_API: 15000,       // Complex queries, reports
    FILE_UPLOAD: 60000,     // File operations
    AUTH_EXTERNAL: 10000,   // OAuth, external auth
    EXTERNAL_SERVICE: 12000 // Third-party APIs
};

export const ERROR_MESSAGES = {
    // Better Auth Authentication Error Codes
    'INVALID_EMAIL': 'Please enter a valid email address.',
    'PASSWORD_TOO_SHORT': 'Password must be at least 8 characters long.',
    'PASSWORD_TOO_LONG': 'Password must not exceed 128 characters.',
    'USER_NOT_FOUND': 'No account found with this email address.',
    'INCORRECT_PASSWORD': 'Incorrect password. Please try again.',
    'USER_ALREADY_EXISTS': 'An account with this email already exists.',
    'EMAIL_NOT_VERIFIED': 'Please verify your email address before signing in.',
    'VERIFICATION_TOKEN_EXPIRED': 'Verification link has expired. Please request a new one.',
    'INVALID_VERIFICATION_TOKEN': 'Invalid verification link. Please request a new one.',
    'SIGNUP_DISABLED': 'No account associated with the email used in Social Sign-On. Please sign up and try again.',
    
    // Better Auth Session Error Codes
    'SESSION_NOT_FOUND': 'Your session has expired. Please sign in again.',
    'INVALID_SESSION': 'Invalid session. Please sign in again.',
    'SESSION_EXPIRED': 'Your session has expired. Please sign in again.',
    
    // Better Auth Rate Limiting
    'TOO_MANY_REQUESTS': 'Too many attempts. Please wait a few minutes and try again.',
    'RATE_LIMITED': 'Too many requests. Please slow down and try again.',
    
    // Better Auth Validation Errors
    'INVALID_DATA': 'Please check your information and try again.',
    'MISSING_FIELDS': 'Please fill in all required fields.',
    'WEAK_PASSWORD': 'Password is too weak. Use a stronger password.',
    
    // Better Auth OAuth Errors
    'OAUTH_ERROR': 'OAuth authentication failed. Please try again.',
    'OAUTH_ACCOUNT_NOT_LINKED': 'This OAuth account is not linked to any user.',
    'OAUTH_EMAIL_MISMATCH': 'OAuth email does not match your account email.',
    
    // Better Auth Database Errors
    'DATABASE_ERROR': 'A database error occurred. Please try again.',
    'CONSTRAINT_ERROR': 'Data validation error. Please check your input.',
    
    // Better Auth Network/Server Errors
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'SERVER_ERROR': 'Server error. Please try again later.',
    'TIMEOUT_ERROR': 'Request timed out. Please try again.',

    'RESERVATION_NOT_FOUND': 'Reservation not found.',
    'INSUFFICIENT_STOCK': 'Not enough items in stock.',
    'CART_EMPTY': 'Your cart is empty.',
    'PAYMENT_FAILED': 'Payment processing failed. Please try again.',
    'ORDER_CANCELLED': 'This order has been cancelled.',
    'PRODUCT_UNAVAILABLE': 'This product is no longer available.',
    
    // File Upload Errors
    'FILE_TOO_LARGE': 'File is too large. Maximum size is 5MB.',
    'INVALID_FILE_TYPE': 'Invalid file type. Please upload an image.',
    'UPLOAD_FAILED': 'File upload failed. Please try again.',
    
    // Network/Timeout Errors (from your utilities)
    'TIMEOUT_ERROR': 'Request timed out. Please try again.',
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'CONNECTION_LOST': 'Connection lost. Please check your internet.',
    
    // Other
    'PASSWORDS_DO_NOT_MATCH': 'Provided passwords do not match. Please double check and try again.',
    'UNKNOWN_ERROR': 'Something went wrong. Please try again.',
    'DEFAULT': 'An unexpected error occurred. Please try again.'
};

// * OTP constants
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_IN_SECONDS = 60;

// Auth constants
export const MAX_LOGIN_ATTEMPTS = 5;
export const SESSION_DURATION_IN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Validation constants
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_FILE_SIZE_IN_MB = 5 * 1024 * 1024;

// UI constants
export const TOAST_DURATION_IN_MILLISECONDS = 3000;
export const MODAL_ANIMATION_DURATION_IN_MILLISECONDS = 300;
