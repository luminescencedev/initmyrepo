# TODO — initmyrepo

## 🐛 Priorité 1 — Bugs bloquants

- [ ] **tRPC + Fastify** : clone le repo entier de tRPC au lieu d'un vrai starter → à remplacer
- [ ] **pnpm workspace** : réécrire `pnpmWorkspaceSteps` en TypeScript pur avec `fs/promises` (actuellement `node --eval` avec `require()` CJS dans un projet ESM)
- [ ] **Elysia** : ignore le package manager choisi → toujours `bun create elysia` + aucun warning si bun absent
- [ ] **React Native CLI** : flag `--template react-native-template-typescript` déprécié depuis RN 0.71+

---

## ⚡ Priorité 2 — UX rapide

- [ ] Vérifier que le dossier cible n'existe pas déjà avant de scaffolder (message clair)
- [ ] Valider la valeur de `--category` dans `initmyrepo list` (erreur propre si inconnue)
- [ ] Flag `--no-install` fonctionnel (désactive les étapes d'installation dans les templates)
- [ ] Flag `--no-git` en CLI (aujourd'hui uniquement dans le wizard)
- [ ] `initmyrepo search <query>` → filtrer les templates par mot-clé
- [ ] `--dry-run` → afficher le résumé + commandes sans rien exécuter

---

## 🧪 Priorité 3 — Qualité projet

- [ ] **Tests Vitest** : unit tests sur `pm.ts` (dlx, create, installStep, detectPM) + validations wizard
- [ ] **CHANGELOG.md** avec les entrées depuis le début
- [ ] **`.nvmrc`** contenant `22`
- [ ] **Semantic release** : changesets ou semantic-release + GitHub Action publish npm sur tag

---

## 🚀 Priorité 4 — Features medium terme

- [ ] `initmyrepo doctor` → vérifier prérequis (git, node version, PMs dispo, bun si Elysia)
- [ ] Mémoriser les préférences utilisateur (dernier PM, git on/off, vscode on/off) via `conf`
- [ ] `initmyrepo update` → relancer `npm install -g initmyrepo@latest`
- [ ] Meilleure gestion des erreurs : détecter "command not found" et proposer comment installer
- [ ] `--json` sur `initmyrepo list` → output machine-readable

---

## 🏗️ Priorité 5 — Grandes features

- [ ] **Registre distant** : fichier JSON versionné sur GitHub fetchable pour mettre à jour les templates sans republier
- [ ] **Plugins / registres custom** : `.initmyreporc.json` pour déclarer des registres supplémentaires
- [ ] **`initmyrepo add <app>`** : ajouter une app dans un monorepo existant (détecte turbo/nx/pnpm)
- [ ] **Post-scaffold hooks** : champ `postSteps` dans les templates (Prettier, ESLint, Husky…)
- [ ] **Templates CI/CD** : option pour générer un `.github/workflows/ci.yml` adapté au template scaffoldé

---

## 📦 Priorité 6 — Distribution & visibilité

- [ ] Publier sur npm (`npm publish`)
- [ ] Tester `npx initmyrepo@latest` post-publish
- [ ] README avec GIF/screencast (outil : [VHS](https://github.com/charmbracelet/vhs))
- [ ] Formula Homebrew
