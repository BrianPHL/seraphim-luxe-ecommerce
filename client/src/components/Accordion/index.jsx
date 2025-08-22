import { useState, useEffect } from 'react';
import { Anchor } from '@components';
import styles from './Accordion.module.css';

const Accordion = ({ label, options, externalStyles, onLinkClick, children, isOpenByDefault = false, ...props }) => {

    const [ isOpen, setIsOpen ] = useState(isOpenByDefault);

    useEffect(() => {
        setIsOpen(isOpenByDefault);
    }, [isOpenByDefault]);

    if (!label) return null;

    return (
        <div className={ `${ styles['wrapper'] } ${ externalStyles ? externalStyles : null } `}>
            <button
                className={` ${styles['header']} ${ isOpen ? styles['header-active'] : '' }` }
                onClick={ () => setIsOpen((prev) => !prev) }
                aria-expanded={ isOpen }
                { ...props }
            >
                { label }
                <i className={ `${ 'fa-solid fa-chevron-down' } ${ isOpen ? styles['chevron-active'] : styles['chevron'] }` }></i>
            </button>
            <ul className={ `${ styles['content'] } ${ isOpen ? styles['content-active'] : styles['content-inactive'] }` }>
                { options && options.map((option, index) => (
                    <li key={ index }>
                        <Anchor
                            label={ option.label }
                            link={ option.link }
                            isNested={ true }
                            onClick={ onLinkClick }
                        />
                    </li>
                ))}
                {!options && children && (
                    <li>{children}</li>
                )}
            </ul>
        </div>
    );
};

export default Accordion;
