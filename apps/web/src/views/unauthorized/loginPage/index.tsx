import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StyledCard from "@/shared/components/card";
import StyledTextField from "@/shared/components/textField";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";
import StyledRadio from "@/shared/components/buttons/radio";
import { useLogin } from "@/hooks/useAuth";
import { useSnackbar } from "@/contexts/snackbarContext";
import { loginSchema, type LoginFormValues } from "./schema";
import logo from "@/assets/logo2.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const { open } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        remember: data.remember,
      });
      open("Welcome back!", "success");
      navigate("/auth/home");
    } catch (err) {
      open(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
        "failure"
      );
    }
  };

  return (
    <Box
      className="fade-in"
      sx={{
        minHeight: "100vh",
        mx: { lg: "0%", md: "0%", xs: "2%" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: { lg: "24px", md: "16px", xs: "12px" },
        flexDirection: "column",
      }}
    >
      <img
        style={{
          height: "240px",
          width: "auto",
        }}
        src={logo}
        alt="movie-mark-logotype"
      />
      <Typography color='primary' variant="h5">
        Welcome in MovieMark.
      </Typography>
      <Typography color='primary' variant="body1">
        Complete your movie and series diary
      </Typography>
      <StyledCard
        sx={{
          maxWidth: "450px",
          width: "100%",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { lg: "12px", md: "10px", xs: "8px" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <Typography color='primary' variant="body2">Email</Typography>
            <StyledTextField
              placeholder="you@example.com"
              variant="outlined"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register("email")}
            />
          </Box>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <Typography color='primary' variant="body2">Password</Typography>
            <StyledTextField
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((s) => !s)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              {...register("password")}
            />
          </Box>
          <FormControl>
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <StyledRadio
                      checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                    />
                  }
                  label={
                    <Typography
                      sx={(theme) => ({ color: theme.palette.secondary.light })}
                      variant="caption"
                    >
                      Remember me
                    </Typography>
                  }
                />
              )}
            />
          </FormControl>
          <ContainedButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </ContainedButton>
          <OutlinedButton type="button" onClick={() => navigate("/register")}>
            Don&apos;t have an account? Create it!
          </OutlinedButton>
        </Box>
      </StyledCard>
    </Box>
  );
}