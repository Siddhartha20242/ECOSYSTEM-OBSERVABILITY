const token = process.env.GITHUB_TOKEN

const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
}

if (token){
  headers["Authorization"] = `Bearer ${token}`
} else{
  console.warn("warning: no Github_TOken Set, rate limit applies to you")
}


async function get(url:string){
  const res = await fetch(url, {headers})
  if (!res.ok) throw new Error(`github returned ${res.status}`)
  return res.json()
}

const repos = [
  "ajv-validator/ajv",
  "tdegrunt/jsonschema",
  "json-schema-org/json-schema-spec",
  "ExodusMovement/schemasafe",
]

export async function getGithubData(){
  const results: Record<string, any> = {}

  try{
    const search = await get(
      "https://api.github.com/search/repositories?q=topic:json-schema&per_page=1"
    )
    results.totalRepos = search.total_count
    console.log(`  json-schema topic → ${search.total_count.toLocaleString()} repos`)
  }catch (err: any) {
    results.totalRepos = { error: err.message }
    console.log(`  topic search failed: ${err.message}`)
  }

  results.repos = {}
  for (const repo of repos) {
    try {
      const d = await get(`https://api.github.com/repos/${repo}`)

      results.repos[repo] = {
        stars: d.stargazers_count,
        forks: d.forks_count,
        openIssues: d.open_issues_count,

        lastPushed: d.pushed_at,
      }

      console.log(`  ${repo} → ${d.stargazers_count} stars`)

    } catch (err: any) {
      // one repo failing shouldn't stop us from getting the rest
      results.repos[repo] = { error: err.message }
      console.log(`  ${repo} → failed (${err.message})`)
    }
  }

  return results



}



































