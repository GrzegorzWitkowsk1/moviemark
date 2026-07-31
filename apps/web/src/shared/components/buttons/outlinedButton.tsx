import { styled } from "@mui/material";
import Button from "@mui/material/Button";

const OutlinedButton = styled(Button)(({ theme }) => ({
  borderRadius: "16px",
  textTransform: "uppercase",
  fontSize: 11,
  fontWeight: "bold",
  cursor: "pointer",
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.primary.main}`,
  backgroundColor: "transparent",
  "&:hover": {
    backgroundColor: "rgba(189, 159, 124, 0.08)",
  },
  "&.Mui-disabled": {
    border: `1px solid ${theme.palette.grey[700]}`,
    color: theme.palette.grey[500],
  },
}));

export default OutlinedButton;
