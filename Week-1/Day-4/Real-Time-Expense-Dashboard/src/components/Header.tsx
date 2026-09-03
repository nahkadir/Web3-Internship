import { Sun, Menu, ChartNoAxesCombined } from "lucide-react";
import { useState } from "react";
import LiveSimulator from "./LiveSimulator";

const Header = () => {
  const [activeTab, setActiveTab] = useState("Overview");

  const tabs = [
    { label: "Overview", id: "overview" },
    { label: "Transactions", id: "transactions" },
    { label: "Reports", id: "reports" },
  ];

  const handleNavClick = (label: string, id: string) => {
    setActiveTab(label);

    const section = document.getElementById(id);

    if (section) {
      const headerOffset = 100;

      const targetPosition =
        section.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="px-4 sm:px-6">
      <header className="bg-dark fixed top-0 right-0 left-0 z-50 mx-auto my-6 flex w-full max-w-7xl items-center justify-between rounded-3xl border px-6 py-4 text-white">
        <div className="flex gap-1">
          <ChartNoAxesCombined />
          <div className="text-h4-mob sm:text-h4 font-extrabold">RTET</div>
        </div>

        <nav className="bg-dark-default text-p-mob sm:text-p hidden gap-0.5 rounded-full p-1 sm:flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.label, tab.id)}
              className={`cursor-pointer rounded-full px-4 py-2 font-medium ${
                activeTab === tab.label
                  ? "bg-green text-dark font-bold"
                  : "text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="text-p-mob sm:text-p hidden items-center gap-4 sm:flex">
          <LiveSimulator />

          <button
            aria-label="Toggle theme"
            className="bg-dark-default flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-300"
          >
            <Sun size={20} />
          </button>

          <div className="bg-dark-default text-p-mob sm:text-p hidden gap-2 rounded-full px-2.5 py-1.5 sm:flex sm:items-center">
            <div className="bg-green text-dark flex h-7 w-7 items-center justify-center rounded-full px-4 py-2 text-xs font-bold">
              RK
            </div>
            <div className="font-semibold">Rida</div>
          </div>
        </div>

        <button aria-label="Open menu" className="sm:hidden">
          <Menu />
        </button>
      </header>
    </div>
  );
};

export default Header;
