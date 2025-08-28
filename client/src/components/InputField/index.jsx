import { Button } from '@components';
import styles from './InputField.module.css';

const InputField = ({ hint, icon, action, isSubmittable, externalStyles, disabled, ...props }) => {

    if (!hint || isSubmittable === undefined) return null;

    if (!icon && !isSubmittable) {
        return (
            <input
                className={`${ styles['input-unnested'] } ${ externalStyles }`}
                placeholder={ hint }
                disabled={ disabled }
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
                    disabled={ disabled }
                    { ...props }
                />
                <Button
                    type='icon'
                    icon={ icon }
                    action={ action }
                    disabled={ disabled }
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
                disabled={ disabled }
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