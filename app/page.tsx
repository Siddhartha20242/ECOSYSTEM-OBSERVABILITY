import fs from "fs"
import path from "path"
import NpmChart from "@/components/NpmChart"
import GithubStats from "@/components/GitHubStats"

// reads the most recent weekly-data folder
function getLatestDate() {
  const dir = path.join(process.cwd(), "weekly-data")
  if (!fs.existsSync(dir)) return null
  const folders = fs.readdirSync(dir).sort().reverse()
  return folders[0] ?? null
}

function readJson(date: string, source: string) {
  try {
    const file = path.join(process.cwd(), "weekly-data", date, `${source}.json`)
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

export default function Home() {
  const date = getLatestDate()
  if (!date) return (
    <main>
      <p className="page-sub">no data yet — run <code>npm run collect</code> first</p>
    </main>
  )

  const npm = readJson(date, "npm")
  const gh = readJson(date, "github")

  const npmData = npm?.data ?? {}
  const ghData = gh?.data ?? {}

  // build the npm table rows
  const packages = Object.entries(npmData)
    .filter(([, v]: any) => !v.error)
    .sort((a: any, b: any) => b[1].downloads - a[1].downloads)

  // total downloads across all tracked packages
  const totalDownloads = packages.reduce(
    (sum, [, v]: any) => sum + v.downloads, 0
  )

  return (
    <main>
      <h1 className="page-title">ecosystem metrics</h1>
      <p className="page-sub">
        data collected {date} — npm downloads and github activity
        for the json-schema ecosystem
      </p>

      {/* top stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">ajv weekly downloads</div>
          <div className="stat-value">
            {npmData.ajv?.downloads
              ? (npmData.ajv.downloads / 1_000_000).toFixed(0) + "M"
              : "—"}
          </div>
          <div className="stat-sub">most downloaded validator</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">tracked downloads</div>
          <div className="stat-value">
            {totalDownloads
              ? (totalDownloads / 1_000_000).toFixed(0) + "M"
              : "—"}
          </div>
          <div className="stat-sub">across all tracked packages</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">repos with json-schema topic</div>
          <div className="stat-value">
            {ghData.totalRepos?.toLocaleString() ?? "—"}
          </div>
          <div className="stat-sub">public repos on github</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">ajv stars</div>
          <div className="stat-value">
            {ghData.repos?.["ajv-validator/ajv"]?.stars?.toLocaleString() ?? "—"}
          </div>
          <div className="stat-sub">github stars</div>
        </div>
      </div>

      <div className="charts-grid">

        {/* npm downloads bar chart */}
        <div className="chart-card full">
          <div className="chart-title">npm weekly downloads</div>
          <div className="chart-sub">
            how many times each validator was downloaded last week
          </div>
          <NpmChart data={npmData} />
        </div>

        {/* npm downloads table */}
        <div className="chart-card">
          <div className="chart-title">download breakdown</div>
          <div className="chart-sub">sorted by weekly downloads</div>
          <table className="table">
            <thead>
              <tr>
                <th>package</th>
                <th>downloads</th>
                <th>share</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(([name, v]: any) => (
                <tr key={name}>
                  <td className="mono">{name}</td>
                  <td className="num">
                    {v.downloads.toLocaleString()}
                  </td>
                  <td>
                    <span className={
                      v.downloads / totalDownloads > 0.5
                        ? "badge green"
                        : v.downloads / totalDownloads > 0.1
                        ? "badge amber"
                        : "badge"
                    }>
                      {((v.downloads / totalDownloads) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* github stats table */}
        <div className="chart-card">
          <div className="chart-title">github activity</div>
          <div className="chart-sub">stars, forks, and open issues per repo</div>
          <GithubStats repos={ghData.repos ?? {}} />
        </div>

      </div>
    </main>
  )
}