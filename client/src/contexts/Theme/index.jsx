import { useContext, useState, useEffect } from "react";
import ThemeContext from "./context";

export const ThemeProvider = ({ children }) => {
    const [ theme, setTheme ] = useState(() => localStorage.getItem("theme") || "light");
    const toggleTheme = () => {
        setTheme((previousTheme) => (previousTheme === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [ theme ]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            { children }
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
