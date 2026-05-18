This folder holds portable data files intended for cross-repo use.

Current status
- The website still uses biomeinfos.js directly.
- data/biome.json is the portable export for the biomeapp repo and later website migration.
- data/biome-version.json is the fast update-check file for the biomeapp repo.

How data files are refreshed
- Locally: run `node scripts/export-biome-data.mjs`
- On GitHub: the workflow auto-generates them after pushes that change the source data
