import RoleDashboard from "../components/RoleDashboard";

export default function VendorDashboard() {
  return (
    <RoleDashboard
      title="Vendor Dashboard"
      endpoint="/vendor/dashboard"
      abilities={[
        "Browse the marketplace",
        "Create products",
        "Manage your own products",
        "Manage orders for your products",
        "Place orders",
      ]}
    />
  );
}
