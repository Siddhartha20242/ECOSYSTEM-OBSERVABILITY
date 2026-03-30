# json-schema-observatory

live → [ecosystem-observability.vercel.app](http://ecosystem-observability.vercel.app)

---

Architecture

---

Keeps an eye on the JSON Schema ecosystem over time — downloads, repo activity, compliance scores — pulled every week and stored as plain json files.

Built for the GSoC 2026 qualification task. The problem I was trying to solve: there's no single place to see how the ecosystem is actually moving.
We need to get sponsors and to get sponsors we have to showcase what we are doing how is the growthIs ajv still dominant or are newer validators catching up? Are people actually moving to Draft 2020-12 or still stuck on Draft 7? This tries to answer those with real data over time.

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

No database. No server. Just json files committed to the repo and a Next.js app that reads them. (We can use cloudflare S3 if needed in future).

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

##Automation (Using Github Actions)

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

- Bowtie data comes from a static JSON file in their repo, not a real API. if they change the format the parser breaks. I save the raw response alongside any parse errors so the data isn't lost when that happens. (Will be discussing this with mentor soon if I get selected To GSOC)
- no notifications if a weekly run fails completely. old data stays on the dashboard silently. worth fixing eventually.
- after a couple of years the weekly-data folder will get large. probably fine for now — at current size it's maybe 15KB per week.

---

##What the data tells us

see [analysis.md](./analysis.md) for a full breakdown of what the numbers actually mean for the ecosystem.

---


                                                        System Design 

                                                    Table of contents

1. What are we building
2. Functional Requirements
3. Non-Functional Requirements
4. Key Components
5. High-Level Architecture
6. Data Model
7. Storage Strategy
8. Known Tradeoffs and Things we can fix later

***What are we building***

- A weekly data pipeline that pulls metrics from NPM, Github, and Bowtie, Stores them as plain JSON files, and displays on a dashboard. No backend server, no database - just a scheduled script running on Node JS once every week and has a repo and a Next.JS Frontend.

***Functional Requirements*** 
- **Priority-0**
    - Collect NPM weekly downloads counts for major JSON schema validators.
    - Collect Github Stars(stars, forks, open issues) for key repos
    - Collect Bowtie Compliance scores per implementation
    - Store each week’s data Seperately to make sure we history builds up over time.
    - Show the data on a dashboard with charts.
- **Priority-1**
    - detect when a new validator comes and gains downloads
    - Track which json Schema drafts are getting adoption
- **Out of Scope (Not recommended )**
    - User accounts or saved preferences (We do not need database and as per Jason and other maintainers, [`this`](https://github.com/json-schema-org/community/issues/873#issuecomment-2629147336) is what i noticed)
    
***Non-Functional Requirements***
    - **Scale**
        - One run peer week - 3 API calls per source
        - Data grows by about 3 JSON files per week
        - After 2 years that’s going to be around 5MB of data - which is completely manageable in a git repo
    - **Availability**
        - Github Actions free tier is plenty
        - If a Sunday run fails, we can show the last week’s data
    - **Latency**
        - Collection run should finish in under 2 minutes
        - Dashboard load time should be kept under 1 second (cause it’s just reading local JSON)
    - **Rate limits I think are necessary**
        - npm API; no auth; have too much limit no concern
        - Github API: 60 req/hour unauthorized, 5000/hour with a token
        - Bowtie: Doesnot have an official API - no limits
    - **Reliability**
        - If one source fails, the other two still run and save their data
        - Errors will get written to the JSON file so we can know what broke
 ***Key Components***
- **`script/collect.ts`** - The main runner that collects data of all three sources
- **`scripts/npm.ts`** - hits the NPM downloads API for each package we care about. no auth needed. Loops through packages, logs each one, keep going if one fails.
- **`script/github.ts`** - We are focusing on two things - one for the total repo count for json-schema topic, plus individual stats for repos we’re tracking.
- **`script/bowtie.ts`** - fetches their public report and gives the complicance scores
- **`Github Actions workflow`** - runs the collector every week once at midnight UTC. Commits new files, pushes directly to main. Vercel detects the push and redeploys the dashbaord using CI/CD.

 **Data Model**
- Each file follows the same shape regardless of the source
    
    The following format will be used:
    
    {
       "date": "2026-03-17",
       "source": "npm",
       "data": { ... },
       "error": null
    }
    
 **Storage Strategy**
- We will be using a github repo instead of a database. Reasons:
    - Free
    - Every change is versioned automatically
    - Anyone can look at the raw data
    - no infra to maintain
    - Works perfectly for append only weekly writes
    - On top of that we are open source and we need a lot of sponsors to maintain that so We have to keep that in mind too.

 **Known Tradeoffs and things to fix later**
- No Alerting - If the Github Actions fails completely, nobody gets notified. The dashboard just shows the old data. For now it’s fine cause it’s a qualification task but eventually it will be worth to add a Slack or Email notification on workflow failure.
- Weekly data folder grows over time - It wont be a problem for years, but if the data grows to much we can use S3 type store as recommended in [this](https://github.com/json-schema-org/community/issues/980#issuecomment-3843938868).





GSoC 2026 — JSON Schema Organization
