import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { GlobalNotificationToastContainer } from './components/GlobalNotificationToastContainer';

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
    <GlobalNotificationToastContainer />
  </ToastProvider>
);

