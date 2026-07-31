import React, { useMemo, type ReactNode } from 'react'
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles'

import { CssBaseline } from '@mui/material'
// import shape from './shape'
import palette from './palette'
// import typography from './typography'
// import breakpoints from './breakpoints'
// import sizes from './sizes'
// import shadows, { customShadows } from './shadows'
// import componentsOverrides from './overrides'

// Create a theme instance.

type ThemeConfigProps = {
   children: ReactNode
}

export function ThemeConfig({ children }: ThemeConfigProps) {
   const theme = useMemo(() => {
      const baseTheme = createTheme({
         palette: { ...palette.light },
        //  shape,
        //  typography,
        //  breakpoints,
        //  shadows: shadows.light,
        //  customShadows: customShadows.light,
        //  sizes,
      })

      const finalTheme = createTheme({
         ...baseTheme,
        //  components: componentsOverrides(baseTheme),
      })

      return finalTheme
   }, [])

   return React.createElement(
      StyledEngineProvider,
      { injectFirst: true },
      React.createElement(
         ThemeProvider,
         { theme },
         React.createElement(CssBaseline, null),
         children as any
      )
   )
}
