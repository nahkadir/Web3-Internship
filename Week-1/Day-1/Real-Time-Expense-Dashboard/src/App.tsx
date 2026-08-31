import Footer from "./Components/Footer";
import Header from "./Components/Header";
import Subheading from "./Components/Subheading";
import SummaryCards from "./Components/SummaryCard/SummaryCards";
import TransactionsSection from "./Components/TransactionsSection/TransactionsSection";

const App = () => {
  return (
    <>
      <Header />
      <Subheading left="Overview" right="Live totals from current filters" />
      <SummaryCards />
      <Subheading left="Transactions" right="Add, filter and export entries" />
      <TransactionsSection />
      <Footer />
    </>
  );
};

export default App;
