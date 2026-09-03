"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, User, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
    id: string;
    role: "user" | "ai";
    content: string;
};

// Flag para controle da IA da Susanoo (ocultada temporariamente a pedido do usuário para uso futuro)
const IS_AI_ENABLED = false;

export function SusanooAIWidget() {
    if (!IS_AI_ENABLED) return null;

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "ai", content: "Olá! Sou a IA da Susanoo. Como posso te ajudar hoje? Posso verificar o andamento do seu projeto ou responder dúvidas técnicas." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        let aiResponse = "";

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

        if (!apiKey) {
            // Fallback response if no API Key is set
            aiResponse = "A chave de API do Gemini (NEXT_PUBLIC_GEMINI_API_KEY) não foi encontrada no .env.local. Por favor, configure para eu poder pensar!";
        } else {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                
                // Formulate system prompt conceptually by prepending to the first user message or history
                const history = messages.filter(m => m.id !== "1").map(m => ({
                    role: m.role === "ai" ? "model" : "user",
                    parts: [{ text: m.content }]
                }));

                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: "Você é a Susanoo AI, assistente virtual inteligente da agência premium Susanoo. Você ajuda clientes e desenvolvedores com dúvidas sobre sites, portfólio, tecnologia e status dos projetos. Seja concisa, clara e sempre solícita." }] },
                        { role: "model", parts: [{ text: "Entendido. Como posso ajudar hoje?" }] },
                        ...history
                    ]
                });

                const result = await chat.sendMessage(input);
                aiResponse = result.response.text();
            } catch (error) {
                console.error("Gemini Error:", error);
                aiResponse = "Tive um problema ao me comunicar com meu núcleo lógico. Tente novamente em instantes.";
            }
        }

        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", content: aiResponse };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            height: isMinimized ? "60px" : "500px" 
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={`bg-surface border border-surface-border rounded-2xl shadow-2xl mb-4 w-[350px] sm:w-[400px] overflow-hidden flex flex-col ${isMinimized ? '' : 'max-h-[80vh]'}`}
                    >
                        {/* Header */}
                        <div className="bg-accent text-white p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">Susanoo AI</h3>
                                    <p className="text-[10px] text-white/70 font-medium">Assistente Virtual</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="hover:bg-white/20 p-1.5 rounded-md transition-colors" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button className="hover:bg-white/20 p-1.5 rounded-md transition-colors" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background custom-scrollbar">
                                    {messages.map(msg => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={msg.id} 
                                            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === "ai" ? "bg-accent/20 text-accent" : "bg-surface-border text-foreground/50"}`}>
                                                {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-surface-border text-foreground rounded-tr-sm" : "bg-accent/10 border border-accent/20 text-foreground rounded-tl-sm"}`}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3 max-w-[85%]">
                                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-accent/20 text-accent">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                            <div className="p-4 rounded-2xl text-sm bg-accent/10 border border-accent/20 rounded-tl-sm flex gap-1 items-center">
                                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 bg-surface border-t border-surface-border">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                                            placeholder="Pergunte sobre seu site..."
                                            className="w-full bg-background border border-surface-border rounded-full py-3 pl-4 pr-12 text-sm focus:border-accent focus:outline-none transition-colors"
                                        />
                                        <button 
                                            onClick={handleSend}
                                            disabled={!input.trim() || isLoading}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:hover:bg-accent"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-2 text-[10px] text-center text-foreground/40 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Powered by Susanoo AI
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                    className="w-14 h-14 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-background hover:bg-accent/90 transition-colors group"
                >
                    <Bot className="w-6 h-6 group-hover:animate-pulse" />
                </motion.button>
            )}
        </div>
    );
}
