import { Button, Anchor } from '@components';
import styles from './Dropdown.module.css';

const Dropdown = ({ options, position='left', isOpen }) => {

    if (!options || options.length === 0) return null;

    return (
        <ul className={ `${ styles['dropdown'] } ${ isOpen ? styles['dropdown-active'] : styles['dropdown-inactive'] } ${ position === 'right' ? styles['dropdown-right'] : styles['dropdown-left'] } }` }>
            { options.map((option, index) => (
                <li key={ index }>
                    { option.link ? (
                        <Anchor
                            label={ option.label }
                            link={ option.link }
                            isNested={ true }
                        />
                    ) : (
                        <Button
                            label={ option.label }
                            action={ option.action }
                        />
                    )}
                </li>
            ))}
        </ul>
    );
};

export default Dropdown;
