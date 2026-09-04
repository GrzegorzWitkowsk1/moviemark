import { styled, Select, type Theme, MenuItem } from '@mui/material'

const StyledSelect = styled(Select)(({ theme }) => ({
	height: "45px",
	borderRadius: "16px",
	paddingY: "4px",
	color: theme.palette.text.primary,
	fontSize: "14px",
	"& .MuiOutlinedInput-notchedOutline": {
		borderColor: theme.palette.primary.darker,
	},
	"&:hover .MuiOutlinedInput-notchedOutline": {
		borderColor: theme.palette.primary.darker,
	},
	"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
		borderColor: theme.palette.primary.main,
	},
	"& .MuiSelect-select": {
		display: "flex",
		alignItems: "center",
	},
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
	borderRadius: "8px",
	fontSize:'14px',
	"&:hover": {
		backgroundColor: theme.palette.primary.light,
	},
	"&.Mui-selected": {
		backgroundColor: theme.palette.primary.light,
	},
	"&.Mui-selected:hover": {
		backgroundColor: theme.palette.primary.light,
	},
}));

const PaperStyles = (theme: Theme) => ({
	backgroundColor: theme.palette.primary.dark,
	borderRadius: "16px",
	padding: "4px",
	color: theme.palette.text.primary,
});


export {StyledSelect, StyledMenuItem, PaperStyles}
