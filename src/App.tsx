import React from 'react';
import Game from './Game';
import { Button, Container, ThemeProvider, createTheme, TextField } from '@mui/material';
import Box from '@mui/material/Box';
const theme = createTheme({
  spacing: 4,
});
theme.spacing(2);

export default function App() {
  const [loggedIn, setLoggedIn] = React.useState(false)
  return loggedIn ? Game() : (<>
    <ThemeProvider theme={theme}>
      <Container sx={{ display: 'flex', justifyContent: 'center', mx: 'auto', alignItems: 'center' }} maxWidth="sm">
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
            <Button variant="contained" sx={{ textAlign: 'center' }}
              onClick={(e) => {
                setLoggedIn(true)
              }}>Create</Button>
            <Button variant="outlined" sx={{ textAlign: 'center' }}
              onClick={(e) => {
                setLoggedIn(true)
              }}>Join</Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  </>);
}
