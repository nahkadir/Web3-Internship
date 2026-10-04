import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

export default function Layout() {
  return (
    <div className="mx-auto flex max-w-[990px] justify-center bg-bg">
      <Sidebar />
      <div className="w-full max-w-[600px] border-x border-hairline">
        <Outlet />
      </div>
      <RightSidebar />
    </div>
  );
}
