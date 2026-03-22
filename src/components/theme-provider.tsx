"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Importar el tipo directamente si es posible, o usar ComponentProps
import { type ComponentProps } from "react"

export function ThemeProvider({ 
  children, 
  ...props 
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

