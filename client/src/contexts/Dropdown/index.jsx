import { useContext, useState, useRef, useEffect } from 'react';
import DropdownContext from './context';

export const DropdownProvider = ({ children }) => {

    const [ openDropdownId, setOpenDropdownId ] = useState(null);
    const dropdownRefs = useRef({});

    useEffect(() => {
        
        const handleClick = (event) => {
            const isInside = Object.values(dropdownRefs.current).some(ref => ref?.contains(event.target));
            if (!isInside) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);

    }, []);

    const registerDropdown = (id, ref) => {
        dropdownRefs.current[id] = ref;
    };

    return (
        <DropdownContext.Provider value={{ openDropdownId, setOpenDropdownId, registerDropdown }}>
            { children }
        </DropdownContext.Provider>
    );

};

export const useDropdown = () => useContext(DropdownContext);
