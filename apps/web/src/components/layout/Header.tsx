import { useState, type MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Box,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import { Search, LogOut, Settings, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/contexts/authContext';
import logo from '@/assets/logo2.png';

const NAV_ITEMS = [
  { label: 'Home', path: '/auth/home' },
  { label: 'Collection', path: '/auth/collections' },
  { label: 'Settings', path: '/auth/settings' },
] as const;

export default function Header() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentTab = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  const initials = user
    ? `${user.name.charAt(0)}${user.surname.charAt(0)}`
    : '?';

  const handleAvatarClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/auth/search');
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.secondary.darker, 0.35),
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: 2,
          minHeight: { xs: 52, sm: 60 },
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => navigate('/auth/home')}
          >
            <Box
              component="img"
              src={logo}
              alt="MovieMark logo"
              sx={{ height: 32, width: 32, objectFit: 'contain' }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: '1.15rem',
                color: theme.palette.primary.main,
                letterSpacing: '-0.02em',
              }}
            >
              MovieMark
            </Typography>
          </Box>

          {!isMobile && (
            <Tabs
              value={currentTab >= 0 ? currentTab : false}
              onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
              sx={{
                ml: 1,
                minHeight: 40,
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTabs-flexContainer': {
                  gap: 0.75,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  minHeight: 36,
                  minWidth: 0,
                  px: 1.75,
                  borderRadius: '12px',
                  transition: theme.transitions.create(
                    ['background-color', 'color'],
                    { duration: theme.transitions.duration.short }
                  ),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              {NAV_ITEMS.map((item) => (
                <Tab key={item.path} label={item.label} />
              ))}
            </Tabs>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          {isMobile ? (
            <IconButton
              onClick={() => navigate('/auth/search')}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Search size={22} />
            </IconButton>
          ) : (
            <form onSubmit={handleSearchSubmit}>
              <OutlinedInput
                placeholder="Search movies & series..."
                size="small"
                readOnly
                onClick={() => navigate('/auth/search')}
                sx={{
                  width: 200,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  backgroundColor: alpha(theme.palette.common.white, 0.06),
                  '& .MuiOutlinedInput-input': {
                    cursor: 'pointer',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <Search
                      size={18}
                      style={{ color: theme.palette.text.secondary }}
                    />
                  </InputAdornment>
                }
              />
            </form>
          )}

          <IconButton onClick={handleAvatarClick} size="small">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 180,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.24)}`,
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate('/auth/collections');
              }}
            >
              <LayoutGrid size={18} style={{ marginRight: 10 }} />
              Collections
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate('/auth/settings');
              }}
            >
              <Settings size={18} style={{ marginRight: 10 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogOut size={18} style={{ marginRight: 10 }} />
              Log Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
