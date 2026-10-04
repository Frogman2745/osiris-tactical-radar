# GitHub Update Instructions

Repository: https://github.com/Frogman2745/osiris-tactical-radar

```bash
npm test
npm run lint
npm run build
git status
git diff --check
git add README.md desktop_export src server.ts package.json metadata.json
git commit -m "docs: publish verified OSIRIS portfolio release"
git push origin main
```

Review the staged diff before committing. Do not add `.env`, credentials, downloaded archives, or generated dependencies.
