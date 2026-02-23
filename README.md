# ChordToGod

Webapp estático para montar repertório e tocar músicas por estrutura (Ton/Rel/graus), com foco em poucos cliques durante execução ao vivo.

## Acesso

- Produção (GitHub Pages): [https://oldaque.github.io/ChordToGod/](https://oldaque.github.io/ChordToGod/)

## Stack

- React + Vite + TypeScript
- shadcn/ui + Tailwind CSS
- Persistência local com `localStorage`
- PWA simples (service worker + manifest)
- Deploy via GitHub Pages (GitHub Actions)

## Funcionalidades do MVP

- Biblioteca com busca por título/artista
- Criação de repertório temporário com ordenação
- Navegação de execução com `Anterior` / `Próxima` + swipe
- Modos de exibição:
  - Híbrido (`Ton`, `Rel`, graus)
  - Graus (`1`, `2m`, `3(7)`...)
  - Cifra real por tom (tons maiores)
- Tom por música com `-1` / `+1`
- Fonte ajustável (`A-` / `A+`)
- Toggle de tema `system` / `light` / `dark`
- Badge de estado online/offline

## Estrutura de músicas

Cada música deve ficar em `src/content/songs/*.md`:

```md
---
title: Nome da música
artist: Artista
key: A
---

[CORO] "Trecho guia"
Ton - Rel - 4 - Ton
```

## Scripts

- `bun run dev`
- `bun run lint`
- `bun run test`
- `bun run build`
- `bun run preview`

## Deploy (Pages)

Workflow em `.github/workflows/deploy.yml`:

1. Instala dependências
2. Executa lint + testes
3. Build de produção
4. Publica artifact no GitHub Pages
