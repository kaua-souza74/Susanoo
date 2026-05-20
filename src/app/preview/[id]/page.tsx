"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

export default function SitePreview() {
    const params = useParams();
    const id = params.id as string;
    const [html, setHtml] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSite = async () => {
            try {
                // Buscamos o index.html do storage
                const { data, error: storageError } = await supabase.storage
                    .from('project_files')
                    .download(`${id}/index.html`);

                if (storageError) throw new Error("Index.html não encontrado no servidor.");
                
                const text = await data.text();
                setHtml(text);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSite();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Renderizando Instância...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6 p-10 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500" />
                <h1 className="text-white text-3xl font-black uppercase tracking-tighter">Erro de Publicação</h1>
                <p className="text-[#555] max-w-md font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-black rounded-xl uppercase text-xs">Tentar Novamente</button>
            </div>
        );
    }

    // Renderiza o HTML diretamente. 
    // Nota: Scripts no HTML renderizado via dangerouslySetInnerHTML não executam por padrão no React.
    // Para resolver isso e o erro de Sandbox do Supabase, vamos injetar o HTML em um iframe limpo.
    return (
        <div className="h-screen w-full bg-white overflow-hidden">
            <iframe 
                srcDoc={html} 
                className="w-full h-full border-none"
                title="Susanoo Live Preview"
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
            />
        </div>
    );
}
