"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Star, MessageSquare, Send, Trash2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Review = {
    id: string;
    created_at: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
};

interface ReviewsSectionProps {
    projectId?: string;
    developerId?: string;
}

export function ReviewsSection({ projectId, developerId }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadReviews = async () => {
        setLoading(true);
        let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
        if (projectId) {
            query = query.eq("project_id", projectId);
        } else if (developerId) {
            query = query.eq("developer_id", developerId);
        } else {
            setReviews([]);
            setLoading(false);
            return;
        }

        const { data, error } = await query;
        if (data) setReviews(data);
        setLoading(false);
    };

    useEffect(() => {
        loadReviews();

        // Obter usuário atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setCurrentUser(session.user);
        });
    }, [projectId, developerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return alert("Você precisa fazer login para comentar.");
        if (!comment.trim()) return;

        setSubmitting(true);
        const userName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "Usuário";
        
        const payload: any = {
            user_id: currentUser.id,
            user_name: userName,
            rating,
            comment: comment.trim(),
        };

        if (projectId) payload.project_id = projectId;
        if (developerId) payload.developer_id = developerId;

        const { error } = await supabase.from("reviews").insert([payload]);
        if (!error) {
            setComment("");
            setRating(5);
            loadReviews();
        } else {
            console.error("Erro ao enviar avaliação:", error);
            alert("Erro ao publicar comentário. Certifique-se de que a tabela 'reviews' foi criada no banco.");
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Deseja excluir seu comentário?")) return;
        const { error } = await supabase.from("reviews").delete().eq("id", id);
        if (!error) {
            setReviews(prev => prev.filter(r => r.id !== id));
        }
    };

    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header / Resumo */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-background border border-surface-border p-5 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-foreground">Avaliações e Comentários</h4>
                        <p className="text-xs text-foreground/50">{reviews.length} feedback(s) publicado(s)</p>
                    </div>
                </div>

                {avgRating && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold px-3 py-1.5 rounded-xl text-xs w-fit">
                        <Star className="w-3.5 h-3.5 fill-emerald-500" />
                        <span>Média de {avgRating} Estrelas</span>
                    </div>
                )}
            </div>

            {/* Formulário de Criação */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="bg-background border border-surface-border p-5 rounded-2xl flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Deixe sua nota:</div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    className="p-0.5 transition-transform hover:scale-115 active:scale-90"
                                >
                                    <Star 
                                        className={`w-6 h-6 transition-colors ${
                                            star <= (hoverRating ?? rating) 
                                                ? "fill-amber-400 text-amber-400" 
                                                : "text-foreground/20 fill-transparent"
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Escreva sua avaliação sincera..."
                            required
                            rows={3}
                            className="w-full bg-surface border border-surface-border rounded-xl p-4 pr-12 text-sm text-foreground placeholder-foreground/30 focus:border-accent outline-none resize-none transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !comment.trim()}
                            className="absolute bottom-4 right-4 p-2 bg-accent text-white rounded-xl hover:bg-accent/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.05] active:scale-[0.95]"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-surface/50 border border-surface-border rounded-2xl p-6 text-center text-sm font-semibold text-foreground/50">
                    Faça login na plataforma para publicar uma avaliação.
                </div>
            )}

            {/* Lista de Avaliações */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-xs font-bold text-foreground/30 uppercase tracking-widest bg-surface/10 rounded-2xl border border-surface-border/50">
                        Nenhuma avaliação registrada ainda.
                    </div>
                ) : (
                    <AnimatePresence>
                        {reviews.map((rev) => (
                            <motion.div
                                key={rev.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-surface border border-surface-border rounded-2xl p-5 relative group"
                            >
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-black uppercase">
                                            {rev.user_name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-foreground block">{rev.user_name}</span>
                                            <span className="text-[9px] text-foreground/45 font-bold uppercase">
                                                {new Date(rev.created_at).toLocaleDateString("pt-BR", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, idx) => (
                                                <Star 
                                                    key={idx} 
                                                    className={`w-3.5 h-3.5 ${
                                                        idx < rev.rating 
                                                            ? "fill-amber-400 text-amber-400" 
                                                            : "text-foreground/15 fill-transparent"
                                                    }`} 
                                                />
                                            ))}
                                        </div>

                                        {currentUser && currentUser.id === rev.user_id && (
                                            <button 
                                                onClick={() => handleDelete(rev.id)}
                                                className="p-1 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="Apagar avaliação"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/75 leading-relaxed font-medium pl-11">{rev.comment}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
