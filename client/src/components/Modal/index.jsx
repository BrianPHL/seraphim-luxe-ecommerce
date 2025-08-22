import { useState } from 'react';
import styles from './Modal.module.css';
import { Button } from '@components';

const Modal = ({ label, isOpen, onClose, children }) => {

    if (!isOpen) return null;

    return (
        <div className={ styles['wrapper'] } onClick={ onClose }>
            <div className={ styles['modal'] } onClick={ event => event.stopPropagation() }>
                <div className={ styles['header'] }>
                    <h3>{ label }</h3>
                    <Button
                        type='icon'
                        icon='fa-solid fa-xmark'
                        action={ onClose }
                    />
                </div>
                { children }
            </div>
        </div>
    );
};

export default Modal;