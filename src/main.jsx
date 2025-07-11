import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ThesisList from "./pages/thesis-fe/index.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/thesis" element={<ThesisList />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
