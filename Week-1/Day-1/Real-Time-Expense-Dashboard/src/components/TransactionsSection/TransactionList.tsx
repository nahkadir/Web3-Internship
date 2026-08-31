import sampleTransactions from "../../data/sampleTransactions";

const TransactionList = () => {
  return (
    <div className="w-full rounded-3xl bg-white p-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search description..."
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p min-w-45 flex-1 rounded-xl p-3 outline-none"
        />
        <select className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none">
          <option>All categories</option>
          <option>Food</option>
          <option>Transport</option>
          <option>Shopping</option>
          <option>Bills</option>
          <option>Entertainment</option>
          <option>Healthcare</option>
          <option>Education</option>
          <option>Salary</option>
          <option>Other</option>
        </select>
        <select className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none">
          <option>All types</option>
          <option>Income</option>
          <option>Expense</option>
        </select>
        <input
          type="date"
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none"
        />
        <input
          type="date"
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none"
        />
        <button className="sm:text-p text-p-mob bg-dark flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-white">
          Export CSV
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="text-h4-mob sm:text-h4 w-full min-w-2xl text-left">
          <thead>
            <tr>
              <th className="pb-3 font-bold">Date</th>
              <th className="pb-3 font-bold">Description</th>
              <th className="pb-3 font-bold">Category</th>
              <th className="pb-3 text-right font-bold">Amount</th>
            </tr>
          </thead>

          <tbody>
            {sampleTransactions.map((t) => (
              <tr
                key={t.date + t.description}
                className="border-grey border-t hover:bg-black/10"
              >
                <td className="py-4 text-gray-500">{t.date}</td>
                <td className="py-4 text-gray-900">{t.description}</td>
                <td className="py-4 text-gray-900">{t.category}</td>
                <td
                  className={`py-4 text-right font-medium ${
                    t.type === "income" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}Rs{" "}
                  {Math.abs(t.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
