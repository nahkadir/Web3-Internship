import AddEntryBar from "./AddEntryBar";
import TransactionList from "./TransactionList";

const TransactionsSection = () => {
  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <AddEntryBar />
        <div className="mt-4">
          <TransactionList />
        </div>
      </div>
    </div>
  );
};

export default TransactionsSection;
