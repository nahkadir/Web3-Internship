import { ChartNoAxesCombined } from "lucide-react";

const Footer = () => {
  return (
    <div className="px-4 sm:px-6">
      <footer className="bg-dark mx-auto my-6 flex w-full max-w-7xl flex-col gap-6 rounded-3xl px-6 py-8 text-white sm:flex-row sm:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <div className="flex items-center gap-1">
            <ChartNoAxesCombined size={18} />
            <span className="text-h4 font-extrabold">RTET</span>
          </div>
          <p className="text-p-mob sm:text-p text-gray-400">
            Track income, expenses and savings in one clean dashboard.
          </p>
          <p className="text-p-mob sm:text-p text-green">
            © 2026 RTET. All rights reserved.
          </p>
        </div>

        <div className="flex gap-12">
          <div className="flex flex-col gap-2">
            <span className="text-p-mob sm:text-p font-bold text-white">
              Product
            </span>
            <a
              href="#"
              className="text-p-mob sm:text-p hover:text-green text-gray-400"
            >
              Overview
            </a>
            <a
              href="#"
              className="text-p-mob sm:text-p hover:text-green text-gray-400"
            >
              Transactions
            </a>
            <a
              href="#"
              className="text-p-mob sm:text-p hover:text-green text-gray-400"
            >
              Reports
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-p-mob sm:text-p font-bold text-white">
              Resources
            </span>
            <a
              href="#"
              className="text-p-mob sm:text-p hover:text-green text-gray-400"
            >
              Export data
            </a>
            <a
              href="#"
              className="text-p-mob sm:text-p hover:text-green text-gray-400"
            >
              Categories
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
