"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BookOpen, Calendar, Music2 } from "lucide-react"

export function Header() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 48)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-card/85 shadow-sm shadow-black/[0.03] backdrop-blur-xl transition-all duration-300">
      <div className={`container mx-auto px-4 transition-all duration-300 ${isCompact ? "py-2.5" : "py-4 md:py-5"}`}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <BookOpen
              className={`text-primary transition-all duration-300 group-hover:-rotate-3 ${
                isCompact ? "h-5 w-5" : "h-6 w-6"
              }`}
            />
            <div className="flex flex-col">
              <h1
                className={`font-semibold tracking-tight text-foreground transition-all duration-300 ${
                  isCompact ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                }`}
              >
                每日故事
              </h1>
              <p
                className={`hidden text-xs text-muted-foreground transition-all duration-300 sm:block ${
                  isCompact ? "h-0 -translate-y-1 overflow-hidden opacity-0" : "h-4 translate-y-0 opacity-100"
                }`}
              >
                Daily Culture Stories
              </p>
            </div>
          </Link>

          <nav className={`flex items-center transition-all duration-300 ${isCompact ? "gap-3" : "gap-4"}`}>
            <Link
              href="/song-analysis"
              className="flex h-9 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background/70 hover:text-foreground"
            >
              <Music2 className="h-4 w-4" />
              <span className="hidden sm:inline">Song Analysis</span>
            </Link>
            <Link
              href="/#calendar"
              className="flex h-9 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background/70 hover:text-foreground"
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
