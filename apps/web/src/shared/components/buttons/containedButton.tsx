import { styled } from '@mui/material'
import Button from '@mui/material/Button'

const ContainedButton = styled(Button)<{ isDelete?: boolean }>(({ theme, isDelete }) => ({
   borderRadius: '16px',
   textTransform: 'uppercase',
   fontSize: 11,
   fontWeight: 'bold',
   cursor: 'pointer',
   color:'black',
   backgroundColor: isDelete ? theme.palette.error.dark : theme.palette.primary.main,
   ...(isDelete && {
      '&:hover': {
         backgroundColor: theme.palette.error.darker,
      },
   }),
}))

export default ContainedButton
