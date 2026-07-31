import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import StyledCard from "../../../shared/components/card";
import StyledTextField from "../../../shared/components/textField";
import ContainedButton from "../../../shared/components/buttons/containedButton";
import { registerSchema, type RegisterFormValues } from "./schema";
import logo from "../../../../public/logo2.png";

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    console.log(data);
  };

  return (
    <Box
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
      <Typography sx={{ color: "primary.light" }} variant="h5">
        Welcome in MovieMark.
      </Typography>
      <Typography sx={{ color: "secondary.light" }} variant="body1">
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
            <Typography variant="body2">Name</Typography>
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
            <Typography variant="body2">Surname</Typography>
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
            <Typography variant="body2">Email</Typography>
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
            <Typography variant="body2">Password</Typography>
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
            <Typography variant="body2">Repeat password</Typography>
            <StyledTextField
              type="password"
              variant="outlined"
              fullWidth
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </Box>
          <ContainedButton type="submit">Register</ContainedButton>
          <ContainedButton
            type="button"
            sx={{
              backgroundColor: "transparent",
              color: "primary.main",
              border: "1px solid",
              borderColor: "primary.main",
              "&:hover": {
                backgroundColor: "rgba(189, 159, 124, 0.08)",
              },
            }}
            onClick={() => navigate("/login")}
          >
            Already have an account?
          </ContainedButton>
        </Box>
      </StyledCard>
    </Box>
  );
}
