import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Typography, useTheme, alpha, InputAdornment, IconButton } from "@mui/material";
import { User, Lock, Palette, Globe, Eye, EyeOff } from "lucide-react";
import StyledCard from "@/shared/components/card";
import StyledTextField from "@/shared/components/textField";
import {StyledSelect, PaperStyles, StyledMenuItem} from "@/shared/components/select";
import ContainedButton from "@/shared/components/buttons/containedButton";
import { useUser } from "@/hooks/useAuth";
import { useSnackbar } from "@/contexts/snackbarContext";
import { useThemeMode, type ThemeMode } from "@/contexts/themeContext";
import { useLanguage, type Language } from "@/contexts/languageContext";
import { useDialog } from "@/contexts/dialogContext";
import { updateProfile, changePassword } from "@/lib/api";
import { setAccessToken } from "@/lib/token";
import {
  profileSchema,
  passwordSchema,
  type ProfileFormValues,
  type PasswordFormValues,
} from "./schema";

const THEME_OPTIONS: { value: ThemeMode; label: string; sublabel: string }[] = [
  { value: "light", label: "Light", sublabel: "light theme" },
  { value: "dark", label: "Dark", sublabel: "dark theme" },
  { value: "system", label: "System", sublabel: "Match your OS" },
];

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "12px",
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.main,
        }}
      >
        {icon}
      </Box>
      <Typography color='primary' variant="h6" sx={{ fontSize: "1.1rem" }}>
        {title}
      </Typography>
    </Box>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography color='primary' variant="body2" sx={{ mb: 0.5, fontWeight: 500, textAlign: "left" }}>
      {children}
    </Typography>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { open } = useSnackbar();
  const { mode, setMode } = useThemeMode();
  const { language, setLanguage } = useLanguage();
  const { openDialog } = useDialog();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      name: user?.name ?? "",
      surname: user?.surname ?? "",
      email: user?.email ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      const result = await updateProfile({
        name: data.name,
        surname: data.surname,
        email: data.email,
      });
      setAccessToken(result.accessToken);
      queryClient.setQueryData(["user"], result.user);
      open("Profile updated!", "success");
    } catch (error) {
      open(
        error instanceof Error ? error.message : "Failed to update profile.",
        "failure"
      );
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword({ newPassword: data.newPassword });
      open("Password changed!", "success");
      passwordForm.reset();
    } catch (error) {
      open(
        error instanceof Error ? error.message : "Failed to change password.",
        "failure"
      );
    }
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion requested");
    open("Account deletion requested", "info");
  };

  const optionButtonStyles = (isActive: boolean) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    py: 1.5,
    px: 2.5,
    borderRadius: "16px",
    border: `2px solid ${isActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.15)}`,
    backgroundColor: isActive
      ? alpha(theme.palette.primary.main, 0.1)
      : "transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
  });

  return (
		<Box
			className="fade-in"
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 3,
				py: 4,
				px: { xs: 2, sm: 3, md: 4 },
				maxWidth: 800,
				mx: "auto",
				textAlign: "left",
			}}
		>
			<Box>
				<Typography
					color="primary"
					variant="h4"
					sx={{ fontWeight: 700, mb: 0.5 }}
				>
					Settings
				</Typography>
				<Typography
					variant="body2"
					sx={(theme) => ({ color: theme.palette.secondary.light })}
				>
					Tune MovieMark to feel like yours.
				</Typography>
			</Box>

			<StyledCard>
				<SectionHeader icon={<User size={20} />} title="Account Settings" />
				<Box
					component="form"
					onSubmit={profileForm.handleSubmit(onProfileSubmit)}
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: { lg: "row", xs: "column" },
							gap: 2,
						}}
					>
						<Box sx={{ flex: 1 }}>
							<FieldLabel>Name</FieldLabel>
							<StyledTextField
								placeholder="Your name"
								variant="outlined"
								fullWidth
								error={!!profileForm.formState.errors.name}
								helperText={profileForm.formState.errors.name?.message}
								{...profileForm.register("name")}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<FieldLabel>Surname</FieldLabel>
							<StyledTextField
								placeholder="Your surname"
								variant="outlined"
								fullWidth
								error={!!profileForm.formState.errors.surname}
								helperText={profileForm.formState.errors.surname?.message}
								{...profileForm.register("surname")}
							/>
						</Box>
					</Box>
					<Box>
						<FieldLabel>Email</FieldLabel>
						<StyledTextField
							placeholder="you@example.com"
							variant="outlined"
							fullWidth
							error={!!profileForm.formState.errors.email}
							helperText={profileForm.formState.errors.email?.message}
							{...profileForm.register("email")}
						/>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1 }}>
						<ContainedButton
							type="submit"
							sx={{ minWidth: 160 }}
							disabled={profileForm.formState.isSubmitting}
						>
							{profileForm.formState.isSubmitting
								? "Saving..."
								: "Save Changes"}
						</ContainedButton>
					</Box>
				</Box>
			</StyledCard>

			<StyledCard>
				<SectionHeader icon={<Lock size={20} />} title="Change Password" />
				<Box
					component="form"
					onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: { md: "row", xs: "column" },
							gap: 2,
						}}
					>
						<Box sx={{ flex: 1 }}>
							<FieldLabel>New Password</FieldLabel>
							<StyledTextField
								type={showNewPassword ? "text" : "password"}
								placeholder="Enter new password"
								variant="outlined"
								fullWidth
								error={!!passwordForm.formState.errors.newPassword}
								helperText={passwordForm.formState.errors.newPassword?.message}
								slotProps={{
									input: {
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={() => setShowNewPassword((s) => !s)}
													onMouseDown={(e) => e.preventDefault()}
													edge="end"
													tabIndex={-1}
												>
													{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
												</IconButton>
											</InputAdornment>
										),
									},
								}}
								{...passwordForm.register("newPassword")}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<FieldLabel>Confirm New Password</FieldLabel>
							<StyledTextField
								type={showConfirmPassword ? "text" : "password"}
								placeholder="Confirm new password"
								variant="outlined"
								fullWidth
								error={!!passwordForm.formState.errors.confirmPassword}
								helperText={
									passwordForm.formState.errors.confirmPassword?.message
								}
								slotProps={{
									input: {
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={() => setShowConfirmPassword((s) => !s)}
													onMouseDown={(e) => e.preventDefault()}
													edge="end"
													tabIndex={-1}
												>
													{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
												</IconButton>
											</InputAdornment>
										),
									},
								}}
								{...passwordForm.register("confirmPassword")}
							/>
						</Box>
					</Box>
					<Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1 }}>
						<ContainedButton
							type="submit"
							sx={{ minWidth: 160 }}
							disabled={passwordForm.formState.isSubmitting}
						>
							{passwordForm.formState.isSubmitting
								? "Changing..."
								: "Change Password"}
						</ContainedButton>
					</Box>
				</Box>
			</StyledCard>

			<StyledCard>
				<SectionHeader icon={<Palette size={20} />} title="Appearance" />
				<Box
					sx={{
						display: "flex",
						flexDirection: { lg: "row", xs: "column" },
						gap: 2,
					}}
				>
					{THEME_OPTIONS.map((opt) => (
						<Box
							key={opt.value}
							sx={optionButtonStyles(mode === opt.value)}
							onClick={() => setMode(opt.value)}
						>
							<Typography
								color="primary"
								sx={{ fontWeight: 600, fontSize: "0.85rem", mb: 0.25 }}
							>
								{opt.label}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "primary.light", fontSize: "0.7rem" }}
							>
								{opt.sublabel}
							</Typography>
						</Box>
					))}
				</Box>
			</StyledCard>

			<StyledCard>
				<SectionHeader icon={<Globe size={20} />} title="Language" />
				<StyledSelect
					MenuProps={{
						slotProps: {
							paper: {
								sx: {
									...PaperStyles(theme),
								},
							},
						},
					}}
					value={language}
					sx={{ minWidth: 200 }}
					onChange={(e) => setLanguage(e.target.value as Language)}
				>
					<StyledMenuItem value="en">English</StyledMenuItem>
					<StyledMenuItem value="pl">Polski</StyledMenuItem>
				</StyledSelect>
			</StyledCard>
			<StyledCard>
				<Typography color="primary" variant="body2">
					{`MovieMark v1.0. All rights reserved. ${new Date().getFullYear()} ® `}
				</Typography>
			</StyledCard>

			<Box sx={{ py: 1, display: "flex", justifyContent: "flex-end" }}>
				<ContainedButton
					isDelete
					onClick={() =>
						openDialog({
							title: "Are you sure?",
							content:
								"This action cannot be undone. All your data will be permanently deleted.",
							confirmLabel: "Yes",
							cancelLabel: "No",
							variant: "delete",
							onConfirm: handleDeleteAccount,
						})
					}
				>
					Delete Account
				</ContainedButton>
			</Box>
		</Box>
	);
}
