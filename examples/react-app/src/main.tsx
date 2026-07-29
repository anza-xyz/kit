import './index.css';
import '@radix-ui/themes/styles.css';

import { Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

const rootNode = document.getElementById('root')!;
const root = createRoot(rootNode);
root.render(
    <StrictMode>
        <Theme>
            <App />
        </Theme>
    </StrictMode>,
);
