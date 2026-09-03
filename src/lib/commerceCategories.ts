export interface CommerceCategory {
  key: string;
  label: string;
}

export const COMMERCE_CATEGORIES: CommerceCategory[] = [
  { key: "barbearia", label: "Barbearia" },
  { key: "confeitaria", label: "Confeitaria & Doces" },
  { key: "hamburgueria", label: "Hamburgueria" },
  { key: "pizzaria", label: "Pizzaria" },
  { key: "restaurante", label: "Restaurante" },
  { key: "estetica", label: "Salão & Estética" },
  { key: "ecommerce", label: "Loja & E-commerce" },
  { key: "petshop", label: "Pet Shop & Veterinária" },
  { key: "servicos", label: "Serviços Locais" },
  { key: "cafeteria", label: "Cafeteria & Padaria" },
  { key: "academia", label: "Academia & Fitness" },
  { key: "imobiliaria", label: "Imobiliária" },
  { key: "automotivo", label: "Oficina & Auto Center" },
  { key: "saude", label: "Clínica & Odontologia" },
  { key: "acougue", label: "Açougue & Carnes" },
  { key: "sorveteria", label: "Sorveteria & Açaí" },
  { key: "floricultura", label: "Floricultura & Jardinagem" },
  { key: "lavarapido", label: "Lava Rápido & Estética Auto" },
  { key: "tatuagem", label: "Tatuagem & Piercing" },
  { key: "otica", label: "Ótica & Joalheria" },
  { key: "bebidas", label: "Adega & Depósito de Bebidas" },
  { key: "contabilidade", label: "Contabilidade & Finanças" },
  { key: "advocacia", label: "Advocacia & Jurídico" },
  { key: "fotografia", label: "Fotografia & Eventos" },
  { key: "marcenaria", label: "Marcenaria & Móveis" },
  { key: "construcao", label: "Construção & Reformas" },
  { key: "papelaria", label: "Papelaria & Gráfica" },
  { key: "lavanderia", label: "Lavanderia" },
  { key: "hotelaria", label: "Pousada & Hotel" },
  { key: "educacao", label: "Escola & Cursos" },
  { key: "hortifruti", label: "Hortifruti & Mercado" },
];

export const ALL_COMMERCE_TYPES: CommerceCategory[] = [
  { key: "all", label: "Todos os Tipos" },
  ...COMMERCE_CATEGORIES,
];

// Correspondência inteligente de tipos de comércio com os projetos do banco
export function matchProjectCommerceType(project: any, typeKey: string): boolean {
  if (!typeKey || typeKey === "all") return true;

  const cat = (project?.category || "").toLowerCase();
  const name = (project?.name || "").toLowerCase();
  const desc = (project?.description || "").toLowerCase();
  const full = `${name} ${cat} ${desc}`;

  // Se a categoria cadastrada for idêntica ou contiver o nome do nicho
  const categoryItem = COMMERCE_CATEGORIES.find(c => c.key === typeKey);
  if (categoryItem) {
    const labelLower = categoryItem.label.toLowerCase();
    if (cat === labelLower || cat === typeKey) return true;
  }

  switch (typeKey) {
    case "barbearia":
      return full.includes("barb") || full.includes("cabelo") || full.includes("corte") || full.includes("navalha") || full.includes("bigode");
    case "confeitaria":
      return full.includes("confeit") || full.includes("bolo") || full.includes("doce") || full.includes("doceria") || full.includes("torta");
    case "hamburgueria":
      return full.includes("hamburg") || full.includes("burger") || full.includes("lanche") || full.includes("artesanal");
    case "pizzaria":
      return full.includes("pizza") || full.includes("pizzaria") || full.includes("calzone");
    case "restaurante":
      return full.includes("restauran") || full.includes("comida") || full.includes("gastronom") || full.includes("bistrô") || full.includes("bistro") || full.includes("culinár");
    case "estetica":
      return full.includes("estétic") || full.includes("estetic") || full.includes("salão") || full.includes("salao") || full.includes("beleza") || full.includes("spa") || full.includes("unha") || full.includes("manicure");
    case "ecommerce":
      return full.includes("loja") || full.includes("e-commerce") || full.includes("comércio") || full.includes("comercio") || full.includes("venda") || full.includes("varejo");
    case "petshop":
      return full.includes("pet") || full.includes("veterin") || full.includes("animal") || full.includes("tosa") || full.includes("ração");
    case "servicos":
      return full.includes("serviç") || full.includes("servic") || full.includes("consult") || full.includes("assistência") || full.includes("prestador");
    case "cafeteria":
      return full.includes("cafe") || full.includes("café") || full.includes("padaria") || full.includes("panificadora") || full.includes("espresso");
    case "academia":
      return full.includes("academia") || full.includes("fit") || full.includes("treino") || full.includes("crossfit") || full.includes("musculação") || full.includes("pilates");
    case "imobiliaria":
      return full.includes("imobil") || full.includes("corret") || full.includes("imóvel") || full.includes("imovel") || full.includes("aluguel") || full.includes("residencial");
    case "automotivo":
      return full.includes("auto") || full.includes("carro") || full.includes("oficina") || full.includes("mecân") || full.includes("mecan") || full.includes("pneu") || full.includes("troca de óleo");
    case "saude":
      return full.includes("saúde") || full.includes("saude") || full.includes("clínic") || full.includes("clinic") || full.includes("dent") || full.includes("odonto") || full.includes("médic") || full.includes("psico");
    case "acougue":
      return full.includes("açougue") || full.includes("acougue") || full.includes("carne") || full.includes("churrasco") || full.includes("cortes nobres");
    case "sorveteria":
      return full.includes("sorvete") || full.includes("açaí") || full.includes("acai") || full.includes("gelato") || full.includes("paleta");
    case "floricultura":
      return full.includes("flor") || full.includes("planta") || full.includes("jardim") || full.includes("jardinagem") || full.includes("paisagismo");
    case "lavarapido":
      return full.includes("lava rápido") || full.includes("lava rapido") || full.includes("lava jato") || full.includes("lavagem") || full.includes("estética automotiva") || full.includes("polimento");
    case "tatuagem":
      return full.includes("tatuagem") || full.includes("tattoo") || full.includes("piercing") || full.includes("tatuador");
    case "otica":
      return full.includes("ótica") || full.includes("otica") || full.includes("óculos") || full.includes("oculos") || full.includes("joia") || full.includes("joalheria") || full.includes("relojoaria");
    case "bebidas":
      return full.includes("adega") || full.includes("bebida") || full.includes("cerveja") || full.includes("vinho") || full.includes("chopp") || full.includes("distribuidora de bebidas");
    case "contabilidade":
      return full.includes("contábil") || full.includes("contabil") || full.includes("contabilidade") || full.includes("contador") || full.includes("fiscal") || full.includes("tribut");
    case "advocacia":
      return full.includes("advocacia") || full.includes("advogado") || full.includes("jurídico") || full.includes("juridico") || full.includes("direito");
    case "fotografia":
      return full.includes("foto") || full.includes("fotografia") || full.includes("filmagem") || full.includes("ensaio") || full.includes("fotógrafo") || full.includes("fotografo");
    case "marcenaria":
      return full.includes("marcenaria") || full.includes("móveis") || full.includes("moveis") || full.includes("planejados") || full.includes("madeira");
    case "construcao":
      return full.includes("construção") || full.includes("construcao") || full.includes("reforma") || full.includes("obra") || full.includes("engenharia") || full.includes("pintura") || full.includes("eletricista");
    case "papelaria":
      return full.includes("papelaria") || full.includes("gráfica") || full.includes("grafica") || full.includes("impressão") || full.includes("impressao") || full.includes("copiadora");
    case "lavanderia":
      return full.includes("lavanderia") || full.includes("lavagem a seco") || full.includes("passadoria");
    case "hotelaria":
      return full.includes("pousada") || full.includes("hotel") || full.includes("hospedagem") || full.includes("chalé") || full.includes("chale") || full.includes("turismo");
    case "educacao":
      return full.includes("escola") || full.includes("curso") || full.includes("idiomas") || full.includes("aula") || full.includes("ensino") || full.includes("treinamento");
    case "hortifruti":
      return full.includes("hortifruti") || full.includes("sacolão") || full.includes("sacolao") || full.includes("verdura") || full.includes("fruta") || full.includes("mercearia");
    default:
      return full.includes(typeKey.toLowerCase());
  }
}
