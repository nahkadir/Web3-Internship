import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import TicketListView from "../components/TicketListView";

export default function CustomerDashboard() {
  return (
    <DashboardLayout title="My Tickets">
      <div className="flex justify-end mb-4">
        <Link
          to="/customer/new"
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg"
        >
          New ticket
        </Link>
      </div>
      <TicketListView endpoint="/tickets" />
    </DashboardLayout>
  );
}
