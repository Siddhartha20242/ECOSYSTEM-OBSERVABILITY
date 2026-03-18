# json-schema-observatory

live → [ecosystem-observability.vercel.app](http://ecosystem-observability.vercel.app)

---

Architecture

---

Keeps an eye on the JSON Schema ecosystem over time — downloads, repo activity, compliance scores — pulled every week and stored as plain json files.

Built for the GSoC 2026 qualification task. The problem I was trying to solve: there's no single place to see how the ecosystem is actually moving. Is ajv still dominant or are newer validators catching up? Are people actually moving to Draft 2020-12 or still stuck on Draft 7? This tries to answer those with real data over time.

---

## what it tracks

**npm** — weekly download counts for ajv, jsonschema, tv4, z-schema, ajv-formats, and a few others. The numbers are more useful than you'd think — ajv pulled 218M downloads in a single week, which tells you it's basically infrastructure at this point, not something people consciously choose.

**GitHub** — stars, open issues, forks for the repos that matter. Also the total count of repos using the `json-schema` topic tag, which is a decent proxy for how many people are building with it.

**Bowtie** — pass rates and which drafts each implementation actually supports. This one's more telling than downloads because it shows which validators do what the spec says vs which ones are just popular.

---

## how it runs

```
npm + GitHub + Bowtie
        |
        v
  scripts/collect.ts
  (all three run at the same time,
   one failing won't stop the others)
        |
        v
  GitHub Actions — every sunday at midnight
        |
        v
  weekly-data/YYYY-MM-DD/
  (three json files per week, builds up over time)
        |
        v
  Next.js dashboard on Vercel
  (auto-redeploys when new data is pushed)
```

No database. No server. Just json files committed to the repo and a Next.js app that reads them.

---

## folder layout

```
├── scripts/
│   ├── collect.ts       # kicks off all three collectors
│   ├── npm.ts           # hits the npm downloads API
│   ├── github.ts        # github API, needs a token
│   └── bowtie.ts        # parses the bowtie report
├── weekly-data/
│   └── 2026-03-17/
│       ├── npm.json
│       ├── github.json
│       └── bowtie.json
├── app/                 # next.js pages and API routes
├── components/          # chart components
├── docs/
│   └── architecture.png
├── .github/
│   └── workflows/
│       └── collect.yml
├── analysis.md          # what the data actually tells us
├── .env.example
└── README.md
```

---

## what the data looks like

every file follows the same shape so the frontend can handle them the same way:

```json
{
  "date": "2026-03-17",
  "source": "npm",
  "data": {
    "ajv": { "downloads": 218131858, "week": "2026-03-17" },
    "jsonschema": { "downloads": 4633320, "week": "2026-03-17" },
    "tv4": { "downloads": 2272527, "week": "2026-03-17" }
  },
  "error": null
}
```

if a collector fails, `data` is null and `error` has the message. the file still gets written either way.

---

## running locally

```bash
git clone https://github.com/YOUR_USERNAME/json-schema-observatory.git
cd json-schema-observatory
npm install

# github collector needs a token or hits rate limits within a few requests
# get one at github.com/settings/tokens — only needs public_repo scope
cp .env.example .env.local
# add GITHUB_TOKEN=your_token in .env.local

# run the collectors once
npm run collect

# you should see a new folder at weekly-data/2026-03-17/
# with npm.json, github.json, bowtie.json inside

# start the dashboard
npm run dev
# open localhost:3000
```

---

##Automation

runs every Sunday at midnight UTC via GitHub Actions. creates a new folder under `weekly-data/`, commits the json files, pushes to main. Vercel detects the push and redeploys.

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'
  workflow_dispatch:      # manual trigger from the Actions tab if needed
```

if one source fails mid-run — rate limit, API down, format change — the other two still finish and get saved. the failed one writes its error into the json file.

---

##Why Weekly

the task asks for weekly, but it's also genuinely the right call. npm numbers move around day to day based on CI runs and weekday vs weekend patterns — those short-term swings don't tell you anything useful. week over week is where you actually see real changes.

GitHub's search API also has a 30 requests/minute limit on authenticated calls. running daily across multiple repos would start bumping into that.

---

##Stack

- Next.js 15 (app router)
- TypeScript
- Tailwind CSS
- Chart.js
- Vercel
- GitHub Actions

---

##Things that could break

- Bowtie data comes from a static JSON file in their repo, not a real API. if they change the format the parser breaks. I save the raw response alongside any parse errors so the data isn't lost when that happens.
- no notifications if a weekly run fails completely. old data stays on the dashboard silently. worth fixing eventually.
- after a couple of years the weekly-data folder will get large. probably fine for now — at current size it's maybe 15KB per week.

---

##What the data tells us

see [analysis.md](./analysis.md) for a full breakdown of what the numbers actually mean for the ecosystem.

---

GSoC 2026 — JSON Schema Organization