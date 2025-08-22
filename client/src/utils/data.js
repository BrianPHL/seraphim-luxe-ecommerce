import { ERROR_MESSAGES } from './constants.js';

export const extractAccountData = (response) => {

    console.log('[ DEBUG ] IN EXTRACTACCOUNT DATA: ', response.data)

    if (response.data?.value?.account) {
        return response.data.value.account;
    }
    if (response.account) {
        return response.account;
    }
    if (response.data?.account) {
        return response.data.account;
    }
    return null;

};

export const getErrorMessage = (error) => {
    if (typeof error === 'string') {
        return ERROR_MESSAGES[error] || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
    
    if (error?.code) {
        return ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
    
    if (error?.message) {
        const errorCode = error.message.toUpperCase().replace(/\s+/g, '_');
        return ERROR_MESSAGES[errorCode] || error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
    
    return ERROR_MESSAGES.UNKNOWN_ERROR;
};
