import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography, FormControl, FormControlLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import StyledCard from "@/shared/components/card";
import StyledTextField from "@/shared/components/textField";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";
import StyledRadio from "@/shared/components/buttons/radio";
import { useAuth } from "@/contexts/authContext";
import { useSnackbar } from "@/contexts/snackbarContext";
import { loginSchema, type LoginFormValues } from "./schema";
import logo from "@/assets/logo2.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { open } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography color='primary' variant="body2">Password</Typography>
              <Typography
                variant="body2"
                component={"a"}
                href="/"
                sx={(theme) => ({
                  color: theme.palette.primary.main,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: theme.palette.primary.light,
                  },
                })}
              >
                Forgot password?
              </Typography>
            </Box>
            <StyledTextField
              type="password"
              variant="outlined"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register("password")}
            />
          </Box>
          <FormControl>
            <FormControlLabel
              control={<StyledRadio />}
              label={
                <Typography
                  sx={(theme) => ({ color: theme.palette.secondary.light })}
                  variant="caption"
                >
                  Remember me
                </Typography>
              }
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