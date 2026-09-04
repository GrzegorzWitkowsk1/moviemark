import { Card, styled } from '@mui/material'

const StyledCard =  styled(Card)(({theme}) => ({
          backgroundColor: theme.palette.primary.dark,
          border: `1px solid ${theme.palette.secondary.darker}`,
          borderRadius: "16px",
          padding:'24px',
          [theme.breakpoints.down('lg')] : {
            padding:'16px',
          },
          [theme.breakpoints.down('md')]: {
            padding:'12px',
          },
          color: "#f2f0ea",
}))

export default StyledCard
