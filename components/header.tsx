import Link from "next/link"
import { Calendar, BookOpen } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <BookOpen className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">每日故事</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Daily Culture Stories</p>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/#calendar"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Archive</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
