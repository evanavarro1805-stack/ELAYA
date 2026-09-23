import React, { createContext, useContext, useState, useCallback } from "react";

export type CartItem = {
  product_id: string;
  product_type: string;
  shop_id: string;
  name: string;
  image?: string;
  unit_price: number;
  quantity: number;
  customization?: any;
};

type CartCtx = {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (id: string) => void;
  updateQty: (id: string, q: number) => void;
  clear: () => void;
  total: number;
};

const Ctx = createContext<CartCtx>({} as any);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const add = useCallback((i: CartItem) => {
    setItems((cur) => {
      const idx = cur.findIndex((c) => c.product_id === i.product_id && !c.customization && !i.customization);
      if (idx >= 0) {
        const cp = [...cur]; cp[idx] = { ...cp[idx], quantity: cp[idx].quantity + i.quantity }; return cp;
      }
      return [...cur, i];
    });
  }, []);
  const remove = useCallback((id: string) => setItems((c) => c.filter((x) => x.product_id !== id)), []);
  const updateQty = useCallback((id: string, q: number) => setItems((c) => c.map((x) => x.product_id === id ? { ...x, quantity: Math.max(1, q) } : x)), []);
  const clear = useCallback(() => setItems([]), []);
  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  return <Ctx.Provider value={{ items, add, remove, updateQty, clear, total }}>{children}</Ctx.Provider>;
}
