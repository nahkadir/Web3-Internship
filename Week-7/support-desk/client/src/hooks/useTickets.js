import { useEffect, useState } from "react";
import api from "../services/api";
import { getErrorMessage } from "../utils/getErrorMessage";

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v != null),
  );

export default function useTickets(endpoint, params) {
  const [data, setData] = useState({
    tickets: [],
    pagination: { page: 1, pages: 1, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const key = JSON.stringify(clean(params));

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .get(endpoint, { params: JSON.parse(key) })
        .then((res) => {
          if (ignore) return;
          setData(res.data.data);
          setError("");
        })
        .catch((err) => !ignore && setError(getErrorMessage(err)))
        .finally(() => !ignore && setLoading(false));
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [endpoint, key]);

  return { ...data, loading, error };
}
