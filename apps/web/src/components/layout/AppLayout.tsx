import { type ReactNode } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Box
        sx={{
          flex: 1,
          padding: { xs: '16px 12px 80px', sm: '24px', md: '32px' },
        }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
}
