export const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    const isEnvironmentInProduction = process.env.NODE_ENV === 'production';

    console.log("Is environment in production? ", isEnvironmentInProduction);

    return isEnvironmentInProduction
        ? 'https://seraphim-luxe-ecommerce-production.up.railway.app'
        : 'http://localhost:3000';
};
