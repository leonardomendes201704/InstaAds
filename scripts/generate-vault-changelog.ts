#!/usr/bin/env tsx
/**
 * Gera changelog Obsidian em vault/Historico/ a partir do git log.
 * Não altera vault/.obsidian/ nem docs em 01–05.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VAULT = path.join(ROOT, "vault");
const HISTORICO = path.join(VAULT, "Historico");
const COMMITS_DIR = path.join(HISTORICO, "Commits");
const FASES_DIR = path.join(HISTORICO, "Fases");

const GITHUB_REPO = "leonardomendes201704/InstaAds";

interface CommitFile {
  status: string;
  path: string;
}

interface Commit {
  index: number;
  hash: string;
  short: string;
  date: string;
  author: string;
  subject: string;
  body: string;
  files: CommitFile[];
  phaseId: string;
  slug: string;
  noteName: string;
}

interface PhaseDef {
  id: string;
  title: string;
  summary: string;
  commitIndices: number[];
}

const PHASES: PhaseDef[] = [
  {
    id: "01-mvp-wizard",
    title: "MVP Wizard",
    summary:
      "Wizard mobile-first de 3 passos com Next.js, Tailwind e Zustand. Integração inicial OpenAI (depois migrada para Gemini).",
    commitIndices: [1],
  },
  {
    id: "02-gemini-ia",
    title: "Gemini e pipeline de IA",
    summary:
      "Migração OpenAI → Google Gemini. Copy PT-BR em etapa separada da arte. Melhorias de prompt e UX do passo 2.",
    commitIndices: [2, 3, 4, 5, 6, 12],
  },
  {
    id: "03-armazenamento",
    title: "Armazenamento Vercel Blob",
    summary:
      "Persistência de fotos e artes no Vercel Blob, sessão anônima inicial, custo de IA e correções de store privado.",
    commitIndices: [7, 8, 9],
  },
  {
    id: "04-admin-auth",
    title: "Admin e autenticação Google",
    summary:
      "Painel /admin com senha. Login obrigatório Google via Auth.js. Logo, páginas legais e Search Console.",
    commitIndices: [10, 11, 13, 14],
  },
  {
    id: "05-supabase",
    title: "Migração Supabase",
    summary:
      "Postgres + Storage substituem Blob como fonte principal. Admin expandido (usuários, atividades). Migração Blob via painel.",
    commitIndices: [15, 16, 17],
  },
  {
    id: "06-billing",
    title: "Billing, device limits e admin UX",
    summary:
      "Planos Stripe, quotas, promoções. Limite por dispositivo no Free. Lightbox admin e Chart.js no dashboard.",
    commitIndices: [18, 19, 20, 21],
  },
  {
    id: "07-perfil-usuario",
    title: "Perfil do usuário",
    summary:
      "Página /perfil com plano, uso mensal, gerações recentes e lightbox com download.",
    commitIndices: [22, 23],
  },
  {
    id: "08-vps-deploy",
    title: "VPS e deploy automático",
    summary:
      "Stack Docker self-hosted (Postgres, MinIO, Caddy). Domínio insta-ads.online. GitHub Actions com runner na VPS.",
    commitIndices: [24, 25],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function parseGitLog(): Omit<Commit, "index" | "phaseId" | "slug" | "noteName">[] {
  const raw = execSync(
    'git log --reverse --format="===COMMIT===|%H|%h|%ai|%an|%s%n%B===END===" --name-status',
    { encoding: "utf-8", cwd: ROOT },
  );

  const blocks = raw.split("===COMMIT===|").filter(Boolean);
  const commits: Omit<Commit, "index" | "phaseId" | "slug" | "noteName">[] = [];

  for (const block of blocks) {
    const endBodyIdx = block.indexOf("===END===");
    if (endBodyIdx === -1) continue;

    const headerAndBody = block.slice(0, endBodyIdx);
    const filesSection = block.slice(endBodyIdx + "===".length + 4); // after "END==="

    const headerEnd = headerAndBody.indexOf("\n");
    const headerLine =
      headerEnd === -1 ? headerAndBody : headerAndBody.slice(0, headerEnd);
    const bodyRaw =
      headerEnd === -1 ? "" : headerAndBody.slice(headerEnd + 1);

    const parts = headerLine.split("|");
    if (parts.length < 5) continue;

    const [hash, short, date, author, subject] = parts;
    const body = bodyRaw
      .replace(/Co-authored-by: Cursor <cursoragent@cursor.com>\s*/gi, "")
      .trim();

    const files: CommitFile[] = [];
    for (const line of filesSection.split("\n")) {
      if (/^[AMDTRCU]\t/.test(line)) {
        const [status, ...rest] = line.split("\t");
        files.push({ status, path: rest.join("\t") });
      }
    }

    commits.push({ hash, short, date, author, subject, body, files });
  }

  return commits;
}

function phaseForIndex(index: number): string {
  for (const phase of PHASES) {
    if (phase.commitIndices.includes(index)) return phase.id;
  }
  return "00-outros";
}

function impactHint(subject: string, files: CommitFile[]): string {
  const s = subject.toLowerCase();
  if (s.includes("deploy") || s.includes("docker") || s.includes("vps"))
    return "Infraestrutura e deploy em produção.";
  if (s.includes("admin")) return "Painel administrativo e operação interna.";
  if (s.includes("stripe") || s.includes("billing") || s.includes("plano"))
    return "Monetização, planos e limites de uso.";
  if (s.includes("supabase") || s.includes("blob") || s.includes("migra"))
    return "Camada de dados e armazenamento.";
  if (s.includes("gemini") || s.includes("openai") || s.includes("copy") || s.includes("arte"))
    return "Pipeline de IA e qualidade das gerações.";
  if (s.includes("auth") || s.includes("login") || s.includes("google"))
    return "Autenticação e identidade do usuário.";
  if (s.includes("perfil")) return "Experiência do usuário logado.";
  if (s.includes("device")) return "Controle anti-abuso por dispositivo.";
  if (files.some((f) => f.path.startsWith("deploy/"))) return "Infraestrutura de deploy.";
  return "Evolução geral do produto e codebase.";
}

function groupFiles(files: CommitFile[]): string {
  const groups = { A: [] as string[], M: [] as string[], D: [] as string[], other: [] as string[] };
  for (const f of files) {
    const key = f.status.charAt(0);
    if (key === "A") groups.A.push(f.path);
    else if (key === "M") groups.M.push(f.path);
    else if (key === "D") groups.D.push(f.path);
    else groups.other.push(`${f.status} ${f.path}`);
  }
  const lines: string[] = [];
  if (groups.A.length) lines.push(`**Adicionados (${groups.A.length}):**`, ...groups.A.map((p) => `- \`${p}\``));
  if (groups.M.length) lines.push(`**Modificados (${groups.M.length}):**`, ...groups.M.map((p) => `- \`${p}\``));
  if (groups.D.length) lines.push(`**Removidos (${groups.D.length}):**`, ...groups.D.map((p) => `- \`${p}\``));
  if (groups.other.length) lines.push(...groups.other.map((p) => `- ${p}`));
  return lines.join("\n");
}

function renderCommitNote(c: Commit, prev?: Commit, next?: Commit): string {
  const phaseLink = c.phaseId.replace(/^\d+-/, "");
  const frontmatter = `---
type: commit
hash: ${c.hash}
short: ${c.short}
date: ${c.date.slice(0, 10)}
author: ${c.author}
phase: "${c.phaseId}"
tags: [instaads, commit]
files_changed: ${c.files.length}
---`;

  const nav: string[] = ["[[Timeline]]", `[[${c.phaseId}]]`];
  if (prev) nav.unshift(`← [[${prev.noteName}]]`);
  if (next) nav.push(`[[${next.noteName}]] →`);

  return `${frontmatter}

# ${c.subject}

| Campo | Valor |
|-------|-------|
| **Hash** | \`${c.short}\` |
| **Data** | ${c.date} |
| **Autor** | ${c.author} |
| **Fase** | [[${c.phaseId}]] |

## Resumo

${c.body || "_Sem descrição extended no commit._"}

## Impacto

${impactHint(c.subject, c.files)}

## Arquivos alterados (${c.files.length})

${groupFiles(c.files)}

## Links

- [Ver no GitHub](https://github.com/${GITHUB_REPO}/commit/${c.hash})
- Navegação: ${nav.join(" · ")}

`;
}

function renderPhaseNote(phase: PhaseDef, commits: Commit[]): string {
  const phaseCommits = commits.filter((c) => c.phaseId === phase.id);
  const list = phaseCommits
    .map((c) => `- [[${c.noteName}]] — ${c.subject} (\`${c.short}\`)`)
    .join("\n");

  return `---
type: phase
phase: "${phase.id}"
tags: [instaads, historico, fase]
updated: ${new Date().toISOString().slice(0, 10)}
---

# ${phase.title}

${phase.summary}

## Commits (${phaseCommits.length})

${list || "_Nenhum commit nesta fase._"}

## Ver também

- [[Timeline]]
- [[InstaAds#Histórico]]

`;
}

function renderTimeline(commits: Commit[]): string {
  const rows = commits
    .map(
      (c) =>
        `| ${c.index} | ${c.date.slice(0, 10)} | [[${c.noteName}]] | [[${c.phaseId}]] | ${c.subject.replace(/\|/g, "\\|")} |`,
    )
    .join("\n");

  return `---
type: timeline
tags: [instaads, historico]
updated: ${new Date().toISOString().slice(0, 10)}
commits_total: ${commits.length}
---

# Timeline de commits

Repositório: [${GITHUB_REPO}](https://github.com/${GITHUB_REPO})

| # | Data | Commit | Fase | Resumo |
|---|------|--------|------|--------|
${rows}

## Evolução por fase

\`\`\`mermaid
flowchart LR
  p1[01_MVP] --> p2[02_Gemini]
  p2 --> p3[03_Blob]
  p3 --> p4[04_Admin_Auth]
  p4 --> p5[05_Supabase]
  p5 --> p6[06_Billing]
  p6 --> p7[07_Perfil]
  p7 --> p8[08_VPS]
\`\`\`

> Regenerar: \`npm run vault:changelog\`

`;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanGeneratedDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".md")) fs.unlinkSync(path.join(dir, file));
  }
}

function main() {
  if (!fs.existsSync(VAULT)) {
    console.error("Pasta vault/ não encontrada.");
    process.exit(1);
  }

  const raw = parseGitLog();
  const commits: Commit[] = raw.map((c, i) => {
    const index = i + 1;
    const noteName = `${String(index).padStart(3, "0")}-${c.short}`;
    return {
      ...c,
      index,
      phaseId: phaseForIndex(index),
      slug: slugify(c.subject),
      noteName,
    };
  });

  // Reconcile phase indices if commit count differs from expected
  const maxIndex = commits.length;
  for (const phase of PHASES) {
    phase.commitIndices = phase.commitIndices.filter((i) => i <= maxIndex);
  }

  ensureDir(COMMITS_DIR);
  ensureDir(FASES_DIR);
  cleanGeneratedDir(COMMITS_DIR);
  cleanGeneratedDir(FASES_DIR);

  for (let i = 0; i < commits.length; i++) {
    const c = commits[i];
    const prev = i > 0 ? commits[i - 1] : undefined;
    const next = i < commits.length - 1 ? commits[i + 1] : undefined;
    const filePath = path.join(COMMITS_DIR, `${c.noteName}.md`);
    fs.writeFileSync(filePath, renderCommitNote(c, prev, next), "utf-8");
  }

  for (const phase of PHASES) {
    const filePath = path.join(FASES_DIR, `${phase.id}.md`);
    fs.writeFileSync(filePath, renderPhaseNote(phase, commits), "utf-8");
  }

  fs.writeFileSync(path.join(HISTORICO, "Timeline.md"), renderTimeline(commits), "utf-8");

  console.log(`Vault changelog gerado: ${commits.length} commits, ${PHASES.length} fases.`);
  console.log(`  ${path.relative(ROOT, COMMITS_DIR)}/`);
  console.log(`  ${path.relative(ROOT, FASES_DIR)}/`);
  console.log(`  ${path.relative(ROOT, path.join(HISTORICO, "Timeline.md"))}`);
}

main();
