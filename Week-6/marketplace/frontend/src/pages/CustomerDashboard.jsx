import RoleDashboard from "../components/RoleDashboard";

export default function CustomerDashboard() {
  return (
    <RoleDashboard
      title="Customer Dashboard"
      endpoint="/customer/dashboard"
      abilities={["Browse the marketplace", "Place orders"]}
    />
  );
}
