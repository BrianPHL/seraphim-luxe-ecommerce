import { useState } from 'react';
import { Button } from '@components';
import styles from './Counter.module.css';

const Counter = ({ initialValue = 1, min = 1, max = 99, value: controlledValue, onChange, onMinimumReached }) => {

    const [ internalValue, setInternalValue ] = useState(initialValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleIncrement = () => {
        if (value < max) {
            const newValue = value + 1;
            if (controlledValue === undefined) {
                setInternalValue(newValue);
            }
            if (onChange) {
                onChange(newValue);
            }
        }
    };
    
    const handleDecrement = () => {
        if (value > min) {
            const newValue = value - 1;
            if (controlledValue === undefined) {
                setInternalValue(newValue);
            }
            if (onChange) {
                onChange(newValue);
            }
        } else if (value === min && onMinimumReached)
            onMinimumReached();
    };
    
    const handleInputChange = (e) => {
        const inputValue = parseInt(e.target.value) || min;
        const clampedValue = Math.max(min, Math.min(max, inputValue));
        
        if (controlledValue === undefined) {
            setInternalValue(clampedValue);
        }
        if (onChange) {
            onChange(clampedValue);
        }
    };
    
    return (
        <div className={ styles['counter'] }>
            <Button
                type='icon-outlined'
                icon='fa-solid fa-minus'
                action={ handleDecrement }
                disabled={ false }
                externalStyles={ styles['counter-button'] }
            />
            <input
                type='number'
                min={ min }
                max={ max }
                value={ value }
                onChange={ handleInputChange }
                className={ styles['counter-input'] }
            />
            <Button
                type='icon-outlined'
                icon='fa-solid fa-plus'
                action={ handleIncrement }
                disabled={ value >= max }
                externalStyles={ styles['counter-button'] }
            />
        </div>
    );
};

export default Counter;