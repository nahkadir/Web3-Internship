import { Sun, Menu, ChartNoAxesCombined } from "lucide-react";

const Header = () => {
  return (
    <div className="px-4 sm:px-6">
      <header className="bg-dark mx-auto my-6 flex w-full max-w-7xl items-center justify-between rounded-3xl border px-6 py-4 text-white">
        <div className="flex gap-1">
          <ChartNoAxesCombined />
          <div className="text-h4-mob sm:text-h4 font-extrabold">RTET</div>
        </div>

        <nav className="bg-dark-default text-p-mob sm:text-p hidden gap-0.5 rounded-full p-1 sm:flex">
          <button className="bg-green text-dark rounded-full px-4 py-2 font-bold">
            Overview
          </button>
          <button className="rounded-full px-4 py-2 font-medium text-gray-400">
            Transactions
          </button>
          <button className="rounded-full px-4 py-2 font-medium text-gray-400">
            Reports
          </button>
        </nav>

        <div className="text-p-mob sm:text-p hidden items-center gap-4 sm:flex">
          <button className="bg-dark-default flex h-9 w-9 items-center justify-center rounded-full text-gray-300">
            <Sun size={20} />
          </button>

          <div className="bg-dark-default text-p-mob sm:text-p hidden gap-2 rounded-full px-2.5 py-1.5 sm:flex sm:items-center">
            <div className="bg-green text-dark flex h-7 w-7 items-center justify-center rounded-full px-4 py-2 text-xs font-bold">
              RK
            </div>
            <div className="font-semibold">Rida</div>
          </div>
        </div>

        <div className="sm:hidden">
          <Menu />
        </div>
      </header>
    </div>
  );
};

export default Header;
