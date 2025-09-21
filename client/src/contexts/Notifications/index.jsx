import { useCallback, useContext, useEffect, useState } from "react";
import { useAuth, useToast } from '@contexts';
import { fetchWithTimeout } from "@utils";
import NotificationsContext from "./context";

export const NotificationsProvider = ({ children }) => {


    return (
        <NotificationsContext.Provider value={{
            
        }}>
            { children }
        </NotificationsContext.Provider>
    );

};

export const useNotifications = () => useContext(NotificationsContext);
