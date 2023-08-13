import { Button, Container, ThemeProvider, createTheme, TextField } from '@mui/material';
import Box from '@mui/material/Box';
const theme = createTheme({
  spacing: 4,
});

theme.spacing(2);
export const LoginPage = () => {
  return (
    <>
      <ThemeProvider theme={theme}>
        <Container sx={{ display: 'flex', justifyContent: 'center', mx: 'auto', my: 20, alignItems: 'center' }} maxWidth="sm">
          <Box>
            <Box sx={{ p: 1 }}>
              <TextField
                id="outlined-password-input"
                label="Key"
                type="password"
                autoComplete="current-password"
                size="small"
              />
            </Box>
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-around', mx: 'auto', }}>
              <Button variant="contained" sx={{ textAlign: 'center' }}>Create</Button>
              <Button variant="outlined" sx={{ textAlign: 'center' }}>Join</Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </>
  )
}