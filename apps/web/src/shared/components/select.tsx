import { styled, Select } from '@mui/material'

const StyledSelect = styled(Select)(({ theme }) => ({
  height: "45px",
  borderRadius: "16px",
  paddingY: "4px",
  color: "white",
  fontSize: "14px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#312d2a",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#312d2a",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
  },
}))

export default StyledSelect
