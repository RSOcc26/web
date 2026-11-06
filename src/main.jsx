import { createRoot } from 'react-dom/client';
import { App } from './shell/App.jsx';
import './shared/styles/base.css';

createRoot(document.getElementById('root')).render(<App />);
