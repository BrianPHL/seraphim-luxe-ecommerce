import { Button } from '@components';
import styles from './InputField.module.css';

const InputField = ({ hint, icon, action, isSubmittable, externalStyles, ...props }) => {

    if (!hint || isSubmittable === undefined) return null;

    if (!icon && !isSubmittable) {
        return (
            <input
                className={`${ styles['input-unnested'] } ${ externalStyles }`}
                placeholder={ hint }
                { ...props }
            />
        );
    };

    if (icon && !isSubmittable) {
        return (
            <div className={`${ styles['wrapper'] } ${ externalStyles }`}>
                <input
                    className={ styles['input-icon'] }
                    placeholder={ hint }
                    { ...props }
                />
                <Button
                    type='icon'
                    icon={ icon }
                    action={ action }
                    externalStyles={ styles['input-button'] }
                />
            </div>
        );
    };

    return (
        <div className={`${ styles['wrapper'] } ${ externalStyles }`}>
            <input
                className={ styles['input-icon'] }
                placeholder={ hint }
                { ...props }
            />
            <Button
                label='Search'
                type='primary'
                action={ action }
            />
        </div>
    );

};

export default InputField;