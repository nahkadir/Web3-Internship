import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TransactionProvider } from "./context/TransactionContext.tsx";
import { FilterProvider } from "./context/FilterContext.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FilterProvider>
      <TransactionProvider>
        <App />
      </TransactionProvider>
    </FilterProvider>
  </StrictMode>,
);
