# Handoff — ajustes de layout da Landing Page (desktop + mobile)

**Status geral:** implementação **completa** — local + cloud (OCI)  
**Última atualização:** 2026-08-04 (commit `132d730`; CI/CD verdes)  
**Arquivos alvo (prováveis):** [`frontend/dashboard/src/pages/LandingPage.tsx`](../../frontend/dashboard/src/pages/LandingPage.tsx), [`frontend/dashboard/src/pages/LoginPage.tsx`](../../frontend/dashboard/src/pages/LoginPage.tsx), [`frontend/dashboard/src/pages/RegisterPage.tsx`](../../frontend/dashboard/src/pages/RegisterPage.tsx), [`frontend/dashboard/src/index.css`](../../frontend/dashboard/src/index.css)  
**URLs de validação:** local `http://192.168.15.157/allugme/`, produção `https://allugme.online/`

## Como usar

1. Uma seção por mensagem: print + ajustes.
2. **Fase desktop:** concluída (2026-08-04).
3. **Fase mobile:** em curso — mesma sequência das seções; registrar sob “Ajustes mobile” de cada bloco.
4. Registrar abaixo; **não** alterar código até o usuário fechar a coleta completa.
5. Ao fechar (“terminei” / “pode planejar”), gerar plano único de implementação (desktop + mobile).

### Legenda de status por seção

`pendente descrição` → `descrito` → `no plano` → `implementado`

---

## Resumo

| # | Seção | Âncora / classe | Status |
|---|--------|-----------------|--------|
| 1 | Hero | `#topo` / `lp-hero` | descrito (desktop OK; mobile descrito) |
| 2 | Recursos | `#recursos` | descrito (mobile; desktop sem pedido) |
| 3 | Layouts | `#layouts` | descrito (desktop + mobile) |
| 4 | WhatsApp | `#whatsapp` | descrito (desktop + mobile) |
| 5 | Planos | `#planos` | descrito (desktop + mobile) |
| 6 | Contato | `#contato` | descrito (desktop + mobile: offset) |
| 7 | Privacidade / cookies | `#privacidade` + banner | descrito |
| 8 | Começar / Cadastro | `/register` (`RegisterPage`) | descrito |
| 9 | Login | `/login` (`LoginPage`) | descrito |

### Conflitos entre seções

- **Espaço superior em `lp-viewport`:** Layouts, WhatsApp, Planos, **Contato** e **Privacidade** precisam alinhar conteúdo ao topo sob o header (mesmo deslocamento). Hero desktop permanece aprovado. Contato usa `lp-close` — corrigir offset sem estragar o visual escuro/CTAs.
- **E-mail comercial:** trocar `marco@guelfi.com.br` → **`contato@allugme.com.br`** em toda a UI (LP Contato, footer, Privacidade/Controlador, constante em `contact.ts`).
- **Cadastro (Começar):** página fora da LP; densificar card para caber o botão no viewport sem conflitar com o layout 2 colunas já existente.
- **Marca na linha do voltar:** padrão único em Login e Cadastro — `← Voltar à página inicial - Allugme` (não empilhar Allugme abaixo).
- **Revelar senha:** componente/padrão reutilizável em **todos** os `type=password` do dashboard (login, cadastro e demais se houver).
- **Copy “carteira”:** em textos voltados ao usuário (LP, CTAs), preferir **“carteira de imóveis”** — só “carteira” fica vago. Ex.: Contato `Coloque sua carteira no ar` → `Coloque sua carteira de imóveis no ar`; revisar também leads em Recursos/features na LP. Temas oficiais HTML e docs internos podem seguir depois se couber no mesmo plano.

### Decisão de copy (transversal)

| Onde (LP) | Atual | Alvo |
|-----------|--------|------|
| Contato `h2` | Coloque sua carteira no ar | Coloque sua carteira de imóveis no ar |
| E-mail (LP / footer / Privacidade) | marco@guelfi.com.br | contato@allugme.com.br |
| Recursos / features | “…plataforma da sua carteira…” / “…site da sua carteira” / “…carteira isolada” | Usar “carteira de imóveis” (ou “da sua carteira de imóveis”) onde soar natural |

---

## 1. Hero

- **Âncora / classe:** `#topo` / `lp-hero`
- **Status:** descrito (desktop OK; mobile descrito)
- **Prints:**
  - Desktop: nenhum (aprovação textual)
  - Mobile (problema: layouts cortados; botões acima do carrossel): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-88d6f71e-a9f3-4203-9ef6-dc176a6b144e.png`
- **Estado atual (regressão):**
  - Desktop: nenhuma.
  - Mobile: carrossel de layouts corta a imagem (topo/base); há espaço livre acima e abaixo no hero que pode absorver um preview maior. CTAs “Sou imobiliária” / “Sou corretor” estão entre o texto e o carrossel.
- **Ajustes desktop:**
  - Nenhum. Seção perfeita na versão desktop; não alterar.
- **Ajustes mobile:**
  - Aumentar a área/imagem do carrossel (usar espaço superior e inferior disponível) para **eliminar o corte** dos layouts; manter conteúdo **centralizado**.
  - Mover os botões **para depois do carrossel**, na parte de baixo do hero (ordem: kicker/título/lead → carrossel → CTAs + linha “Cadastro em minutos…”).
- **Arquivos prováveis:** `LandingPage.tsx` (ordem dos nós no hero mobile), `index.css` (`lp-hero`, painel/carrossel mobile, alturas do preview).

---

## 2. Recursos

- **Âncora / classe:** `#recursos`
- **Status:** descrito (foco mobile; desktop sem pedido de mudança)
- **Prints:**
  - Mobile (lista longa — nem todos os recursos cabem na viewport): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-929e0c4f-9691-478c-a2fa-90e0d9c92d88.png`
- **Estado atual (regressão):**
  - Mobile: seção em lista vertical com título + lead + 4 features (e há mais features no código que não aparecem sem scroll). Não apresenta todos os recursos na viewport — exige scroll interno/da página e quebra o enquadramento `lp-viewport`.
- **Ajustes desktop:**
  - Nenhum pedido explícito. Manter layout atual no desktop; só alinhar copy “carteira de imóveis” se esta seção for tocada.
- **Ajustes mobile:**
  - **Remodelar** a seção mobile para que os recursos fiquem **visíveis na viewport** (sem depender de scroll longo para ver o conjunto).
  - Direção concreta no plano: densificar (título/lead menores, menos padding) + layout compacto (ex. grid 2×2 / chips / accordion curto / carrossel horizontal de cards) — escolher a opção que mostre **todos** os itens do array de features sem cortar o bloco.
  - Incluir copy “carteira de imóveis” no lead/textos ao reescrever se necessário.
- **Arquivos prováveis:** `LandingPage.tsx` (markup/features), `index.css` (`#recursos`, `.lp-feature`, media queries mobile)

---

## 3. Layouts

- **Âncora / classe:** `#layouts` (`lp-viewport lp-section lp-section-alt`)
- **Status:** descrito (desktop + mobile)
- **Prints:**
  - Desktop problema: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-a754e33a-872b-4023-bdac-61374f5053b3.png`
  - Desktop alvo: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-93fbc5c3-087b-4e4f-8c11-83db678f9f03.png`
  - Mobile (rodapé cortado / bloco não cabe): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-77305516-76e1-45ea-af3d-8652a7e03359.png`
  - Mobile (carrossel + setas sobre as miniaturas): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-db5a82d3-feda-42a0-abbc-857f449e9a98.png`
- **Estado atual (regressão):**
  - Desktop: seção “deslocada para baixo” (centralização em `100svh`).
  - Mobile: **mesmo problema do desktop** — deslocada muito para baixo (poço sob o header). O **conteúdo em si se encaixa** no viewport mobile (não é caso de remodelar por overflow, diferente de Recursos).
- **Ajustes desktop:**
  - Remover o excesso de espaço no **início** da seção.
  - Título + lead devem ficar **logo abaixo do header** (gap ~40–60px como no print alvo), sem precisar scrollar para “corrigir” o enquadramento.
  - Carrossel e rodapé da seção permanecem como estão no print alvo (conteúdo em si ok; o problema é o offset vertical do bloco).
  - Hipótese técnica: `justify-content: flex-start` / menos center em `#layouts` (cuidado para não afetar Contato/Hero).
- **Ajustes mobile:**
  - Corrigir só o **deslocamento para baixo** (alinhar conteúdo sob o header), igual desktop.
  - **Não** remodelar por falta de espaço: o conteúdo já cabe na viewport mobile.
- **Arquivos prováveis:** `index.css` (`.lp-viewport`, `.lp-section-inner`, `#layouts`); possível classe extra em `LandingPage.tsx` se o override for por seção.

---

## 4. WhatsApp

- **Âncora / classe:** `#whatsapp` (`lp-viewport lp-section`)
- **Status:** descrito (desktop + mobile)
- **Prints:**
  - Desktop problema: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-a8fd27aa-b762-49e1-a874-1d6ab57fba34.png`
  - Desktop alvo: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-6aa010f8-6d2c-477b-88f4-d7f443257a03.png`
  - Mobile (deslocada; card 3 cortado pelo offset): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-4c94fd17-9222-4539-a3de-ca4865f45f3e.png`
  - Mobile (após scroll / enquadramento do bloco): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-7e0a5b7d-ab8b-4d5b-9611-b48e91ca89b1.png`
- **Estado atual (regressão):**
  - Desktop: mesmo deslocamento de Layouts (poço sob o header).
  - Mobile: **mesmo problema de deslocamento de Layouts** — conteúdo baixo demais; com o offset, o 3º card fica cortado na dobra. O bloco em si (título + 3 steps) cabe quando alinhado corretamente.
- **Ajustes desktop:**
  - Remover excesso de espaço no início da seção (igual Layouts).
  - Título + lead + os 3 cards no viewport logo abaixo do header (print alvo).
- **Ajustes mobile:**
  - Corrigir só o **deslocamento para baixo** (alinhar sob o header), igual Layouts.
  - Sem remodelagem de conteúdo além da densificação já existente, se necessária para os 3 cards ficarem visíveis após o fix de offset.
- **Arquivos prováveis:** `index.css` (`.lp-viewport`, `.lp-section-inner`, `#whatsapp` / `.lp-steps`)

---

## 5. Planos

- **Âncora / classe:** `#planos` (`lp-viewport lp-section lp-section-alt`)
- **Status:** descrito (desktop + mobile)
- **Prints:**
  - Desktop problema: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-b0e987ac-37dd-44bd-9114-065b9f8f06db.png`
  - Desktop alvo: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-9f97eb38-67e8-43da-b89f-485591bef3d7.png`
  - Mobile (offset + cards altos; rodapé/CTAs exigem scroll): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-5e355767-b26b-42a1-a069-bcd0b83c1c60.png`
  - Mobile (Imobiliária): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-b5a1534c-b4be-4d45-9084-fe07191fc65b.png`
  - Mobile (Corretor independente): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-ba623e95-ff52-4609-8e9b-417a38bbd878.png`
- **Estado atual (regressão):**
  - Desktop: deslocamento para baixo (igual Layouts/WhatsApp).
  - Mobile: deslocamento **muito distante do header** + bloco alto (toggle + 2 cards lado a lado) — precisa de scroll para ver o final do bloco / caminho de cadastro (CTAs “Assinar…” e rodapé). Formulário completo continua em `/register` (Começar).
- **Ajustes desktop:**
  - Remover excesso de espaço no início da seção.
  - Enquadrar título + lead + toggle + cards no viewport logo abaixo do header (print alvo).
  - Layout interno ok; problema é o offset vertical.
- **Ajustes mobile:**
  - Corrigir deslocamento (conteúdo sob o header).
  - Densificar / remodelar o suficiente para o bloco útil (título, perfil, cards com botões Assinar e rodapé curto) ficar **visível na viewport** sem scroll longo — usuário citou “campos do cadastro” no sentido do fluxo de assinatura/cadastro nesta seção.
  - **Textos:** mesmos da versão desktop (sem copy mobile específica além do que já valer para desktop; copy “carteira de imóveis” só se esta seção for tocada e houver menção).
- **Arquivos prováveis:** `LandingPage.tsx` (`#planos`), `index.css` (planos mobile, cards, `.lp-viewport`)

---

## 6. Contato

- **Âncora / classe:** `#contato` (`lp-viewport lp-close`)
- **Status:** descrito (desktop + mobile — **revisado**: também tem offset)
- **Prints:**
  - Desktop (deslocada + e-mail antigo): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-759eeb87-108b-45c2-a57d-bca6e39f6729.png`
  - Mobile (deslocada + e-mail antigo): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-f9b9c4b8-b808-47f2-bbd6-79618f1b0056.png`
  - Prints anteriores “aprovados” ficam obsoletos para offset (só referência visual de conteúdo).
- **Estado atual (regressão):** Retificação do usuário: Contato **também deslocou muito para baixo** (desktop e mobile), como Layouts/WhatsApp/Planos. E-mail ainda `marco@guelfi.com.br` na seção e no footer.
- **Ajustes desktop:**
  - Corrigir deslocamento (conteúdo sob o header; sem poço).
  - E-mail → **`contato@allugme.com.br`** (bloco Contato + footer).
  - Copy: `Coloque sua carteira de imóveis no ar`.
  - Links do footer “Política de Privacidade” e “Cookies” devem continuar levando a `#privacidade` (e banner de cookies, se for o caso) — validar após fix de Privacidade.
- **Ajustes mobile:**
  - Mesmo fix de deslocamento.
  - Mesmo e-mail e copy.
- **Arquivos prováveis:** `LandingPage.tsx`, `contact.ts` (`contactEmail`), `index.css` (`lp-close`, `.lp-viewport`)

---

## 7. Privacidade / cookies

- **Âncora / classe:** `#privacidade` + banner de cookies + links no footer
- **Status:** descrito
- **Prints:**
  - Desktop `#privacidade` (offset + e-mail antigo; possível “ghost” de footer no header): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-948c5473-95ff-4de4-aedd-20d791d838b1.png`
  - Mobile `#privacidade` (offset + cards; e-mail antigo): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-2ce42109-0a48-44a7-8d12-6adc8d6f5c51.png`
- **Estado atual (regressão):** Seção Privacidade/Cookies com o mesmo deslocamento vertical. Card Controlador ainda com `marco@guelfi.com.br`. No desktop, print mostra sobreposição/ghost de textos do footer atrás do nav ao ancorar — investigar z-index/overflow/stacking ao corrigir.
- **Ajustes desktop:**
  - Remover excesso de espaço no início (alinhar sob o header).
  - E-mail do controlador → **`contato@allugme.com.br`**.
  - Garantir que links footer “Política de Privacidade” / “Cookies” enquadrem bem a seção (sem ghost no header).
  - Densificar grid de cards se necessário para caber melhor na viewport após o fix de offset.
- **Ajustes mobile:**
  - Mesmo offset + e-mail.
  - Remodelar/densificar cards LGPD para caberem melhor na viewport (print corta “Seus direitos”).
- **Arquivos prováveis:** `LandingPage.tsx` (`#privacidade`, footer), `CookieConsent.tsx`, `contact.ts`, `index.css` (`lp-privacy`)

---

## 8. Começar / Cadastro (`/register`)

- **Rota / fluxo:** CTA “Começar” da LP → `/register?type=agency` (e variante corretor)
- **Status:** descrito
- **Prints:**
  - Problema (botão final cortado / fora do viewport): `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-52eef98f-4b4c-4a92-8421-3b33fd2418d7.png`
- **Estado atual (regressão):** Card de cadastro alto demais — a parte final não apresenta o botão completo na viewport. Header e textos ocupam linhas demais.
- **Ajustes desktop:**
  - **Compactar** o card para o botão de envio ficar **visível** na viewport (sem scroll para achar o CTA).
  - Linha de marca: `← Voltar à página inicial - Allugme` (Allugme logo após o link, separado por hífen `-`) — alinhado ao Login.
  - Título + lead numa linha: `Cadastre-se - Equipe, vitrine e agenda — ativação após Pix.`  
    (trocar “Cadastro de imobiliária” / “Cadastro de corretor” por **“Cadastre-se”**; lead ao lado, separado por `-`).
  - Barra de troca de perfil: remover “Quero” / “Quero ser…”; opções em extremos da barra:
    - esquerda: **Sou Imobiliária**
    - direita: **Sou Corretor**
  - Campo senha com ícone/emoji de olho para revelar/ocultar (padrão global de senha).
  - Manter layout planos (esquerda) + formulário (direita); só densificar tipografia/espaços para caber o botão.
- **Ajustes mobile:**
  - Não informado. Espelhar copy e densificar para o botão permanecer acessível sem “sumir” abaixo da dobra, quando possível.
- **Arquivos prováveis:** `RegisterPage.tsx`, `index.css` (`.login-brand-block`, `.login-back-link`, `.register-head`, `.lp-register-wrap`, barra de perfil)

---

## 9. Login (`/login`)

- **Rota / fluxo:** CTA “Entrar” da LP → `/login`
- **Status:** descrito
- **Prints:**
  - Estado atual: `/home/guelfi/.cursor/projects/home-guelfi-Projetos-Alugue-me/assets/image-837bc711-5066-4f0d-bf4a-d12c219a6d92.png`
- **Estado atual (regressão / gap UX):** “Allugme” empilhado abaixo do link voltar; campo senha sem controle de revelar.
- **Ajustes desktop:**
  - Linha única de marca: `← Voltar à página inicial - Allugme` (hífen `-` entre o link e o nome; não usar `h1` Allugme em linha separada).
  - Manter subtítulo “Acesse o painel” e restante do formulário.
  - Em **todos** os campos de senha do app (login, cadastro, e também `TeamPage` se tiver senha): ícone/emoji de **olho** para revelar/ocultar a senha digitada (toggle `password` ↔ `text`).
- **Ajustes mobile:**
  - Mesmo padrão de marca e toggle de senha.
- **Arquivos prováveis:** `LoginPage.tsx`, `RegisterPage.tsx`, `TeamPage.tsx`, possível componente pequeno reutilizável (ex. `PasswordInput`), `index.css`

---

## Checklist de fechamento da coleta

- [x] Desktop LP + auth: Hero OK; Layouts/WhatsApp/Planos/Contato/Privacidade offset; Começar/Login copy + senha; e-mail → contato@allugme.com.br
- [x] Mobile LP principal: Hero remodel; Recursos remodel; Layouts/WhatsApp/Planos/Contato/Privacidade offset (+ densificar onde couber)
- [x] Register / Login mobile: sem print dedicado — espelhar desktop (copy + densificar + toggle senha)
- [x] Usuário pediu início da implementação (2026-08-04)
