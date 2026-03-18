import fs from "fs"
import path from "path"
import { getNpmDownloads } from "./npm"
import { getGithubData } from "./github"
import { getBowtieData } from "./bowtie"

// use today's date as the folder name so each week gets its own folder
// e.g. weekly-data/2026-03-18/
const today = new Date().toISOString().split("T")[0]
const outDir = path.join("weekly-data", today)


fs.mkdirSync(outDir, { recursive: true })

async function run() {
  console.log(`\ncollecting data for ${today}\n`)


  const [npm, gh, bowtie] = await Promise.allSettled([
    getNpmDownloads(),
    getGithubData(),
    getBowtieData(),
  ])


  const files = [
    { name: "npm.json",    source: "npm",    result: npm },
    { name: "github.json", source: "github", result: gh },
    { name: "bowtie.json", source: "bowtie", result: bowtie },
  ]

  console.log("\nsaving files...\n")

  for (const f of files) {
    const content = {
      date: today,
      source: f.source,
      data:  f.result.status === "fulfilled" ? f.result.value : null,
      error: f.result.status === "rejected"  ? f.result.reason?.message : null,
    }


    fs.writeFileSync(
      path.join(outDir, f.name),
      JSON.stringify(content, null, 2)
    )

    console.log(`  wrote ${f.name}`)
  }

  console.log(`\ndone → weekly-data/${today}/\n`)
}

// if anything blows up at the top level, log it and exit with code 1
// exit code 1 makes github actions mark the run as failed
// which is what we want
run().catch(err => {
  console.error("something went wrong:", err.message)
  process.exit(1)
})