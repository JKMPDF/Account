
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CompanyDataProvider } from './context/CompanyDataContext';
import { HashRouter } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { DateRangeProvider } from './context/DateRangeContext';
import { ModalProvider } from './context/ModalContext';
import { ThemeProvider } from './context/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <NotificationProvider>
          <CompanyDataProvider>
            <DateRangeProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </DateRangeProvider>
          </CompanyDataProvider>
        </NotificationProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);