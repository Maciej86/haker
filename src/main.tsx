import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './screens/maps-register';
import './world/dev';
import { bootGame, safeStorage } from './boot';
import './theme/tokens.css';
import './theme/base.css';

const { store, fresh } = bootGame(safeStorage());

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App store={store} fresh={fresh} />
  </React.StrictMode>,
);
