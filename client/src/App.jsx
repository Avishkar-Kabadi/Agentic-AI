import { useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUser, logout } from "./store/authSlice";
import { AuthPage } from "./pages/AuthPage";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { TasksPage } from "./pages/TasksPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ChatPage } from "./pages/ChatPage";

function App() {
  const token = useSelector((store) => store?.auth?.token);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8000/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          dispatch(setUser(userData));
        } else if (res.status === 401) {
          dispatch(logout());
        }
      } catch (err) {
        console.error("Profile fetch failed", err);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" /> : <AuthPage />}
        />

        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Overview />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="text-white bg-slate-950 h-screen flex items-center justify-center">
              404 - Not Found
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
