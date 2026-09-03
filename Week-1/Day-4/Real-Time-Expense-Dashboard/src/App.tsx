import ChartsSection from "./components/Charts/ChartsSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Subheading from "./components/Subheading";
import SummaryCards from "./components/SummaryCard/SummaryCards";
import TransactionsSection from "./components/TransactionsSection/TransactionsSection";

const App = () => {
  return (
    <>
      <Header />

      <section id="overview">
        <Subheading left="Overview" right="Live totals from current filters" />
        <SummaryCards />
      </section>

      <section id="transactions">
        <Subheading
          left="Transactions"
          right="Add, filter and export entries"
        />
        <TransactionsSection />
      </section>

      <section id="reports">
        <Subheading
          left="Reports"
          right="Charts based on your current transactions"
        />
        <ChartsSection />
      </section>

      <Footer />
    </>
  );
};

export default App;
