import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import reportWebVitals from './reportWebVitals';

// Creo el archivo .env con la URL de la API
// En producción, estos valores se configurarían mediante variables de entorno
// REACT_APP_API_URL=http://localhost:3001/api

// Renderizo la aplicación
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mido el rendimiento de la aplicación si es necesario
reportWebVitals();