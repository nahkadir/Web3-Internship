import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import TicketListView from "../components/TicketListView";

export default function AdminTickets() {
  return (
    <DashboardLayout title="All Tickets">
      <Link to="/admin" className="text-sm text-indigo-600 inline-block mb-4">
        ← User management
      </Link>
      <TicketListView endpoint="/admin/tickets" isAdmin showCustomer />
    </DashboardLayout>
  );
}
