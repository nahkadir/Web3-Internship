import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("backend not reachable"));
  }, []);

  return <h1>Backend says: {status}</h1>;
}

export default App;
