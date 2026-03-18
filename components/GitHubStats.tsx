export default function GithubStats({
    repos,
  }: {
    repos: Record<string, any>
  }) {
    const entries = Object.entries(repos).filter(([, v]) => !v.error)
  
    if (!entries.length) return (
      <p style={{ color: "var(--muted)", fontSize: 13 }}>no data</p>
    )
  
    return (
      <table className="table">
        <thead>
          <tr>
            <th>repo</th>
            <th>stars</th>
            <th>issues</th>
            <th>forks</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, v]) => (
            <tr key={name}>
              {/* show just the repo name not owner/repo */}
              <td className="mono">{name.split("/")[1]}</td>
              <td className="num">{v.stars?.toLocaleString()}</td>
              <td className="num">{v.openIssues?.toLocaleString()}</td>
              <td className="num">{v.forks?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }