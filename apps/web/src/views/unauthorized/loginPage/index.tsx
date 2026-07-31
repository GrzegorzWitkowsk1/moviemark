import Box from "@mui/material/Box";
import StyledCard from "@/shared/components/card";
import logo from '@/assets/logo2.png'
import Typography from "@mui/material/Typography";
import {  FormControl, FormControlLabel }  from "@mui/material";
import ContainedButton from "@/shared/components/buttons/containedButton";
import OutlinedButton from "@/shared/components/buttons/outlinedButton";
import StyledTextField from "@/shared/components/textField";
import StyledRadio from "@/shared/components/buttons/radio";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    
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
        <Typography sx={{ color: "primary.light" }} variant='h5'>
            Welcome in MovieMark. 
        </Typography>
        <Typography sx={{ color: "secondary.light" }} variant="body1">
             Complete your movie and series diary
        </Typography>
        <StyledCard
          sx={{
            maxWidth: "450px",
            width: "100%",
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
            <Typography variant="body2">Email</Typography>
            <StyledTextField
              placeholder="you@example.com"
              variant="outlined"
              fullWidth
            ></StyledTextField>
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
              <Typography variant="body2">Password</Typography>
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
            ></StyledTextField>
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
            ></FormControlLabel>
          </FormControl>
          <ContainedButton variant="contained">Sign in</ContainedButton>
          <OutlinedButton onClick={() => navigate("/register")}>
            Don&apos;t have an account? Create it!
          </OutlinedButton>
        </StyledCard>
      </Box>
    );
}
