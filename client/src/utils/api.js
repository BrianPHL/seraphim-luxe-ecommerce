import { TIMEOUTS } from './constants.js';

export const performOperationWithTimeout = async (asyncOperationPromise, timeLimitInMilliseconds) => {

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Operation timed out'));
        }, timeLimitInMilliseconds);
    });

    try {
        const result = await Promise.race([ asyncOperationPromise, timeoutPromise ]);
        return result;
    } catch (err) {
        throw err;
    }

};

export const fetchWithTimeout = async (url, options = {}, timeout = TIMEOUTS.STANDARD_API) => {
    return performOperationWithTimeout(
        await fetch(url, options),
        timeout
    );
};

export const apiRequest = async (url, options = {}, timeout = TIMEOUTS.STANDARD_API) => {

    try {

        const response = await fetchWithTimeout(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        }, timeout);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || `HTTP ${ response.status }`);

        return { success: true, data };

    } catch (err) {
        if (err.message === 'Operation timed out') {
            return {
                success: false,
                error: "The request is taking longer than expected. Please check your connection and try again."
            }
        };
        return { success: false, error: err.message };
    };

};

export { TIMEOUTS };
