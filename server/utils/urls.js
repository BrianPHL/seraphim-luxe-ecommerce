export const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NODE_ENV === 'production' 
        ? 'https://seraphim-luxe-ecommerce-production.up.railway.app'
        : 'http://localhost:3000';
};
