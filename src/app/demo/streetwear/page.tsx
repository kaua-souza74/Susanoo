"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  X,
  ArrowRight,
  Truck,
  ShieldCheck,
  RefreshCw,
  Instagram,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  label?: string;
  color: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "Camiseta Boxy Essential",
    category: "Camisetas",
    price: 119.9,
    oldPrice: 149.9,
    image: "https://images.unsplash.com/photo-1617988849826-38cab46882d7?auto=format&fit=crop&q=85&w=1200",
    label: "BEST SELLER",
    color: "Branco",
  },
  {
    id: 2,
    name: "Camiseta Oversized Core",
    category: "Camisetas",
    price: 129.9,
    image: "https://images.unsplash.com/photo-1602107545989-576b14346164?auto=format&fit=crop&q=85&w=1200",
    label: "NOVO",
    color: "Off White",
  },
  {
    id: 3,
    name: "Tee Heavyweight Black",
    category: "Camisetas",
    price: 139.9,
    image: "https://images.unsplash.com/photo-1581017178717-f68dcc792651?auto=format&fit=crop&q=85&w=1200",
    color: "Preto",
  },
  {
    id: 4,
    name: "Urban Layer Jacket",
    category: "Jaquetas",
    price: 259.9,
    oldPrice: 319.9,
    image: "https://images.unsplash.com/photo-1615916732335-9d320ec7f2ef?auto=format&fit=crop&q=85&w=1200",
    label: "-18%",
    color: "Amarelo",
  },
  {
    id: 5,
    name: "Essential White Tee",
    category: "Camisetas",
    price: 109.9,
    image: "https://images.unsplash.com/photo-1584778671968-01ad04b90c39?auto=format&fit=crop&q=85&w=1200",
    color: "Branco",
  },
  {
    id: 6,
    name: "Everyday Relaxed Tee",
    category: "Camisetas",
    price: 119.9,
    image: "https://images.unsplash.com/photo-1632571370770-706af0e6c17e?auto=format&fit=crop&q=85&w=1200",
    color: "Cinza",
  },
  {
    id: 7,
    name: "Street Basic White",
    category: "Camisetas",
    price: 99.9,
    image: "https://images.unsplash.com/photo-1602107545989-576b14346164?auto=format&fit=crop&q=85&w=1200",
    color: "Branco",
  },
  {
    id: 8,
    name: "Midnight Heavy Tee",
    category: "Camisetas",
    price: 149.9,
    image: "https://images.unsplash.com/photo-1581017178717-f68dcc792651?auto=format&fit=crop&q=85&w=1200",
    label: "LIMITED",
    color: "Preto",
  },
];

const categories = ["Todos", "Camisetas", "Jaquetas", "Calças", "Moletons", "Acessórios"];

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function StreetwearDemoPage() {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Destaques");
  const [cart, setCart] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    let list = products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category === category;
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });

    if (sort === "Menor preço") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "Maior preço") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, query, sort]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const addCart = (id: number) => setCart((current) => [...current, id]);

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111] selection:bg-black selection:text-white">
      <div className="bg-black px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white sm:text-xs">
        Frete grátis acima de R$ 399 • 5% off no PIX
      </div>

      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f6f4ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <button
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            onClick={() => setMobileMenu(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <a href="#inicio" className="text-xl font-black tracking-[-0.06em] sm:text-2xl">
            NVRMND<span className="text-black/30">.</span>
          </a>

          <nav className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[0.17em] lg:flex">
            <a href="#novidades" className="transition-opacity hover:opacity-45">Novidades</a>
            <a href="#produtos" className="transition-opacity hover:opacity-45">Camisetas</a>
            <a href="#produtos" className="transition-opacity hover:opacity-45">Calças</a>
            <a href="#produtos" className="transition-opacity hover:opacity-45">Moletons</a>
            <a href="#manifesto" className="transition-opacity hover:opacity-45">Sobre</a>
          </nav>

          <div className="flex items-center gap-1">
            <label className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-black/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar"
                className="w-24 bg-transparent text-xs outline-none placeholder:text-black/35"
              />
            </label>
            <button className="hidden h-10 w-10 items-center justify-center sm:flex" aria-label="Conta">
              <UserRound className="h-[18px] w-[18px]" />
            </button>
            <button className="relative flex h-10 w-10 items-center justify-center" aria-label="Sacola">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cart.length > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <div className="fixed inset-0 z-[100] bg-[#f6f4ef] p-5 lg:hidden">
          <div className="flex items-center justify-between border-b border-black/10 pb-5">
            <span className="text-xl font-black tracking-[-0.06em]">NVRMND.</span>
            <button onClick={() => setMobileMenu(false)} className="flex h-11 w-11 items-center justify-center">
              <X />
            </button>
          </div>
          <div className="mt-6">
            <label className="mb-8 flex items-center gap-3 border-b border-black/20 py-3">
              <Search className="h-5 w-5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="O que você procura?"
                className="w-full bg-transparent text-base outline-none"
              />
            </label>
            {["Novidades", "Camisetas", "Calças", "Moletons", "Acessórios", "Sobre"].map((item) => (
              <a
                key={item}
                href={item === "Sobre" ? "#manifesto" : "#produtos"}
                onClick={() => setMobileMenu(false)}
                className="block border-b border-black/10 py-4 text-2xl font-black uppercase tracking-[-0.04em]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      )}

      <main id="inicio">
        <section className="mx-auto max-w-[1500px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
          <div className="relative min-h-[580px] overflow-hidden bg-[#d8d0c4] sm:min-h-[660px] lg:min-h-[720px]">
            <img
              src="https://images.unsplash.com/photo-1632571370770-706af0e6c17e?auto=format&fit=crop&q=90&w=2200"
              alt="Modelo vestindo moda urbana"
              className="absolute inset-0 h-full w-full object-cover object-center grayscale-[15%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:p-16">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70 sm:text-xs">
                Drop 02 — Essentials
              </p>
              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] sm:text-7xl lg:text-[8rem]">
                Feito para <br /> ocupar espaço.
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
                Silhuetas amplas, tecidos encorpados e peças criadas para acompanhar a rua sem esforço.
              </p>
              <a
                href="#produtos"
                className="mt-8 inline-flex items-center gap-3 bg-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black transition-colors hover:bg-black hover:text-white"
              >
                Ver coleção <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="absolute right-5 top-5 border border-white/25 bg-black/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              New season / 26
            </div>
          </div>
        </section>

        <section id="novidades" className="mx-auto grid max-w-[1500px] gap-3 px-3 py-3 sm:px-5 lg:grid-cols-2 lg:px-8">
          <a href="#produtos" className="group relative min-h-[390px] overflow-hidden bg-[#cfc9c1]">
            <img
              src="https://images.unsplash.com/photo-1602107545989-576b14346164?auto=format&fit=crop&q=85&w=1500"
              alt="Modelo com camiseta branca"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-0 left-0 p-7 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Core collection</p>
              <h2 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">Boxy Tees</h2>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                Comprar agora <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </a>

          <a href="#produtos" className="group relative min-h-[390px] overflow-hidden bg-[#cfc9c1]">
            <img
              src="https://images.unsplash.com/photo-1615916732335-9d320ec7f2ef?auto=format&fit=crop&q=85&w=1500"
              alt="Modelo em editorial de streetwear"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute bottom-0 left-0 p-7 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Editorial</p>
              <h2 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">Street Layers</h2>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                Explorar <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </a>
        </section>

        <section id="produtos" className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">Shop all</p>
              <h2 className="text-4xl font-black uppercase tracking-[-0.055em] sm:text-5xl">Peças em destaque</h2>
              <p className="mt-3 text-sm text-black/50">{visibleProducts.length} produtos</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterOpen((current) => !current)}
                className="flex h-11 items-center gap-2 border border-black/15 px-4 text-[10px] font-bold uppercase tracking-[0.14em]"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </button>
              <label className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-11 appearance-none border border-black/15 bg-transparent pl-4 pr-10 text-[10px] font-bold uppercase tracking-[0.12em] outline-none"
                >
                  <option>Destaques</option>
                  <option>Menor preço</option>
                  <option>Maior preço</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </label>
            </div>
          </div>

          <div className={`mb-8 overflow-hidden transition-all ${filterOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-wrap gap-2 border-y border-black/10 py-5">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                    category === item ? "border-black bg-black text-white" : "border-black/15 hover:border-black"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="border-y border-black/10 py-24 text-center">
              <p className="text-2xl font-black uppercase tracking-tight">Nenhuma peça encontrada</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
                }}
                className="mt-4 text-xs font-bold uppercase tracking-widest underline"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-12">
              {visibleProducts.map((product) => {
                const favorite = favorites.includes(product.id);
                return (
                  <article key={product.id} className="group min-w-0">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e4dd]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      />
                      {product.label && (
                        <span className="absolute left-3 top-3 bg-black px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white sm:text-[9px]">
                          {product.label}
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-transform hover:scale-105"
                        aria-label="Favoritar produto"
                      >
                        <Heart className={`h-4 w-4 ${favorite ? "fill-black" : ""}`} />
                      </button>
                      <button
                        onClick={() => addCart(product.id)}
                        className="absolute inset-x-3 bottom-3 translate-y-2 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:text-[10px]"
                      >
                        Adicionar à sacola
                      </button>
                    </div>
                    <div className="pt-4">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.06em] sm:text-sm">{product.name}</h3>
                        <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-black/10 bg-black" title={product.color} />
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-black/40">{product.category}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-bold">{money(product.price)}</span>
                        {product.oldPrice && <span className="text-black/35 line-through">{money(product.oldPrice)}</span>}
                      </div>
                      <p className="mt-1 text-[10px] text-black/40">ou 4x de {money(product.price / 4)} sem juros</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="manifesto" className="bg-[#121212] text-white">
          <div className="mx-auto grid max-w-[1500px] lg:grid-cols-2">
            <div className="flex min-h-[480px] flex-col justify-center p-8 sm:p-12 lg:p-20">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">NVRMND / manifesto</p>
              <h2 className="max-w-xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-6xl">
                Roupa simples. Presença impossível de ignorar.
              </h2>
              <p className="mt-7 max-w-lg text-sm leading-7 text-white/55">
                A NVRMND nasce da mistura entre conforto, proporção e rua. Menos excesso visual, mais atenção à modelagem, ao tecido e à forma como cada peça veste.
              </p>
              <a href="#produtos" className="mt-8 inline-flex w-fit items-center gap-2 border-b border-white pb-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                Conheça a coleção <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="min-h-[480px]">
              <img
                src="https://images.unsplash.com/photo-1581017178717-f68dcc792651?auto=format&fit=crop&q=90&w=1500"
                alt="Retrato editorial em preto e branco"
                className="h-full min-h-[480px] w-full object-cover grayscale"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-white">
          <div className="mx-auto grid max-w-[1500px] divide-y divide-black/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              [Truck, "Envio rápido", "Despacho em até 2 dias úteis."],
              [RefreshCw, "Troca fácil", "Primeira troca grátis em até 7 dias."],
              [ShieldCheck, "Compra segura", "Pagamento protegido e ambiente seguro."],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof Truck;
              return (
                <div key={String(title)} className="flex items-start gap-4 px-6 py-8 sm:px-10">
                  <FeatureIcon className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em]">{String(title)}</p>
                    <p className="mt-1 text-xs text-black/45">{String(text)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="bg-[#f6f4ef] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-[1500px] gap-12 border-b border-black/10 pb-14 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <p className="text-3xl font-black tracking-[-0.065em]">NVRMND.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-black/45">
              Streetwear essencial para quem prefere modelagem, textura e atitude acima de tendência passageira.
            </p>
            <div className="mt-6 flex gap-2">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em]">Institucional</p>
            <div className="space-y-3 text-sm text-black/50">
              <a className="block hover:text-black" href="#manifesto">Sobre a marca</a>
              <a className="block hover:text-black" href="#">Contato</a>
              <a className="block hover:text-black" href="#">Trocas e devoluções</a>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em]">Atendimento</p>
            <div className="space-y-3 text-sm text-black/50">
              <p>Seg–Sex, 9h às 18h</p>
              <p>contato@nvrmnd.com.br</p>
              <p>São Paulo — SP</p>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 pt-6 text-[9px] font-bold uppercase tracking-[0.13em] text-black/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 NVRMND. Template demonstrativo.</p>
          <p>Design para portfólio • SUSANOO</p>
        </div>
      </footer>
    </div>
  );
}
