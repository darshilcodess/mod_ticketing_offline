import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketDetails from './pages/TicketDetails';
import Notifications from './pages/Notifications';
import AllIncomingRequests from './pages/AllIncomingRequests';
import AllAssignments from './pages/AllAssignments';
import AllPendingReview from './pages/AllPendingReview';
import AllActiveTickets from './pages/AllActiveTickets';
import AllResolvedHistory from './pages/AllResolvedHistory';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TicketDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/g1/incoming"
        element={
          <ProtectedRoute>
            <Layout>
              <AllIncomingRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team/assignments"
        element={
          <ProtectedRoute>
            <Layout>
              <AllAssignments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/unit/pending-review" element={<ProtectedRoute><Layout><AllPendingReview /></Layout></ProtectedRoute>} />
      <Route path="/unit/active-tickets" element={<ProtectedRoute><Layout><AllActiveTickets /></Layout></ProtectedRoute>} />
      <Route path="/unit/resolved-history" element={<ProtectedRoute><Layout><AllResolvedHistory /></Layout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
