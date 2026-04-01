// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// --- DEV TOOLS ---
import NarrativeForge from './tools/NarrativeForge.tsx';

// Notice: No index.css or App.css imports here. Just a clean slate.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* === RUN THE GAME === */}
    <App />

    {/* === RUN THE FORGE === */}
    <NarrativeForge />
  </StrictMode>,
);