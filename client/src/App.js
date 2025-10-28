import React, { useState } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ListView from './pages/ListView';
import { UserProvider } from "./context/UserContext";
import { ToastProvider } from "./context/ToastProvider";
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/list/:listId" element={<ListView />} />
            </Routes>
          </Router>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;