"use client";
import React, { useState } from "react";
import { useCart } from "./CartContext";
import { X, ShoppingCart, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CartSidebar() {
  const { items, removeFromCart, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "success">("idle");

  const total = items.reduce((acc, item) => acc + item.price, 0);
  const finalTotal = total * (1 - appliedDiscount);

  const VALID_COUPONS: Record<string, number> = {
    BEMVINDO10: 0.1,
    SUSANOO50: 0.5,
    DESCONTO20: 0.2,
  };

  const applyDiscount = () => {
    const code = discountCode.toUpperCase().trim();
    if (VALID_COUPONS[code]) {
      setAppliedDiscount(VALID_COUPONS[code]);
      setDiscountMsg(`✓ Cupom aplicado! ${(VALID_COUPONS[code] * 100).toFixed(0)}% de desconto.`);
    } else {
      setAppliedDiscount(0);
      setDiscountMsg("✗ Cupom inválido.");
    }
  };

  const handleCheckout = async () => {
    setCheckoutStatus("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setCheckoutStatus("success");
    setTimeout(() => {
      clearCart();
      setCheckoutStatus("idle");
      setIsCartOpen(false);
      setAppliedDiscount(0);
      setDiscountCode("");
      setDiscountMsg("");
    }, 4000);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-[420px] h-full bg-background border-l border-surface-border shadow-2xl z-[1000] flex flex-col text-foreground"
          >
            {/* Header */}
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-black flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-accent" />
                Carrinho ({items.length})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-surface-border/50 rounded-full transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutStatus === "success" ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black mb-2">Compra Aprovada!</h3>
                <p className="text-foreground/60 font-medium text-sm leading-relaxed">
                  Os projetos foram adicionados ao seu painel e os arquivos enviados por e-mail.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-foreground/40">
                <ShoppingCart className="w-14 h-14 mb-4 opacity-30" />
                <p className="font-bold">Seu carrinho está vazio.</p>
                <p className="text-sm mt-1">Navegue no Marketplace para adicionar produtos.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Items list */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center bg-surface border border-surface-border p-3 rounded-2xl">
                      <div className="w-14 h-14 bg-surface-border/50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        {item.cover_url ? (
                          <img src={item.cover_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-foreground/20">{item.name.substring(0,3).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate text-foreground">{item.name}</h4>
                        <p className="text-accent font-black text-sm mt-0.5">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer: coupon + total + checkout */}
                <div className="p-5 border-t border-surface-border bg-surface/50 flex flex-col gap-4">
                  {/* Cupom */}
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cupom de desconto"
                        value={discountCode}
                        onChange={(e) => { setDiscountCode(e.target.value); setDiscountMsg(""); }}
                        className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-2.5 text-sm font-medium focus:border-accent outline-none uppercase placeholder:normal-case placeholder:text-foreground/40 text-foreground"
                      />
                      <button
                        onClick={applyDiscount}
                        className="px-4 bg-foreground text-background text-xs font-black rounded-xl uppercase tracking-widest hover:opacity-80 transition-opacity"
                      >
                        OK
                      </button>
                    </div>
                    {discountMsg && (
                      <p className={`text-xs font-bold mt-1.5 ${discountMsg.startsWith('✓') ? 'text-emerald-500' : 'text-red-400'}`}>
                        {discountMsg}
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm text-foreground/60">
                      <span>Subtotal</span>
                      <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-emerald-500">
                        <span>Desconto ({(appliedDiscount * 100).toFixed(0)}%)</span>
                        <span>− R$ {(total * appliedDiscount).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black pt-2 border-t border-surface-border mt-1">
                      <span>Total</span>
                      <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Botão */}
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutStatus === "loading"}
                    className="w-full py-4 bg-accent text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {checkoutStatus === "loading" ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Finalizar Compra"
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
