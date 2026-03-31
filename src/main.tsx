import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

function App() {
  return <div style={{ padding: 40, fontFamily: 'Inter' }}>
    <h1 style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}>AI Feed</h1>
    <p style={{ color: '#878680' }}>Loading...</p>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
