import Link from "next/link"

const links = [
  { href: "/",       label: "downloads" },
  { href: "/repos",  label: "repos" },
  { href: "/bowtie", label: "bowtie" },
]

export default function Nav() {
  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          json-schema observatory
        </Link>
        <div className="nav-links">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}