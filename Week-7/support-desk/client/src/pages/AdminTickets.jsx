import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import TicketListView from "../components/TicketListView";

export default function AdminTickets() {
  return (
    <DashboardLayout title="All Tickets">
      <div className="flex gap-4 mb-4 text-sm">
        <Link to="/admin" className="text-indigo-600">
          ← Users
        </Link>
        <Link to="/admin/analytics" className="text-indigo-600">
          Analytics
        </Link>
      </div>
      <TicketListView endpoint="/admin/tickets" isAdmin showCustomer />
    </DashboardLayout>
  );
}
