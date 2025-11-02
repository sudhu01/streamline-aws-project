import './App.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AuthTokenSetup from './components/auth/AuthTokenSetup'
import Header from './components/shared/Header'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import WorkflowsListPage from './pages/WorkflowsListPage'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import IntegrationsPage from './pages/IntegrationsPage'
import ExecutionLogsPage from './pages/ExecutionLogsPage'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthTokenSetup />
      <div className="min-h-screen bg-background text-text-primary dark">
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <WorkflowsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id"
            element={
              <ProtectedRoute>
                <WorkflowEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <ExecutionLogsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </ClerkProvider>
  )
}
