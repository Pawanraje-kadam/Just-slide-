import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MotionProvider } from './motion/MotionProvider';
import { ProgressProvider } from './providers/ProgressProvider';
import { SavedProvider } from './providers/SavedProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <MotionProvider>
        <ThemeProvider>
        <ToastProvider>
          <ProgressProvider>
            <SavedProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </SavedProvider>
          </ProgressProvider>
        </ToastProvider>
        </ThemeProvider>
      </MotionProvider>
    </BrowserRouter>
  </StrictMode>,
);
