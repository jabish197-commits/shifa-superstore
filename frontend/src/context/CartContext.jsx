import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cartService';
const CartContext = createContext(null);
const empty = { items: [], subtotal: '0.00', total: '0.00', item_count: 0, can_checkout: false };
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(empty);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (user?.role !== 'customer') {
      setCart(empty);
      return empty;
    }
    const { data } = await cartService.get();
    setCart(data);
    return data;
  }, [user?.id, user?.role]);
  useEffect(() => {
    refresh().catch(() => setCart(empty));
  }, [refresh]);
  const mutate = async (operation) => {
    setBusy(true);
    try {
      const { data } = await operation();
      setCart(data);
      return data;
    } finally {
      setBusy(false);
    }
  };
  return (
    <CartContext.Provider
      value={{
        cart,
        busy,
        refresh,
        add: (id, qty) => mutate(() => cartService.add(id, qty)),
        update: (id, qty) => mutate(() => cartService.update(id, qty)),
        remove: (id) => mutate(() => cartService.remove(id)),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
