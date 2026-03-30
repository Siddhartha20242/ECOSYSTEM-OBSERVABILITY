# Evaluation - projects/initial-data

1. ***evaluation - projects/initial-data***
- First and foremost before touching any code I read issue #518. That thread is the actual origin story where the original ask was stars, forks, contributors, dependents. Then **JDESROSIERS (JASON)** asked the question that killed the whole approach: does every eslint user count as a json schema dependent ? Nobody had a clean answer and what survived was narrower, and more honest(which should be the norm for open source): track when repos joined the ecosystem, not just how many exists today. The README admits it directly - “I couldnot find anything that would track project creation in an ecosystem over time”. That framing is worth more than anything in the implementation - I was happy to see how Seniors Swe approach open source.

1. ***What does it do well***
- The pagination trick in fetchfirstCommitDate is genuinely smart. Julian suggested the approach in the #518 thread - per _page:1, read the link header, jump straight to the last page. The mentor relequestal read that comment and implemented it perfectly. Two API call regardless of repo size. The native while-loop version costs hundreds on a large repo. Soemone understood the GithubAPI well enough to avoid traps.
- The Internet Archive check is also a real problem solver. Repos retroactively tag themselves all the time to improve discoverability. Cross-checking whether the json-schema topic existed at repo creation time is an hoenst attempt at data quality that most people wouldn’t have thought to address.

1. ***What are it’s limitations*** 

The  bug is in `processRepository`. There's a comment in the code that says `firstReleaseDate is null if no releases — allowed it because it is appropriate`. Fine intention. But the actual code catches the error from `fetchFirstReleaseDate` and immediately re-throws it, which means `processRepository` bails out entirely before it ever gets to write anything. The null path the comment describes is unreachable. Any repo without a formal release just disappears from the output — no row, no null, no log entry saying it was skipped. I watched this happen live with `glideapps/quicktype`: 10,000+ commits, actively maintained, no releases, gone. Issue #29 exists for this. Still open.

The missing `return` in `fetchFirstCommitDate` is subtler but probably affects more repos:

`if (!lastPageUrl) {
  if (response.data.length > 0) {
    response.data[0].commit.author.date;  // goes nowhere
  }
}`

Repos with few enough commits to fit on one page never get a `date_first_commit` recorded. The value is computed and thrown away. One word fixes it. Same bug exists in `fetchFirstReleaseDate`. Neither shows up in tests because the mocks only cover the multi-page case.

Beyond the bugs: the gnuplot pipeline is four manual commands across three languages. That's not automatable. You can't schedule it. Issue #18 (missing `data/` directory), #24 (CSV header mismatch), and #29 (the re-throw) are the first three things you hit when you clone this — all still open months later.

---

1. ***anything else worth noting***

The file tree has three CSV files committed — `initialTopicRepoData-1711533629611.csv`, `sorted_data.csv`, `processed_data.csv`. That timestamp decodes to March 27, 2024. Someone ran the script once two years ago and committed the output alongside the code. The `.gitignore` blocks `.env` but says nothing about CSV output files. The most recent commit on `main.js` is "Remove todos." This is a script that reached "good enough to share" and stopped there.

---

1. ***recommendation: start fresh***

The bugs are fixable. That's not the reason.

The CSV format, the manual pipeline, and the three-language toolchain aren't implementation details — they're the architecture. You can close every open issue and still have a script that produces files you process by hand with gnuplot once a year. The mentor wrote in #518: *"clean, simple, minimal, running on github actions, the approach could be duplicated to other ecosystems."* A pipeline with a Python dependency and manual gnuplot steps fails that description on every count. You can't patch your way from here to there — you'd be doing a rewrite while calling it a refactor.

---

1. ***what to keep from the approach***

The `created_at` question — *when* did repos join, not just how many exist — is worth carrying forward directly. It answers the noise problem jdesrosiers raised in #518: instead of counting who transitively depends on json-schema through eslint, you track when repos consciously tagged themselves. `created_at` from a GitHub topic search, stored as JSON weekly, builds that longitudinal picture. Three lines in a TypeScript collector. That's the gold in here.

The Internet Archive enrichment is interesting enough to revisit once the core pipeline is stable — but not as a hard dependency. An API with an undocumented 500 req/hour rate limit doesn't belong in something running unsupervised every Sunday.

The msw test pattern is worth replicating. Mocking the GitHub API is the right way to test this kind of script without burning rate limit budget on every test run.

---

**ai assistance note**

Used quilbot, grammarly, Perplexity AI for structuring and my brother who is a SWE at American Airlines in Dallas, Texas also helped me a lot to  structure this document. The run, the issue thread research, the commit history observations, and the line-level bug analysis are my own.
