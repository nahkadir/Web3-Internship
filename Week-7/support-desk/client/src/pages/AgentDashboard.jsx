import DashboardLayout from "../components/DashboardLayout";
import TicketListView from "../components/TicketListView";

export default function AgentDashboard() {
  return (
    <DashboardLayout title="Assigned Tickets">
      <TicketListView endpoint="/tickets" showCustomer />
    </DashboardLayout>
  );
}
