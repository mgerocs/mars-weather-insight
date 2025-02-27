import { createContext } from "react";

export type AppContextType = {
  isNavExpanded: boolean;
};

export const AppContext = createContext<AppContextType | null>(null);
