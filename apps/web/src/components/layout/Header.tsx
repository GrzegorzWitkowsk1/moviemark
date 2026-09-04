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
  InputAdornment,
  Box,
  useTheme,
  alpha,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { Search, LogOut, Settings, LayoutGrid } from 'lucide-react';
import { useUser, useLogout } from '@/hooks/useAuth';
import logo from '@/assets/logo_clean.png';
import StyledTextField from '@/shared/components/textField';

const NAV_ITEMS = [
  { label: 'Home', path: '/auth/home' },
  { label: 'Collection', path: '/auth/collections' },
  { label: 'Settings', path: '/auth/settings' },
] as const;

export default function Header() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const logoutMutation = useLogout();
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
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  return (
		<AppBar
			position="sticky"
			elevation={0}
			sx={{
				backgroundColor:
					theme.palette.mode === "dark"
						? alpha(theme.palette.secondary.darker, 0.9)
						: alpha(theme.palette.primary.dark, 0.9),
				borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
			}}
		>
			<Toolbar
				sx={{
					justifyContent: "space-between",
					gap: 2,
					minHeight: { xs: 52, sm: 60 },
					px: { xs: 1.5, sm: 2 },
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						minWidth: 0,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							cursor: "pointer",
							flexShrink: 0,
						}}
						onClick={() => navigate("/auth/home")}
					>
						<Box
							sx={{
								p: 0.5,
								backgroundColor: theme.palette.primary.lighter,
								display: "flex",
								alignItems: "center",
								borderRadius: "12px",
							}}
						>
							<Box
								component="img"
								src={logo}
								alt="MovieMark logo"
								sx={{ height: {lg: 42, md:36, xs: 28}, width: {lg: 42, md:36, xs: 28}, objectFit: "contain" }}
							/>
						</Box>
						<Typography
							variant="h6"
							noWrap
							sx={{
								fontWeight: 700,
								fontSize: "1.15rem",
								color: theme.palette.primary.main,
								letterSpacing: "-0.02em",
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
								minHeight: 30,
								"& .MuiTabs-indicator": {
									display: "none",
								},
								"& .MuiTabs-flexContainer": {
									gap: 0.75,
								},
								"& .MuiTab-root": {
									textTransform: "none",
									fontWeight: 500,
									color:
										theme.palette.mode === "dark"
											? theme.palette.grey[400]
											: theme.palette.grey[700],
									minHeight: 36,
									minWidth: 0,
									ml: 0.5,
									px: 1.75,
									borderRadius: "30px",
									transition: theme.transitions.create(
										["background-color", "color"],
										{ duration: theme.transitions.duration.short },
									),
									"&:hover": {
										backgroundColor: alpha(theme.palette.primary.main, 0.1),
										color:
											theme.palette.mode === "dark"
												? "white"
												: theme.palette.grey[900],
									},
									"&.Mui-selected": {
										backgroundColor: alpha(theme.palette.primary.main, 0.18),
										color:
											theme.palette.mode === "dark"
												? "white"
												: theme.palette.grey[900],
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
						display: "flex",
						alignItems: "center",
						gap: 1.5,
						flexShrink: 0,
					}}
				>
					{isMobile ? (
						<IconButton
							onClick={() => navigate("/auth/search")}
							sx={{ color: theme.palette.text.secondary }}
						>
							<Search size={22} />
						</IconButton>
					) : (
						<form onSubmit={handleSearchSubmit}>
							<StyledTextField
								variant="outlined"
								placeholder="Search movies & series..."
								onClick={() => navigate("/auth/search")}
								sx={{
									width: 250,
									borderRadius: "16px",
									cursor: "pointer",
									backgroundColor: alpha(theme.palette.common.white, 0.06),
									"& .MuiOutlinedInput-input": {
										cursor: "pointer",
									},
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(theme.palette.primary.main, 0.2),
									},
									"&:hover .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(theme.palette.primary.main, 0.4),
									},
									"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
										borderColor: theme.palette.primary.main,
									},
								}}
								slotProps={{
									input: {
										readOnly: true,
										startAdornment: (
											<InputAdornment position="start">
												<Search
													size={18}
													style={{ color: theme.palette.text.secondary }}
												/>
											</InputAdornment>
										),
									},
								}}
							/>
						</form>
					)}

					<IconButton onClick={handleAvatarClick} size="small">
						<Avatar
							sx={{
								width: 32,
								height: 32,
								bgcolor: "#bd9f7c",
								color: "black",
								fontSize: "0.8rem",
							}}
						>
							{initials}
						</Avatar>
					</IconButton>

					<Menu
						anchorEl={anchorEl}
						open={open}
						onClose={handleMenuClose}
						transformOrigin={{ horizontal: "right", vertical: "top" }}
						anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
						slotProps={{
							paper: {
								sx: {
									backgroundColor: theme.palette.secondary.darker,
									border: `1px solid ${theme.palette.secondary.light}`,
									minWidth: 250,
									borderRadius: "16px",
									boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.24)}`,
									"& .MuiMenuItem-root": {
										gap: 0,
										borderRadius: "8px",
										color: theme.palette.primary.light,
										fontSize: "0.9rem",
										transition: "background-color 0.2s ease, color 0.2s ease",
										"&:hover": {
											backgroundColor: theme.palette.primary.lighter,
											color: theme.palette.primary.light,
										},
										"&:focus-visible": {
											outline: `2px solid ${theme.palette.primary.main}`,
											outlineOffset: "-2px",
										},
									},
								},
							},
						}}
					>
						<Typography
							sx={{
								color: theme.palette.primary.light,
								ml: 2,
								mt: 1,
								fontWeight: "bold",
							}}
						>
							{`${user?.name} ${user?.surname}`}
						</Typography>
						<Divider flexItem sx={{ my: 1 }} />
						<MenuItem
							onClick={() => {
								handleMenuClose();
								navigate("/auth/collections");
							}}
						>
							<LayoutGrid size={18} style={{ marginRight: 10 }} />
							My collection
						</MenuItem>
						<MenuItem
							onClick={() => {
								handleMenuClose();
								navigate("/auth/settings");
							}}
						>
							<Settings size={18} style={{ marginRight: 10 }} />
							Settings
						</MenuItem>
						<Divider flexItem />
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
