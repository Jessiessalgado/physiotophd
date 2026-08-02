## Objetivo

Transformar o `/admin` atual (Posts + Categorias) num CMS completo estilo WordPress/Ghost, protegido por login, sem tocar no frontend público (`public/index.html`, `/blog`, `/blog/:slug` mantêm aparência atual — só passam a ler dados do banco quando o módulo correspondente existir).

## Estrutura de navegação

Um layout de admin com sidebar fixa (Lucide + shadcn), tema claro, responsivo:

```text
/admin                 Dashboard
/admin/posts           Postagens (+ /admin/posts/:id editor)
/admin/categories      Categorias
/admin/tags            Tags
/admin/media           Mídia
/admin/pages           Páginas
/admin/seo             SEO
/admin/layout          Layout
/admin/theme           Tema
/admin/newsletter      Newsletter
/admin/comments        Comentários
/admin/authors         Autores
/admin/settings        Configurações
/admin/backup          Backup
```

## Fases

### Fase 1 — Base de dados e navegação
- Migração: tabelas `tags`, `post_tags`, `pages`, `media`, `comments`, `authors`, `newsletter_subscribers`, `settings` (chave/valor JSON para geral, SEO, layout, tema, integrações), `post_views`. Colunas novas em `posts`: `meta_description`, `author_id`, `featured`, `reading_time`, `seo_score`, `references`, `doi`.
- RLS: leitura pública onde faz sentido (páginas publicadas, tags, comentários aprovados, settings públicos); escrita só admin. GRANTs em todas.
- Seed: 16 categorias pedidas, settings pré-preenchidos (descrição, título SEO, keywords do nicho).
- Novo shell `/admin` com sidebar + rotas vazias.

### Fase 2 — Conteúdo
- **Dashboard**: cards de métricas (artigos, publicados, rascunhos, views, categorias, tags), artigos recentes, posts mais acessados, últimos comentários, atividade e checklist SEO.
- **Postagens**: editor reescrito — título, slug automático, resumo, meta description, imagem destaque, categoria, tags com autocomplete, autor, data/agendamento, status, destaque, tempo de leitura calculado, SEO score ao vivo, editor Markdown com preview lado a lado, tabela/código/citação, upload de imagem, links, DOI e referências.
- Botão **"Novo artigo científico"** que pré-preenche o template (Resumo Executivo, Introdução, Fundamentação Científica, Aplicação Clínica, Discussão, Conclusão, Referências, FAQ).
- **Categorias** e **Tags**: CRUD completo, tags sugeridas por categoria.
- **Páginas**: CRUD com as 7 páginas base (Sobre, Contato, Privacidade, Política Editorial, Cookies, Isenção Médica, Como citar) já criadas como rascunho com texto inicial.
- **Mídia**: biblioteca do bucket `post-images` (upload, listagem em grade, copiar URL, excluir).

### Fase 3 — Configuração do site
- **Configurações** (abas Geral / SEO / Integrações): todos os campos pedidos, gravados em `settings`.
- **SEO**: robots.txt, ads.txt, sitemap, RSS, Analytics/GSC/GTM/AdSense, Open Graph, Schema.org — servidos por rotas públicas geradas a partir do banco.
- **Layout** e **Tema**: editores de tokens (cores, fontes, raios, sombras, dark mode, blocos da home, menu, rodapé, widgets) com pré-visualização; salvos em `settings` e injetados no site público via CSS variables — sem mudar o visual atual (os valores iniciais reproduzem exatamente o tema de hoje).
- **Newsletter**: lista de inscritos + configuração de integração (Mailchimp, Brevo, ConvertKit, Substack) com chaves guardadas como segredos.
- **Comentários**: fila de moderação (aprovar, spam, excluir, responder).
- **Autores**: CRUD de perfis de autor.

### Fase 4 — Backup e exportações
- Exportar posts, categorias, tags, páginas e configurações em JSON, CSV e Markdown; importar JSON de volta.
- Atualizar o XML do Blogger para incluir tags, páginas e as novas configurações.

## Notas técnicas

- TanStack Start: cada módulo tem `*.functions.ts` com server functions protegidas por `requireSupabaseAuth` + verificação de admin; rotas ficam sob `src/routes/_authenticated/admin/`.
- Rota pública `/admin/*` não existe — tudo atrás do gate existente.
- Frontend público só é tocado para ler settings/tema do banco, com fallback nos valores atuais, garantindo zero mudança visual.
- Chaves de terceiros (Mailchimp etc.) via secrets, nunca no banco.

## Entrega

Proponho executar fase a fase, entregando cada uma funcionando antes de seguir para a próxima. Começo pela Fase 1 assim que aprovar.
