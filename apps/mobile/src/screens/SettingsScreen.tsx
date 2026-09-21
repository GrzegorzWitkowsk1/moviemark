import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword, coreConfig, updateProfile, useUser } from "core";
import { Screen } from "@/components/Screen";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useThemeMode, type ThemeMode } from "@/contexts/ThemeContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useMobileLogout } from "@/hooks/useMobileAuth";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const { mode, setMode } = useThemeMode();
  const { language, setLanguage } = useLanguage();
  const logout = useMobileLogout();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSurname(user.surname);
      setEmail(user.email);
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      coreConfig().setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
      showSnackbar(t("settings.profileUpdated"), "success");
    },
    onError: () => showSnackbar(t("settings.failedProfileUpdate"), "failure"),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      showSnackbar(t("settings.passwordChanged"), "success");
    },
    onError: () => showSnackbar(t("settings.failedPasswordChange"), "failure"),
  });

  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <Screen>
      <Text variant="headlineSmall" style={styles.title}>
        {t("nav.settings")}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {t("settings.subtitle")}
      </Text>

      <Card style={styles.card}>
        <Card.Title title={t("settings.accountSettings")} />
        <Card.Content style={styles.cardContent}>
          <TextInput
            mode="outlined"
            label={t("common.form.name")}
            placeholder={t("settings.namePlaceholder")}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            mode="outlined"
            label={t("common.form.surname")}
            placeholder={t("settings.surnamePlaceholder")}
            value={surname}
            onChangeText={setSurname}
          />
          <TextInput
            mode="outlined"
            label={t("common.form.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button
            mode="contained"
            loading={profileMutation.isPending}
            disabled={!user || profileMutation.isPending}
            onPress={() =>
              profileMutation.mutate({
                name: name.trim(),
                surname: surname.trim(),
                email: email.trim(),
              })
            }
          >
            {profileMutation.isPending
              ? t("common.saving")
              : t("common.saveChanges")}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title={t("settings.changePassword")} />
        <Card.Content style={styles.cardContent}>
          <TextInput
            mode="outlined"
            label={t("settings.newPassword")}
            placeholder={t("settings.newPasswordPlaceholder")}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            mode="outlined"
            label={t("settings.confirmNewPassword")}
            placeholder={t("settings.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {passwordMismatch && (
            <HelperText type="error" visible>
              {t("validation.passwordsDontMatch")}
            </HelperText>
          )}
          <Button
            mode="contained"
            loading={passwordMutation.isPending}
            disabled={
              newPassword.length < 8 ||
              passwordMismatch ||
              passwordMutation.isPending
            }
            onPress={() => passwordMutation.mutate({ newPassword })}
          >
            {passwordMutation.isPending
              ? t("settings.changing")
              : t("settings.changePassword")}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title={t("settings.appearance")} />
        <Card.Content>
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as ThemeMode)}
            buttons={[
              { value: "light", label: t("settings.theme.light") },
              { value: "dark", label: t("settings.theme.dark") },
              { value: "system", label: t("settings.theme.system") },
            ]}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title={t("settings.language")} />
        <Card.Content>
          <SegmentedButtons
            value={language}
            onValueChange={(value) => setLanguage(value as Language)}
            buttons={[
              { value: "en", label: t("settings.languageOptions.english") },
              { value: "pl", label: t("settings.languageOptions.polish") },
            ]}
          />
        </Card.Content>
      </Card>

      <View style={styles.logoutWrapper}>
        <Button
          mode="outlined"
          textColor="#B3261E"
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        >
          {t("nav.logOut")}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    gap: 12,
  },
  logoutWrapper: {
    marginTop: 8,
  },
});
