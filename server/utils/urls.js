export const getBaseURL = (environment) => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    const isEnvironmentInProduction = process.env.NODE_ENV === 'production';

    return isEnvironmentInProduction
        ? 'https://seraphim-luxe-ecommerce-production.up.railway.app'
        : environment === 'client'
            ? 'http://localhost:5173'
            : 'http://localhost:3000'
};
