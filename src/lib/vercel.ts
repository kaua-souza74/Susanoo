"use server";

/**
 * Esta Server Action lida com a integração oficial com a API da Vercel.
 */
export async function deployToVercel(projectName: string, files: { file: string, data: string }[]) {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    
    if (!VERCEL_TOKEN) {
        throw new Error("Token da Vercel não configurado. Adicione VERCEL_TOKEN ao seu .env.local");
    }

    try {
        console.log(`Iniciando deploy para Vercel: ${projectName}`);
        
        // 1. Criar o deployment na Vercel (API v13)
        const response = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                files: files.map(f => ({
                    file: f.file,
                    data: f.data,
                    encoding: 'utf-8'
                })),
                target: 'production',
                projectSettings: {
                    framework: null
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Vercel Error Detail:", result);
            throw new Error(result.error?.message || "Erro desconhecido na Vercel");
        }

        // 2. Tentar pegar um Alias (link curto) se disponível, senão usa a URL técnica
        const finalUrl = (result.alias && result.alias.length > 0) 
            ? result.alias[0] 
            : result.url;

        return {
            url: `https://${finalUrl}`,
            id: result.id
        };

    } catch (error: any) {
        console.error("Vercel Deploy Error:", error);
        throw error;
    }
}
