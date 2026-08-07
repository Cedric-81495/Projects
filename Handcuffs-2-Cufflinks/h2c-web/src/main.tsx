import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found in index.html');

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Prerendered routes ship with markup already in #root, so attach to it rather
// than throwing it away and re-rendering from scratch.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
