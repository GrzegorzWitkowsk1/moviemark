import { useMemo, type ReactNode } from 'react'
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles'

import { CssBaseline } from '@mui/material'
import palette from './palette'

type ThemeConfigProps = {
  children: ReactNode
}

export function ThemeConfig({ children }: ThemeConfigProps) {
  const theme = useMemo(
    () => createTheme({ palette: { ...palette.light } }),
    []
  )

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
