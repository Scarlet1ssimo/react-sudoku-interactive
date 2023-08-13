import React from 'react';
import { Button, Container, ThemeProvider, createTheme, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import { Form, useNavigate } from 'react-router-dom';
const theme = createTheme({
  spacing: 4,
});

theme.spacing(2);
export const LoginPage = () => {
  const navigate = useNavigate();
  const [keyId, setKeyId] = React.useState<string>("")
  return (
    <>
      <ThemeProvider theme={theme}>
        <Container sx={{ display: 'flex', justifyContent: 'center', mx: 'auto', my: 20, alignItems: 'center' }} maxWidth="sm">
          <Box>
            <Box sx={{ p: 1 }}>
              <TextField
                id="outlined-password-input"
                label="Key"
                autoComplete="current-password"
                size="small"
                onChange={(e) => setKeyId(e.target.value)}
              />
            </Box>
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-around', mx: 'auto', }}>
              <Button variant="contained" sx={{ textAlign: 'center' }} disabled={keyId === ""}
                onClick={(e) => {
                  navigate("/game/" + keyId)
                }}>Connect</Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </>
  )
}