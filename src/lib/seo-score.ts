import { htmlToPlainText } from "./markdown";

export type SeoCheck = { label: string; ok: boolean; hint?: string };

export function seoChecks(input: {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  cover: string;
  tags: string[];
  category: string;
}): SeoCheck[] {
  const text = htmlToPlainText(input.content);
  const words = text.split(/\s+/).filter(Boolean).length;
  return [
    { label: "Título entre 30 e 60 caracteres", ok: input.title.length >= 30 && input.title.length <= 60 },
    { label: "Slug curto e legível (≤ 60)", ok: !!input.slug && input.slug.length <= 60 },
    {
      label: "Meta description entre 80 e 160 caracteres",
      ok: input.metaDescription.length >= 80 && input.metaDescription.length <= 160,
    },
    { label: "Resumo preenchido", ok: input.excerpt.trim().length > 20 },
    { label: "Imagem destaque definida", ok: !!input.cover },
    { label: "Categoria selecionada", ok: !!input.category },
    { label: "Pelo menos 2 tags", ok: input.tags.length >= 2 },
    { label: "Conteúdo com 600+ palavras", ok: words >= 600 },
    { label: "Usa subtítulos (H2/H3)", ok: /<h[23][\s>]/i.test(input.content) },
    { label: "Contém ao menos um link", ok: /<a\s+[^>]*href/i.test(input.content) },
  ];
}

export function seoScore(checks: SeoCheck[]) {
  const ok = checks.filter((c) => c.ok).length;
  return Math.round((ok / checks.length) * 100);
}

export const SCIENTIFIC_TEMPLATE = `<h2>Resumo Executivo</h2>
<p>Sintetize em 3–5 linhas o dispositivo/tecnologia, a população-alvo e o principal achado clínico.</p>

<h2>Introdução</h2>
<p>Contextualize o problema clínico e apresente a tecnologia analisada.</p>

<h2>Fundamentação Científica</h2>
<p>Descreva os mecanismos fisiológicos e as evidências disponíveis (ensaios clínicos, revisões sistemáticas, meta-análises).</p>

<h2>Aplicação Clínica</h2>
<p>Protocolo prático: indicações, contraindicações, dosagem, parâmetros, integração ao plano terapêutico.</p>

<h2>Discussão</h2>
<p>Limitações metodológicas, custo-efetividade, viabilidade e comparação com abordagens convencionais.</p>

<h2>Conclusão</h2>
<p>Mensagem prática para o clínico e recomendações de uso baseadas em evidência.</p>

<h2>Referências</h2>
<ol><li>Autor A, Autor B. Título do estudo. Revista. Ano;Vol(Num):páginas. DOI.</li></ol>

<h2>FAQ</h2>
<p><strong>Pergunta frequente 1?</strong><br/>Resposta objetiva.</p>
<p><strong>Pergunta frequente 2?</strong><br/>Resposta objetiva.</p>`;

export const TAG_SUGGESTIONS: Record<string, string[]> = {
  neurorreabilitacao: ["avc", "neuroplasticidade", "marcha", "equilibrio", "lesao-medular"],
  "realidade-virtual": ["gamificacao", "equilibrio", "neuroplasticidade", "telerreabilitacao"],
  robotica: ["exoesqueleto", "marcha", "lesao-medular", "reabilitacao-funcional"],
  "ia-na-saude": ["machine-learning", "analise-de-movimento", "evidencia-cientifica"],
  wearables: ["sensores-inerciais", "analise-de-movimento", "telerreabilitacao"],
  biomecanica: ["analise-de-movimento", "marcha", "sensores-inerciais"],
  "tecnologias-assistivas": ["exoesqueleto", "reabilitacao-funcional", "paralisia-cerebral"],
  "pesquisa-cientifica": ["ensaio-clinico", "evidencia-cientifica"],
  "meta-analises": ["evidencia-cientifica", "ensaio-clinico"],
  "revisoes-sistematicas": ["evidencia-cientifica", "ensaio-clinico"],
  "controle-motor": ["neuroplasticidade", "equilibrio", "analise-de-movimento"],
  "aprendizagem-motora": ["neuroplasticidade", "gamificacao", "biofeedback"],
  "reabilitacao-pediatrica": ["paralisia-cerebral", "gamificacao"],
  cardiorrespiratoria: ["telerreabilitacao", "reabilitacao-funcional"],
  ortopedia: ["eletroterapia", "reabilitacao-funcional", "marcha"],
  dor: ["dor-cronica", "eletroterapia", "biofeedback"],
};
