import { Grommet } from "grommet";
import { grommet } from "grommet/themes";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// 页面组件
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";

// 认证相关
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { deepMerge } from "grommet/utils";

// Grommet主题
const theme = deepMerge(grommet, {
  global: {
    font: {
      family: "Roboto",
      size: "18px",
      height: "20px",
    },
  },
});

function App() {
  return (
    <Router>
      <Grommet full theme={theme} themeMode="dark">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Grommet>
    </Router>
  );
}

export default App;
