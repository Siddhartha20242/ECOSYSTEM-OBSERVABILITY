# analysis

data collected: 2026-03-17

---

## what the numbers actually tell us

### npm downloads

| package | weekly downloads |
|---|---|
| ajv | 218,131,858 |
| ajv-formats | 61,786,953 |
| jsonschema | 4,633,320 |
| tv4 | 2,272,527 |

The first thing that jumps out is the gap between ajv and everything else. 218M downloads a week is not a "popular library" number — that's a dependency of dependencies number. ajv is inside ESLint, webpack, and dozens of other tools that people install without thinking about it. The conscious choice to use ajv happened once, years ago, in those upstream projects. Most of the 218M weekly downloads are from people who have never heard of ajv.

That matters because it means ajv's download count isn't really a signal of JSON Schema adoption — it's a signal of ajv's lock-in. The more interesting question is whether competing validators are growing or shrinking, and whether any of them are getting traction in new projects rather than just riding existing dependency chains.

ajv-formats at 61M is worth noting separately. It's an ajv plugin that adds format validation — email, date, URI, etc. The fact that roughly 28% of ajv users also install ajv-formats suggests a meaningful chunk of people are using JSON Schema for real data validation, not just structural type checking.

jsonschema at 4.6M and tv4 at 2.2M are both holding steady. tv4 is worth flagging specifically — it hasn't been actively maintained in years, yet it's still pulling millions of downloads a week. That's a real concern: people are running an unmaintained validator in production, probably because it's buried deep in a dependency chain somewhere and nobody has noticed.

---

### github

| metric | value |
|---|---|
| repos with json-schema topic | 2,429 |
| ajv-validator/ajv stars | 14,643 |
| json-schema-org/json-schema-spec stars | 4,898 |
| tdegrunt/jsonschema stars | 1,870 |
| ExodusMovement/schemasafe stars | 179 |

2,429 repos publicly tagged with the json-schema topic is a decent number, but almost certainly an undercount — most projects using JSON Schema don't bother tagging themselves. It's more useful as a trend signal than an absolute count. If that number grows from 2,429 to 2,600 over the next few months, that's meaningful. If it stays flat while npm downloads keep climbing, it suggests existing projects are going deeper rather than new ones picking it up.

schemasafe at 179 stars is interesting. It's a newer, spec-compliant alternative to ajv with strong TypeScript support, but it hasn't broken through in terms of adoption. That's probably not a quality problem — it's a discoverability problem. There's no good place for someone evaluating validators to see a fair comparison of their options.

The json-schema-spec repo itself at 4,898 stars shows the spec has a real following beyond just tool users, which is a healthy sign.

---

### bowtie

Bowtie's report URL returned 404 this week. Their public report file moved since the original URL was documented and I haven't tracked down the new path yet. This is a known issue — see the note in `scripts/bowtie.ts`.

What Bowtie would tell us once it's working: which validators are actually spec-compliant vs which ones are just popular. The thing I'd want to check is whether tv4's continued usage despite being unmaintained shows up as lower compliance scores on newer drafts. If it does, that's a concrete data point for the ecosystem needing better migration tooling away from legacy validators.

---

## where the ecosystem needs more support

This is what I think the data is pointing at:

**Unmaintained validators still have significant usage.** tv4 at 2.2M downloads a week is the clearest example. No active development, millions of dependents. The ecosystem needs better visibility into which validators are still being maintained and which ones aren't — and probably some tooling to help people identify and migrate off the unmaintained ones.

**The concentration around ajv is very high.** The second most downloaded validator gets about 2% of ajv's traffic. That's not a crisis but it means the ecosystem is heavily dependent on one project's maintenance, direction, and decisions. A healthier spread would have 2-3 viable options with meaningful real-world adoption.

**Draft adoption is hard to measure right now.** We don't have Bowtie data yet, but from what's publicly documented, most validators still default to Draft 7 even though 2020-12 has been out for years. The ecosystem needs better tooling to help people understand which draft they're running and what the differences actually mean in practice.

**New validators can't get discovered.** schemasafe has 179 stars. That's not breaking through. This dashboard is part of the answer — somewhere people can see a fair, data-driven comparison of what's available and how each option performs.

---

## how to automate this weekly

GitHub Actions with a cron trigger:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'   # every sunday at midnight UTC
  workflow_dispatch:        # manual trigger if needed
```

The workflow checks out the repo, runs `npx tsx scripts/collect.ts`, commits the new files to `weekly-data/`, and pushes. Vercel picks up the push and redeploys the dashboard automatically.

The important design decision here is using `Promise.allSettled` instead of running collectors sequentially. If npm is slow or GitHub hits a rate limit, they don't block each other. Whatever comes back gets saved, even if it's partial. A run that saves two out of three sources is better than one that fails on the second and saves nothing.

Each collector also writes its error into the json file when something goes wrong, so failed runs are visible — you can look at the output and see exactly what broke and when rather than wondering why the data looks off.

---

## one challenge and how I dealt with it

Bowtie doesn't have a real API. The compliance data lives in a JSON file in their GitHub repo, and the URL I had documented returned 404 — they'd moved the file at some point since it was last referenced. (I am fixing it soon)

My approach: the bowtie collector wraps the fetch and the parse in separate try/catch blocks. If the fetch fails, we log the error and move on. If the fetch succeeds but parsing fails because the format changed, we save the raw response alongside the error. That way we never silently lose data — even if the parser is wrong, the raw JSON is committed to the repo and I can write a new parser later without losing the original.

The broader thing I took from this: for a data collection system that runs unattended, saving something is always better than saving nothing. Silent failures that produce empty files are the worst outcome because you have no idea when the data stopped being reliable. An explicit error in the output file tells you exactly when something went wrong and why.
