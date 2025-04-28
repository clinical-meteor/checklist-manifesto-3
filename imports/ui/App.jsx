// imports/ui/App.jsx
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
import ListsPage from './pages/ListsPage';          // Import ListsPage
import ListDetailPage from './pages/ListDetailPage'; // Import ListDetailPage

export function App() {
  const [isFirstRun, setIsFirstRun] = useState(false);
  
  // Check first run status on mount
  useEffect(() => {
    Meteor.call('accounts.isFirstRun', (err, result) => {
      if (!err) {
        setIsFirstRun(result);
      }
    });
  }, []);
  
  const { user, userLoading } = useTracker(() => {
    const userSub = Meteor.subscribe('userData');
    return {
      user: Meteor.user(),
      userLoading: !userSub.ready()
    };
  });

  if (userLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
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
        <Route path="/" element={user ? <Navigate to="/tasks/all" replace /> : <Navigate to="/login" replace />} />
        <Route path="/tasks/:filter" element={user ? <TaskListPage /> : <Navigate to="/login" replace />} />          <Route path="/task/:taskId" element={user ? <TaskDetailsPage /> : <Navigate to="/login" replace />} />
          <Route path="/protocols" element={<ProtocolLibraryPage />} />
          <Route path="/import-export" element={user ? <ImportExportPage /> : <Navigate to="/login" replace />} />
          <Route path="/protocols" element={<ProtocolLibraryPage />} />
          <Route path="/protocol/:protocolId" element={user ? <TaskDetailsPage isProtocol={true} /> : <Navigate to="/login" replace />} /> 

          <Route path="/lists" element={user ? <ListsPage /> : <Navigate to="/login" replace />} />
          <Route path="/list/:listId" element={user ? <ListDetailPage /> : <Navigate to="/login" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}