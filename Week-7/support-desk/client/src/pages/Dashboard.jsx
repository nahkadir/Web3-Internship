import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../constants/roles";

export default function Dashboard() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}
