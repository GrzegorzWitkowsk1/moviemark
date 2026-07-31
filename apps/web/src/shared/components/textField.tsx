import { styled, TextField } from '@mui/material'

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    height: "45px",
    borderRadius: "16px",
    borderColor: `1px solid white`,
    paddingY: "4px",
    color: "white",
    fontSize: "14px",
    "& fieldset": {
      borderColor: "#312d2a",
    },
    "&:hover fieldset": {
      borderColor: "#312d2a",
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main
    },
  },
}));

export default StyledTextField
