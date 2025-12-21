import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize theme immediately before React renders to prevent flash
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('mealwise_theme') || 'system';
  const root = document.documentElement;
  
  if (savedTheme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', savedTheme === 'dark');
  }
};

initializeTheme();

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const savedTheme = localStorage.getItem('mealwise_theme') || 'system';
  if (savedTheme === 'system') {
    document.documentElement.classList.toggle('dark', e.matches);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

