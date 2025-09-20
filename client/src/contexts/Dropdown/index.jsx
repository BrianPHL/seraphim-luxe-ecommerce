import { useState, useContext, useCallback, useEffect } from 'react';
import DropdownContext from './context';

export const DropdownProvider = ({ children }) => {
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdowns, setDropdowns] = useState(new Map());

    const registerDropdown = useCallback((id, element) => {
        if (id && element) {
            setDropdowns(prev => new Map(prev).set(id, element));
        }
    }, []);

    const closeAllDropdowns = useCallback(() => {
        setOpenDropdownId(null);
    }, []);

    const handleClickOutside = useCallback((event) => {
        if (openDropdownId) {
            const dropdownElement = dropdowns.get(openDropdownId);
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                setOpenDropdownId(null);
            }
        }
    }, [openDropdownId, dropdowns]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    return (
        <DropdownContext.Provider value={{
            openDropdownId,
            setOpenDropdownId,
            registerDropdown,
            closeAllDropdowns
        }}>
            {children}
        </DropdownContext.Provider>
    );
};

export const useDropdown = () => useContext(DropdownContext);
