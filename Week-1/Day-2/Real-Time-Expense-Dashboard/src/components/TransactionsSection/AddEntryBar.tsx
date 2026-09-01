const AddEntryBar = () => {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 p-4">
      <input
        placeholder="Description"
        className="bg-grey placeholder:text-p-mob sm:placeholder:text-p min-w-35 flex-1 rounded-md border border-black/10 p-3 outline-none"
      />

      <input
        type="number"
        placeholder="0.00"
        className="bg-grey placeholder:text-p-mob sm:placeholder:text-p w-24 rounded-md border border-black/10 p-3 outline-none"
      />

      <select className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-md border border-black/10 p-3 text-gray-700 outline-none">
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

      <input
        type="date"
        className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-md border border-black/10 p-3 text-gray-700 outline-none"
      />

      <div className="bg-grey flex gap-0.5 rounded-md border border-black/10 p-1.5">
        <button className="bg-green text-dark rounded-md px-3 py-2 text-sm font-bold">
          Expense
        </button>
        <button className="rounded-md px-3 py-2 text-sm font-medium text-gray-400">
          Income
        </button>
      </div>

      <button className="bg-dark text-p-mob sm:text-p rounded-md px-5 py-3 font-semibold text-white">
        Add Transaction
      </button>
    </div>
  );
};

export default AddEntryBar;
