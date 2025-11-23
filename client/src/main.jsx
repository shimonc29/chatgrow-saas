import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeSentry } from './config/sentry';
import theme from './theme/index';
import './index.css';

// Initialize Sentry before rendering the app
initializeSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={theme}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ChakraProvider>
);
