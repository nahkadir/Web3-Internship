import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const EMPTY = {
  groups: [],
  itemCount: 0,
  hasIssues: false,
  totals: {
    subtotal: 0,
    shippingAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
  },
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY);
      setReady(true);
      return;
    }
    try {
      const data = await api("/cart");
      setCart(data.cart);
    } catch {
      /* keep the previous cart if the request fails */
    } finally {
      setReady(true);
    }
  }, [user?.id]);

  useEffect(() => {
    setReady(false);
    refresh();
  }, [refresh]);

  // every mutation returns the full, recalculated cart from the server
  const mutate = async (path, options) => {
    const data = await api(path, options);
    setCart(data.cart);
    return data.cart;
  };

  const addItem = (productId, quantity = 1) =>
    mutate("/cart/items", { method: "POST", body: { productId, quantity } });
  const updateItem = (itemId, quantity) =>
    mutate(`/cart/items/${itemId}`, { method: "PATCH", body: { quantity } });
  const removeItem = (itemId) =>
    mutate(`/cart/items/${itemId}`, { method: "DELETE" });

  return (
    <CartContext.Provider
      value={{ cart, ready, refresh, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
