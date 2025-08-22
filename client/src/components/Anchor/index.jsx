import { Dropdown } from '@components';
import { useEffect, useRef } from 'react';
import { useDropdown } from '@contexts';
import styles from "./Anchor.module.css";
import { Link } from 'react-router';

const Anchor = ({ id, label, link, isNested, isActive, externalStyles, options, ...props }) => {

    const dropdownRef = useRef(null);
    const { openDropdownId, setOpenDropdownId, registerDropdown } = useDropdown();
    const hasDropdown = options && options.length > 0;
    const isOpen = openDropdownId === id;
    
    useEffect(() => {
        if (id) registerDropdown(id, dropdownRef.current);
    }, [id, registerDropdown]);

    if (!label || isNested === undefined) return null;

    const handleToggle = () => {
        setOpenDropdownId(isOpen ? null : id);
    };

    const renderComponent = () => {
        if (link && !hasDropdown) {
            return(
                <Link
                    to={ link }
                    className={ `${ isNested ? styles['anchor-nested'] : styles['anchor'] } ${ isActive && isNested ? styles['anchor-nested-active'] : isActive && !isNested ? styles['anchor-active'] : '' } ${ externalStyles }` }
                    { ...props }
                >
                    { label }
                </Link>
            );
        };

        if (!link && hasDropdown) {
            return (
                <div ref={ dropdownRef } className={ styles['wrapper'] }>
                    <button
                        className={ `${ styles['anchor'] } ${ styles['dropdown-toggle'] } ${ isOpen ? styles['dropdown-active'] : '' } ${ externalStyles }` }
                        onClick={ handleToggle }
                        onMouseDown={ event => event.stopPropagation() }
                        { ...props }
                    >
                        { label }
                        <i className={ `fa-solid fa-chevron-down ${ isOpen ? styles['chevron-active'] : styles['chevron'] }` }></i>
                    </button>
                    <Dropdown
                        options={ options } 
                        isOpen={ isOpen }
                    />
                </div>
            );
        };
    };

    return renderComponent();
};

export default Anchor;
