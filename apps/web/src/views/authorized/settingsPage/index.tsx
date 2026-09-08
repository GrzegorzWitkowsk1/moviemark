import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  createProfileSchema,
  createPasswordSchema,
  type ProfileFormValues,
  type PasswordFormValues,
} from "./schema";

const THEME_OPTIONS: {
  value: ThemeMode;
  labelKey: string;
  sublabelKey: string;
}[] = [
  {
    value: "light",
    labelKey: "settings.theme.light",
    sublabelKey: "settings.theme.lightSub",
  },
  {
    value: "dark",
    labelKey: "settings.theme.dark",
    sublabelKey: "settings.theme.darkSub",
  },
  {
    value: "system",
    labelKey: "settings.theme.system",
    sublabelKey: "settings.theme.systemSub",
  },
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
  const { t } = useTranslation();
  const { user } = useUser();
  const { open } = useSnackbar();
  const { mode, setMode } = useThemeMode();
  const { language, setLanguage } = useLanguage();
  const { openDialog } = useDialog();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(createProfileSchema(t)),
    mode: "onChange",
    defaultValues: {
      name: user?.name ?? "",
      surname: user?.surname ?? "",
      email: user?.email ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(createPasswordSchema(t)),
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
      open(t("settings.profileUpdated"), "success");
    } catch (error) {
      open(
        error instanceof Error ? error.message : t("settings.failedProfileUpdate"),
        "failure"
      );
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword({ newPassword: data.newPassword });
      open(t("settings.passwordChanged"), "success");
      passwordForm.reset();
    } catch (error) {
      open(
        error instanceof Error ? error.message : t("settings.failedPasswordChange"),
        "failure"
      );
    }
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion requested");
    open(t("settings.accountDeletionRequested"), "info");
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
					{t("nav.settings")}
				</Typography>
				<Typography
					variant="body2"
					sx={(theme) => ({ color: theme.palette.secondary.light })}
				>
					{t("settings.subtitle")}
				</Typography>
			</Box>

			<StyledCard>
				<SectionHeader icon={<User size={20} />} title={t("settings.accountSettings")} />
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
							<FieldLabel>{t("common.form.name")}</FieldLabel>
							<StyledTextField
								placeholder={t("settings.namePlaceholder")}
								variant="outlined"
								fullWidth
								error={!!profileForm.formState.errors.name}
								helperText={profileForm.formState.errors.name?.message}
								{...profileForm.register("name")}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<FieldLabel>{t("common.form.surname")}</FieldLabel>
							<StyledTextField
								placeholder={t("settings.surnamePlaceholder")}
								variant="outlined"
								fullWidth
								error={!!profileForm.formState.errors.surname}
								helperText={profileForm.formState.errors.surname?.message}
								{...profileForm.register("surname")}
							/>
						</Box>
					</Box>
					<Box>
						<FieldLabel>{t("common.form.email")}</FieldLabel>
						<StyledTextField
							placeholder={t("common.emailPlaceholder")}
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
								? t("common.saving")
								: t("common.saveChanges")}
						</ContainedButton>
					</Box>
				</Box>
			</StyledCard>

			<StyledCard>
				<SectionHeader icon={<Lock size={20} />} title={t("settings.changePassword")} />
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
							<FieldLabel>{t("settings.newPassword")}</FieldLabel>
							<StyledTextField
								type={showNewPassword ? "text" : "password"}
								placeholder={t("settings.newPasswordPlaceholder")}
								variant="outlined"
								fullWidth
								error={!!passwordForm.formState.errors.newPassword}
								helperText={passwordForm.formState.errors.newPassword?.message}
								slotProps={{
									input: {
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label={t("common.togglePasswordVisibility")}
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
							<FieldLabel>{t("settings.confirmNewPassword")}</FieldLabel>
							<StyledTextField
								type={showConfirmPassword ? "text" : "password"}
								placeholder={t("settings.confirmPasswordPlaceholder")}
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
													aria-label={t("common.togglePasswordVisibility")}
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
								? t("settings.changing")
								: t("settings.changePassword")}
						</ContainedButton>
					</Box>
				</Box>
			</StyledCard>

			<StyledCard>
				<SectionHeader icon={<Palette size={20} />} title={t("settings.appearance")} />
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
								{t(opt.labelKey)}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "primary.light", fontSize: "0.7rem" }}
							>
								{t(opt.sublabelKey)}
							</Typography>
						</Box>
					))}
				</Box>
			</StyledCard>

			<StyledCard>
				<SectionHeader icon={<Globe size={20} />} title={t("settings.language")} />
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
					<StyledMenuItem value="en">{t("settings.languageOptions.english")}</StyledMenuItem>
					<StyledMenuItem value="pl">{t("settings.languageOptions.polish")}</StyledMenuItem>
				</StyledSelect>
			</StyledCard>
			<StyledCard>
				<Typography color="primary" variant="body2">
					{t("settings.footer", { year: new Date().getFullYear() })}
				</Typography>
			</StyledCard>

			<Box sx={{ py: 1, display: "flex", justifyContent: "flex-end" }}>
				<ContainedButton
					isDelete
					onClick={() =>
						openDialog({
							title: t("settings.deleteDialogTitle"),
							content: t("settings.deleteDialogContent"),
							confirmLabel: t("common.yes"),
							cancelLabel: t("common.no"),
							variant: "delete",
							onConfirm: handleDeleteAccount,
						})
					}
				>
					{t("settings.deleteAccount")}
				</ContainedButton>
			</Box>
		</Box>
	);
}
