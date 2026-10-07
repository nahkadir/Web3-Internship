import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleDashboard from "../components/RoleDashboard";
import VendorApplyForm from "../components/VendorApplyForm";

export default function CustomerDashboard() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmitted = async () => {
    await refreshUser(); // role is now VENDOR
    navigate("/vendor/dashboard", { replace: true });
  };

  return (
    <>
      <RoleDashboard
        title="Customer Dashboard"
        endpoint="/customer/dashboard"
        abilities={["Browse the marketplace", "Place orders"]}
      />
      <div className="mx-auto max-w-[1200px] px-4 pb-16">
        <section className="max-w-xl bg-paper-white p-6">
          <h2 className="text-[26px] font-bold leading-[1.2]">
            Sell on the marketplace
          </h2>
          <p className="mt-2 text-[15px] text-slate-gray">
            Apply to open your own store. An admin reviews every application
            before you can publish products.
          </p>
          <div className="mt-6">
            <VendorApplyForm onSubmitted={handleSubmitted} />
          </div>
        </section>
      </div>
    </>
  );
}
