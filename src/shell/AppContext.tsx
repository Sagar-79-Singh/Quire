import { createContext, useContext } from 'react';
import type { ShellIO } from './io';
import type { MenuAction } from './shortcuts';
export interface AppContextValue { io: ShellIO; dispatch: (action: MenuAction) => void; }
export const AppContext = createContext<AppContextValue | null>(null);
export function useAppContext(): AppContextValue | null { return useContext(AppContext); }
