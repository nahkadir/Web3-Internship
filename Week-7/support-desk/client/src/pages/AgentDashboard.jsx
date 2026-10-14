import DashboardLayout from "../components/DashboardLayout";

export default function AgentDashboard() {
  return (
    <DashboardLayout title="Agent Dashboard">
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-gray-600">
          Your assigned tickets, customer replies, and status updates will
          appear here.
        </p>
      </div>
    </DashboardLayout>
  );
}
