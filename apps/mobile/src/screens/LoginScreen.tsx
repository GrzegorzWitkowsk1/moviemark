import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileLogin } from "@/hooks/useMobileAuth";
import { useSnackbar } from "@/contexts/SnackbarContext";
import type { RootStackParamList } from "@/navigation/types";

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const login = useMobileLogin();
  const { showSnackbar } = useSnackbar();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    login.mutate(
      { email: email.trim(), password },
      {
        onError: () =>
          showSnackbar(t("error.auth.login.invalidCredentials"), "failure"),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { paddingTop: insets.top + 24 }]}
    >
      <View style={styles.form}>
        <Text variant="headlineMedium" style={styles.title}>
          {t("auth.title")}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t("auth.subtitle")}
        </Text>

        <TextInput
          mode="outlined"
          label={t("common.form.email")}
          placeholder={t("common.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          mode="outlined"
          label={t("common.form.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword((prev) => !prev)}
            />
          }
        />
        <HelperText type="info" visible>
          {t("auth.rememberMe")}
        </HelperText>

        <Button
          mode="contained"
          loading={login.isPending}
          disabled={!canSubmit || login.isPending}
          onPress={handleSubmit}
          style={styles.submit}
        >
          {login.isPending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
        <Button mode="text" onPress={() => navigation.navigate("Register")}>
          {t("auth.noAccount")}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  form: {
    gap: 14,
  },
  title: {
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 8,
  },
  submit: {
    marginTop: 4,
  },
});
