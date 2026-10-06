import RoleDashboard from "../components/RoleDashboard";

export default function AdminDashboard() {
  return (
    <RoleDashboard
      title="Admin Dashboard"
      endpoint="/admin/dashboard"
      abilities={[
        "Browse the marketplace",
        "Create products and manage all products",
        "Manage users",
        "Manage vendors",
        "Manage vendor orders",
        "Manage payments",
        "Place orders",
      ]}
    />
  );
}
