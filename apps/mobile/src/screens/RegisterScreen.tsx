import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRegister } from "core";
import { useSnackbar } from "@/contexts/SnackbarContext";
import type { RootStackParamList } from "@/navigation/types";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const register = useRegister();
  const { showSnackbar } = useSnackbar();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);
  const passwordsMatch = password === repeatPassword;
  const emailValid = isEmail(email);

  const valid =
    name.trim().length > 0 &&
    surname.trim().length > 0 &&
    emailValid &&
    passwordValid &&
    passwordsMatch;

  const handleSubmit = () => {
    if (!valid) {
      return;
    }
    register.mutate(
      {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
      },
      {
        onSuccess: () => {
          showSnackbar(t("auth.registrationSuccess"), "success");
          navigation.navigate("Login");
        },
        onError: () =>
          showSnackbar(t("error.auth.register.emailTaken"), "failure"),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          {t("auth.register")}
        </Text>

        <View style={styles.form}>
          <TextInput
            mode="outlined"
            label={t("common.form.name")}
            placeholder={t("auth.namePlaceholder")}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            mode="outlined"
            label={t("common.form.surname")}
            placeholder={t("auth.surnamePlaceholder")}
            value={surname}
            onChangeText={setSurname}
          />
          <TextInput
            mode="outlined"
            label={t("common.form.email")}
            placeholder={t("common.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {email.length > 0 && !emailValid && (
            <HelperText type="error" visible>
              {t("validation.emailInvalid")}
            </HelperText>
          )}
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
          {password.length > 0 && !passwordValid && (
            <HelperText type="error" visible>
              {t("validation.passwordMin")}
            </HelperText>
          )}
          <TextInput
            mode="outlined"
            label={t("auth.repeatPassword")}
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            secureTextEntry={!showPassword}
          />
          {repeatPassword.length > 0 && !passwordsMatch && (
            <HelperText type="error" visible>
              {t("validation.passwordsDontMatch")}
            </HelperText>
          )}

          <Button
            mode="contained"
            loading={register.isPending}
            disabled={!valid || register.isPending}
            onPress={handleSubmit}
          >
            {register.isPending ? t("auth.registering") : t("auth.register")}
          </Button>
          <Button mode="text" onPress={() => navigation.navigate("Login")}>
            {t("auth.alreadyHaveAccount")}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    gap: 10,
  },
});
