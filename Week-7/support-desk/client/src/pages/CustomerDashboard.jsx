import DashboardLayout from "../components/DashboardLayout";

export default function CustomerDashboard() {
  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-gray-600">
          Submit new tickets, track your own tickets, and reply to support here.
        </p>
      </div>
    </DashboardLayout>
  );
}
