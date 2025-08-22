import { useCallback, useContext, useState, useEffect } from "react";
import { Toast } from '@components';
import ToastContext from "./context";
import styles from './Toast.module.css';

export const ToastProvider =({ children }) => {

    const [ toasts, setToasts ] = useState([]);
    const showToast = useCallback((message, type = 'info') => {
        const identifier = Date.now() + Math.random();
        setToasts(previous => [...previous, { identifier, message, type }]);
        setTimeout(() => {
            setToasts(previous => previous.filter(toast => toast.identifier !== identifier));
        }, 5000);

    }, []);

    const removeToast = useCallback((identifier) => {
        setToasts(previous => previous.filter(toast => toast.identifier !== identifier));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            { children }
            <div className={ styles['toast'] }>
                { toasts.map(toast => (
                    <Toast
                        key={ toast['identifier'] }
                        message={ toast['message'] }
                        type={ toast['type'] }
                        onClose={ () => removeToast(toast['identifier']) }
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );


};

export const useToast = () => useContext(ToastContext);
