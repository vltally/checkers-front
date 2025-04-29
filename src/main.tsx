import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router';
import GlobleState from './context/Context.tsx';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <GlobleState>
            <App />
        </GlobleState>
    </BrowserRouter>
);
