import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import BoardPage from "./pages/BoardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    // Routes is the container for all the possible URLs the application understands
    <Routes>
      {/* each route defines one URL/Component */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;
