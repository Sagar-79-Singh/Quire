import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './shell/App';
import './styles.css';
import './theme/phase6.css';

const root = document.getElementById('root');
if (root) createRoot(root).render(<StrictMode><App /></StrictMode>);
