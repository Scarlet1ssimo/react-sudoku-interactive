import React from 'react';
import { LoginPage } from './LoginPage';
import Game from './Game';

export default function App() {
  const loggedIn = true;
  return loggedIn ? Game() : LoginPage();
}
