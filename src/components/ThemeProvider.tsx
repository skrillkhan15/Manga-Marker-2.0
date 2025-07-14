
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    React.useEffect(() => {
        const savedAppTheme = localStorage.getItem('mangamarks-app-theme');
        if (savedAppTheme) {
            document.body.classList.add(`theme-${savedAppTheme}`);
            document.body.dataset.themeName = savedAppTheme;
        }
    }, []);
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
