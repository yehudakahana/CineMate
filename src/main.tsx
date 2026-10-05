import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/heebo'
import App from './App'
import { DataProvider } from './data'
import { LangProvider } from './i18n'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LangProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
