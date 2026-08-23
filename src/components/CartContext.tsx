"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  cover_url?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Monitorar autenticação do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar carrinho inicial (localStorage ou Supabase se logado)
  useEffect(() => {
    const loadCart = async () => {
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("cart_items")
            .select("project_id, projects(id, name, price, photos)")
            .eq("user_id", userId);

          if (!error && data) {
            const dbItems = data
              .filter((item: any) => item.projects)
              .map((item: any) => {
                const p = item.projects;
                return {
                  id: p.id,
                  name: p.name,
                  price: p.price || 0,
                  cover_url: p.photos?.[0] || "",
                };
              });
            setItems(dbItems);
            setIsLoaded(true);
            return;
          }
        } catch (e) {
          console.error("Erro ao buscar carrinho do banco:", e);
        }
      }

      // Fallback para localStorage
      try {
        const stored = localStorage.getItem("susanoo_cart");
        if (stored) setItems(JSON.parse(stored));
      } catch {}
      setIsLoaded(true);
    };

    loadCart();
  }, [userId]);

  // Sincronizar localStorage quando itens locais mudam
  useEffect(() => {
    if (isLoaded && !userId) {
      localStorage.setItem("susanoo_cart", JSON.stringify(items));
    }
  }, [items, isLoaded, userId]);

  const addToCart = async (item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsCartOpen(true);

    if (userId) {
      try {
        await supabase
          .from("cart_items")
          .insert([{ user_id: userId, project_id: item.id }]);
      } catch (e) {
        console.error("Erro ao adicionar item ao carrinho no banco:", e);
      }
    }
  };

  const removeFromCart = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (userId) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("project_id", id);
      } catch (e) {
        console.error("Erro ao remover item do carrinho no banco:", e);
      }
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (userId) {
      try {
        await supabase.from("cart_items").delete().eq("user_id", userId);
      } catch (e) {
        console.error("Erro ao limpar carrinho no banco:", e);
      }
    } else {
      localStorage.removeItem("susanoo_cart");
    }
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

