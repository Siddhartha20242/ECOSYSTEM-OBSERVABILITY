const packages = [
    "ajv",
    "jsonschema",
    "ajv-formats"
]

export async function getNpmDownloads(){
    const results: Record<string, any> = {}
    for (const pkg of packages){
        try{
            const res = await fetch(
                `https://api.npmjs.org/downloads/point/last-week/${pkg}`
            )
            if (!res.ok) throw new Error(`API returned ${res.status}`)
            const json = await res.json()
            
            results[pkg] = {
                downloads: json.downloads,
                week:json.end,
            }
            console.log(`  ${pkg} → ${json.downloads.toLocaleString()} downloads`)
        }
        catch(err:any){
            results[pkg] = {
                error: err.message
            }
            console.log(`  ${pkg} → failed (${err.message})`)
        }
    }
    return results
}







































