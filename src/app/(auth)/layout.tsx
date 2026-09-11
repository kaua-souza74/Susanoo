import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark grid h-svh overflow-hidden bg-[#050505] text-white lg:grid-cols-[44%_56%]">
      <section className="relative hidden h-svh overflow-hidden bg-[#050505] p-10 lg:flex lg:flex-col xl:p-14" aria-label="Apresentação Susanoo">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-48 -top-40 h-[38rem] w-[38rem] rounded-full bg-violet-600/20 blur-[130px]" />
          <div className="absolute -bottom-56 right-[-12rem] h-[42rem] w-[42rem] rounded-full bg-fuchsia-600/15 blur-[150px]" />
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(168,85,247,0.28)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom_right,black,transparent_68%)]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-violet-950/20 to-transparent" />
        </div>

        <Link href="/" aria-label="Voltar para a página inicial" className="relative z-10 w-fit rounded-xl outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-accent">
          <Logo size="md" />
        </Link>

        <div className="relative z-10 my-auto max-w-xl py-8">
          <h1 className="text-4xl font-black uppercase italic leading-[0.9] tracking-[-0.06em] text-white xl:text-6xl 2xl:text-7xl">
            Ideias ganham <span className="text-violet-400">forma.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm font-medium leading-relaxed text-white/55 xl:text-base">
            Projetos, profissionais e entregas reunidos em uma experiência feita para avançar sem ruído.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-white/60">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 ring-1 ring-white/10"><ShieldCheck className="h-4 w-4 text-violet-400" /> Acesso protegido</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 ring-1 ring-white/10"><CheckCircle2 className="h-4 w-4 text-violet-400" /> Tudo em um só lugar</span>
          </div>
        </div>
      </section>

      <section className="relative flex h-svh min-h-0 flex-col overflow-y-auto bg-[#080808] px-5 py-4 sm:px-8 lg:px-12 lg:py-7">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/50 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="lg:hidden"><Logo size="sm" /></div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-3 sm:py-5">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </section>
    </div>
  );
}
