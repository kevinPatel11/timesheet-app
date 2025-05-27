import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
// import Timesheets from './pages/Timesheets';
// import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function LayoutWithSidebar() {
  return (
    <div className="flex">
      <Sidebar />
       <div className="flex-1">
        <Header />
      <main className="flex-1 bg-[#f1fafa] min-h-screen p-6">
        {/* This will render nested page components */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} /> 
          {/* <Route path="/timesheets" element={<Timesheets />} /> */}
          {/* <Route path="/settings" element={<Settings />} />  */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <LayoutWithSidebar />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
