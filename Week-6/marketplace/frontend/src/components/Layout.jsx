import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
