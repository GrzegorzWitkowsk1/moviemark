import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { RegisterRequest } from "shared";
import StyledCard from "@/shared/components/card";
import StyledTextField from "@/shared/components/textField";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";
import { registerSchema, type RegisterFormValues } from "./schema";
import { registerUser } from "@/lib/api";
import { useSnackbar } from "@/contexts/snackbarContext";
import logo from "@/assets/logo2.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { open } = useSnackbar();
  const [registered, setRegistered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!registered) return;
    const timeout = setTimeout(() => navigate("/login"), 1500);
    return () => clearTimeout(timeout);
  }, [registered, navigate]);

  const onSubmit = async (data: RegisterFormValues) => {
    const payload: RegisterRequest = {
      name: data.name,
      surname: data.surname,
      email: data.email,
      password: data.password,
    };

    try {
      await registerUser(payload);
      open(
        "Registration successful, you will be redirected to the login page",
        "success"
      );
      setRegistered(true);
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
            <Typography color='primary' variant="body2">Name</Typography>
            <StyledTextField
              placeholder="John"
              variant="outlined"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register("name")}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <Typography color='primary' variant="body2">Surname</Typography>
            <StyledTextField
              placeholder="Doe"
              variant="outlined"
              fullWidth
              error={!!errors.surname}
              helperText={errors.surname?.message}
              {...register("surname")}
            />
          </Box>
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
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <Typography color='primary' variant="body2">Password</Typography>
            <StyledTextField
              type="password"
              variant="outlined"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register("password")}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <Typography color='primary' variant="body2">Repeat password</Typography>
            <StyledTextField
              type="password"
              variant="outlined"
              fullWidth
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </Box>
          <ContainedButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </ContainedButton>
          <OutlinedButton type="button" onClick={() => navigate("/login")}>
            Already have an account?
          </OutlinedButton>
        </Box>
      </StyledCard>
    </Box>
  );
}
