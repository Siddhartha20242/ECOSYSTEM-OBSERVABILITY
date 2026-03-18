

const REPORT_URL =
  "https://raw.githubusercontent.com/bowtie-json-schema/bowtie-results/main/data/draft2020-12.json"

export async function getBowtieData() {
  let raw: any

  try {
    const res = await fetch(REPORT_URL)
    if (!res.ok) throw new Error(`got ${res.status}`)
    raw = await res.json()
  } catch (err: any) {
    console.log(`  bowtie fetch failed: ${err.message}`)
    return { error: err.message }
  }

  const results: Record<string, any> = {}

  for (const [name, impl] of Object.entries(raw.implementations ?? {})) {
    const i = impl as any

    // calculate pass rate as a simple percentage
    // so it's easy to compare across implementations at a glance
    const total = (i.passed ?? 0) + (i.failed ?? 0)
    const passRate = total > 0 ? Math.round((i.passed / total) * 100) : 0

    results[name] = {
      passRate,                  
      passed: i.passed ?? 0,
      failed: i.failed ?? 0,
      drafts: i.dialects ?? [],   
      language: i.language ?? "unknown",
    }

    console.log(`  ${name} → ${passRate}% passing`)
  }

  return results
}