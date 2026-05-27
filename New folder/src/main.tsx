import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { seedDatabase } from './lib/seeder';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.VITE_SEED_DATABASE === 'true') {
  // Seed in the background so Firebase startup errors never block the UI.
  void seedDatabase().catch((error) => {
    console.error('Database seeding failed:', error);
  });
}
