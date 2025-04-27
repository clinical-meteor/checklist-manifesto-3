import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import TaskListPage from './pages/TaskListPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtocolLibraryPage from './pages/ProtocolLibraryPage';
import ImportExportPage from './pages/ImportExportPage';
import NotFoundPage from './pages/NotFoundPage';
import FirstRunSetupPage from './pages/FirstRunSetupPage';

export function App() {
  const { user, userLoading, isFirstRun } = useTracker(() => {
    const userSub = Meteor.subscribe('userData');
    
    // Check if this is the first run (no users exist)
    const checkFirstRun = new ReactiveVar(false);
    Meteor.call('accounts.isFirstRun', (err, result) => {
      if (!err) {
        checkFirstRun.set(result);
      }
    });
    
    return {
      user: Meteor.user(),
      userLoading: !userSub.ready(),
      isFirstRun: checkFirstRun.get()
    };
  });

  if (userLoading) {
    return <div>Loading...</div>;
  }

  // If this is the first run, show the setup page
  if (isFirstRun) {
    return <FirstRunSetupPage />;
  }

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
        </Route>
        
        {/* Main app routes (protected) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={user ? <TaskListPage filter="all" /> : <Navigate to="/login" replace />} />
          <Route path="/tasks/:filter" element={user ? <TaskListPage /> : <Navigate to="/login" replace />} />
          <Route path="/task/:taskId" element={user ? <TaskDetailsPage /> : <Navigate to="/login" replace />} />
          <Route path="/protocols" element={<ProtocolLibraryPage />} />
          <Route path="/import-export" element={user ? <ImportExportPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;