import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import { BRAND_NAME } from "../constants/brand";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-cloud-veil bg-paper-white">
        <div className="mx-auto max-w-[1200px] px-4 py-6 text-[12px] text-slate-gray">
          © {new Date().getFullYear()} {BRAND_NAME}. Independent vendors, one
          marketplace.
        </div>
      </footer>
    </div>
  );
}
