"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, QrCode, CheckCircle2, ShieldCheck, ArrowLeft, Lock, ShoppingBag, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [method, setMethod] = useState<"credit" | "pix">("credit");
  
  // Card States
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  // Flow State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((acc, item) => acc + item.price, 0);

  const formatCardNumber = (val: string) => {
    return val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  };

  const formatExpiry = (val: string) => {
    return val.replace(/\D/g, "").replace(/(.{2})/, "$1/").trim().slice(0, 5);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText("00020101021226880014br.gov.bcb.pix...");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Busca sessão do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Você precisa estar logado para finalizar a compra.");
        setLoading(false);
        return;
      }

      // Simula processamento do pagamento (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cria um projeto no banco para cada item do carrinho
      // Isso é o que libera o acesso ao Cronograma e à página de Projetos
      const insertPromises = items.map(item =>
        supabase.from('projects').insert([{
          name: item.name,
          client_id: session.user.id,
          deploy_url: '',
          deploy_status: 'idle',
          manual_progress: 0,
          show_in_gallery: false,
          timeline_requested: false,
          cover_url: item.cover_url || null,
        }])
      );

      const results = await Promise.all(insertPromises);
      const hasError = results.some(r => r.error);

      if (hasError) {
        const firstError = results.find(r => r.error)?.error;
        throw new Error(firstError?.message || "Erro ao registrar projeto.");
      }

      // Pagamento confirmado e projetos criados com sucesso
      const firstItemName = items[0]?.name || "Site";
      clearCart();
      setSuccess(true);

      setTimeout(() => {
        router.push(`/dashboard/chat?boughtSite=${encodeURIComponent(firstItemName)}`);
      }, 3000);

    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Erro ao processar pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 w-full h-full bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center rounded-full mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
          <h2 className="text-3xl font-black mb-3 text-foreground">Pagamento Aprovado!</h2>
          <p className="text-foreground/60 max-w-md mx-auto mb-3">
            Obrigado pela compra! Você está sendo redirecionado para o chat de suporte para acertar os detalhes do seu projeto.
          </p>
          <p className="text-sm text-foreground/40 mb-8">Redirecionando para o chat de suporte...</p>
          <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full bg-background flex flex-col text-foreground overflow-y-auto">
      <div className="p-4 px-6 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-bold text-sm cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Carrinho
        </button>
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
          <Lock className="w-3.5 h-3.5" /> Ambiente Seguro
        </span>
      </div>

      <div className="max-w-6xl w-full mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Payment Form */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-black mb-2 text-foreground">Finalizar Compra</h1>
            <p className="text-foreground/50 text-sm font-medium">Escolha a forma de pagamento ideal para você.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-sm font-bold"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <div className="flex gap-4">
            <button 
              id="payment-credit-tab"
              onClick={() => setMethod("credit")}
              className={`flex-1 p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${method === "credit" ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10' : 'border-surface-border bg-surface hover:border-foreground/20 text-foreground/60 hover:text-foreground'}`}
            >
              <CreditCard className="w-8 h-8" />
              <span className="font-bold text-sm">Cartão de Crédito</span>
            </button>
            <button 
              id="payment-pix-tab"
              onClick={() => setMethod("pix")}
              className={`flex-1 p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${method === "pix" ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' : 'border-surface-border bg-surface hover:border-foreground/20 text-foreground/60 hover:text-foreground'}`}
            >
              <QrCode className="w-8 h-8" />
              <span className="font-bold text-sm">PIX (Instantâneo)</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === "credit" && (
              <motion.div key="credit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-8">
                
                {/* Visual Credit Card */}
                <div className="relative w-[340px] h-[215px] perspective-1000 mx-auto lg:mx-0">
                   <motion.div 
                     className="w-full h-full relative preserve-3d transition-transform duration-500" 
                     animate={{ rotateY: isFlipped ? 180 : 0 }}
                   >
                     {/* Front */}
                     <div className="absolute inset-0 backface-hidden bg-gradient-to-tr from-accent to-purple-600 rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-white border border-white/20">
                       <div className="flex justify-between items-center">
                         <div className="w-12 h-8 bg-white/20 rounded-md backdrop-blur-sm" />
                         <span className="font-black italic text-xl">Susanoo</span>
                       </div>
                       <div>
                         <p className="font-mono text-xl tracking-[0.2em] mb-2">{cardNumber || "•••• •••• •••• ••••"}</p>
                         <div className="flex justify-between items-end uppercase text-xs font-bold tracking-wider opacity-80">
                           <div className="flex flex-col">
                             <span className="text-[9px] opacity-60">Titular</span>
                             <span>{cardName || "NOME IMPRESSO"}</span>
                           </div>
                           <div className="flex flex-col text-right">
                             <span className="text-[9px] opacity-60">Validade</span>
                             <span>{cardExpiry || "MM/AA"}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     {/* Back */}
                     <div className="absolute inset-0 backface-hidden bg-surface border border-surface-border rounded-3xl shadow-2xl flex flex-col pt-6 text-foreground transform rotateY-180">
                       <div className="w-full h-12 bg-black mb-4" />
                       <div className="px-6 flex flex-col items-end">
                         <span className="text-[9px] uppercase font-black opacity-40 mb-1">CVC</span>
                         <div className="bg-white text-black w-16 h-8 flex items-center justify-center font-mono font-bold rounded shadow-inner">
                           {cardCVC || "•••"}
                         </div>
                       </div>
                     </div>
                   </motion.div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2 text-foreground">Número do Cartão</label>
                    <input 
                      type="text" 
                      id="card-number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-surface border border-surface-border rounded-xl p-4 font-medium focus:border-accent outline-none text-foreground"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2 text-foreground">Nome do Titular</label>
                    <input 
                      type="text" 
                      id="card-name"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="COMO IMPRESSO NO CARTÃO"
                      className="w-full bg-surface border border-surface-border rounded-xl p-4 font-medium focus:border-accent outline-none uppercase text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2 text-foreground">Validade</label>
                    <input 
                      type="text" 
                      id="card-expiry"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="MM/AA"
                      className="w-full bg-surface border border-surface-border rounded-xl p-4 font-medium focus:border-accent outline-none text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2 text-foreground">CVC</label>
                    <input 
                      type="text" 
                      id="card-cvc"
                      value={cardCVC}
                      maxLength={4}
                      onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ""))}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      placeholder="123"
                      className="w-full bg-surface border border-surface-border rounded-xl p-4 font-medium focus:border-accent outline-none text-foreground"
                    />
                  </div>
                </div>

              </motion.div>
            )}

            {method === "pix" && (
              <motion.div key="pix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-surface border border-surface-border rounded-3xl p-8 flex flex-col items-center text-center">
                <div className="w-48 h-48 bg-white rounded-xl p-2 mb-6 shadow-sm border border-foreground/10">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=susanoopixmock" alt="QR Code PIX" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-black text-lg mb-2 text-foreground">Escaneie o QR Code</h3>
                <p className="text-sm text-foreground/50 mb-6 max-w-sm">Abra o aplicativo do seu banco e escaneie o código acima para pagamento instantâneo.</p>
                <div className="w-full bg-background border border-surface-border p-4 rounded-xl flex items-center justify-between gap-4">
                  <span className="font-mono text-xs opacity-50 truncate text-foreground">00020101021226880014br.gov.bcb.pix...</span>
                  <button
                    id="copy-pix-btn"
                    onClick={handleCopyPix}
                    className="text-xs font-black uppercase tracking-wider text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-surface border border-surface-border rounded-3xl p-6 lg:p-8 sticky top-24">
            <h2 className="text-xl font-black flex items-center gap-2 mb-6 text-foreground">
              <ShoppingBag className="w-5 h-5 text-accent" /> Resumo do Pedido
            </h2>

            <div className="flex flex-col gap-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-background rounded-xl border border-surface-border overflow-hidden shrink-0">
                    {item.cover_url ? (
                      <img src={item.cover_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black opacity-20 text-foreground">{item.name.substring(0,3)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate text-foreground">{item.name}</h4>
                    <p className="text-foreground/50 text-xs">Licença Vitalícia</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-foreground">R$ {item.price.toFixed(2).replace('.',',')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-border pt-6 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-foreground/60">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm text-foreground/60">
                <span>Cronograma de entrega</span>
                <span className="text-emerald-500 font-bold">Incluído</span>
              </div>
              <div className="flex justify-between text-lg font-black mt-2 text-foreground">
                <span>Total a pagar</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <button 
              id="confirm-payment-btn"
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="w-full mt-8 py-5 bg-accent text-white font-black rounded-xl uppercase tracking-widest shadow-xl shadow-accent/20 hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Confirmar Pagamento"}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest text-foreground/40">
              <ShieldCheck className="w-4 h-4" /> Pagamento Criptografado
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotateY-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
