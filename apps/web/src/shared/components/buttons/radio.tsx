import { Radio, styled,  } from '@mui/material'

const StyledRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.primary.main, 
  "&.Mui-checked": {
    color: theme.palette.primary.main,
  },

  "&:hover": {
    backgroundColor: "rgba(107, 66, 38, 0.08)",
  },
}));

export default StyledRadio
