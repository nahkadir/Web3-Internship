import Footer from "./components/Footer";
import Header from "./components/Header";
import Subheading from "./components/Subheading";
import SummaryCards from "./components/SummaryCard/SummaryCards";
import TransactionsSection from "./components/TransactionsSection/TransactionsSection";

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
