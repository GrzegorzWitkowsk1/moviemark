import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography, InputAdornment, IconButton } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RegisterRequest } from "shared";
import StyledCard from "@/shared/components/card";
import StyledTextField from "@/shared/components/textField";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";
import { registerSchema, type RegisterFormValues } from "./schema";
import { useRegister } from "@/hooks/useAuth";
import { useSnackbar } from "@/contexts/snackbarContext";
import logo from "@/assets/logo2.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { open } = useSnackbar();
  const registerMutation = useRegister();
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      await registerMutation.mutateAsync(payload);
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
              type={showConfirmPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
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
