import styles from './Toast.module.css';
import { Button } from '@components';

const Toast = ({ message, type, onClose }) => {
    return (
        <div className={ `${ styles['toast'] } ${ styles[type] } }` }>
            <div className={ styles['message'] }>
                <i className={
                    type === 'info' ? 'fa-solid fa-circle-info' :
                    type === 'success' ? 'fa-solid fa-circle-check' :
                    type === 'error' ? 'fa-solid fa-circle-exclamation' : null
                }></i>
                <p>{message}</p>
            </div>
            <Button
                type='icon'
                icon='fa-solid fa-xmark'
                action={ onClose }
            />
        </div>
    );
};

export default Toast;
