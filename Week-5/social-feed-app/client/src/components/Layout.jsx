import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import BottomNav, { ComposeFab } from "./BottomNav";

export default function Layout() {
  return (
    <div className="mx-auto flex max-w-[1265px] justify-center bg-bg">
      <Sidebar />
      <div className="w-full pb-16 md:max-w-[600px] md:border-x md:border-hairline md:pb-0">
        <Outlet />
      </div>
      <RightSidebar />
      <BottomNav />
      <ComposeFab />
    </div>
  );
}
