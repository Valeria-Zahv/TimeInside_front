import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useStores } from "./stores/useStores";
import AuthPage from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import CalendarPage from "./pages/CalendarPage";
import { ProtectedRoute } from "./components/PretectedRoute";
import "./App.css";
import Layout from "./components/layout/layout";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";

const App = observer(() => {
  const { authStore, calendarStore } = useStores();

  useEffect(() => {
    if (authStore.isAuthenticated) {
      calendarStore.fetchEvents();
    }
  }, [authStore.isAuthenticated, calendarStore]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAdminRoute={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/calendar" />} />
        </Routes>
      </Layout>
    </Router>
  );
});

export default App;
