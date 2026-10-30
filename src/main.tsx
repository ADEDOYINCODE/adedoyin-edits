import React from 'react';import ReactDOM from 'react-dom/client';import {seed} from './db';import App from './App';import './styles.css';
seed().then(()=>ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)).catch(e=>{document.getElementById('root')!.textContent='Unable to open local storage: '+String(e)});
