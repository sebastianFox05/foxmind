import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './lib/install.js';
import { DataProvider } from './session/DataContext.jsx';
import { UiProvider } from './ui/UiContext.jsx';
import './styles/styles.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <DataProvider>
          <UiProvider>
            <App />
          </UiProvider>
        </DataProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
);
