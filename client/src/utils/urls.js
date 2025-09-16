export const getBaseURL = () => {
    
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    const isEnvironmentInProduction = process.env.NODE_ENV === 'production';

    return isEnvironmentInProduction
        ? 'https://seraphimluxe.store'
        : 'http://localhost:5173';
};
