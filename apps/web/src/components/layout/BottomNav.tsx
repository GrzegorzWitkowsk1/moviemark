import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import { Home, LayoutGrid, Search, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', path: '/auth/home', icon: <Home size={22} /> },
  { label: 'Collection', path: '/auth/collections', icon: <LayoutGrid size={22} /> },
  { label: 'Search', path: '/auth/search', icon: <Search size={22} /> },
  { label: 'Settings', path: '/auth/settings', icon: <Settings size={22} /> },
] as const;

export default function BottomNav() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isMobile) return null;

  const currentIndex = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <BottomNavigation
      showLabels
        value={currentIndex >= 0 ? currentIndex : -1}
        onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
        sx={{
          height: 64,
          backgroundColor:					theme.palette.mode === "dark"
						? alpha(theme.palette.secondary.darker, 0.9)
						: alpha(theme.palette.primary.dark, 0.9),
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          color: theme.palette.mode === "dark" ? theme.palette.grey[500] : theme.palette.grey[700],
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            color: theme.palette.mode === "dark" ? theme.palette.grey[500] : theme.palette.grey[700],
            padding: '6px 0 8px',
            '& .MuiBottomNavigationAction-label': {
              color: theme.palette.mode === "dark" ? theme.palette.grey[500] : theme.palette.grey[700],
              mt: 0.5,
            },
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.18),
              borderRadius: '12px',
              '& .MuiBottomNavigationAction-label': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            },
          },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Box>
  );
}
