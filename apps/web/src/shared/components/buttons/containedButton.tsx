import { styled } from '@mui/material'
import Button from '@mui/material/Button'

const ContainedButton = styled(Button)<{ isDelete?: boolean }>(
	({ theme, isDelete }) => ({
		borderRadius: "16px",
		textTransform: "uppercase",
		fontSize: 11,
		fontWeight: "bold",
		cursor: "pointer",
		color: theme.palette.mode === "dark" ? "black" : "white",
		backgroundColor: isDelete
			? theme.palette.error.dark
			: theme.palette.primary.main,
		...(isDelete && {
			"&:hover": {
				backgroundColor: theme.palette.error.darker,
			},
		}),
		"&.Mui-disabled": {
			backgroundColor: theme.palette.grey[700],
			color: theme.palette.grey[500],
		},
	}),
);

export default ContainedButton
