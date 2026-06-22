import { Header } from "@/components/header"
import { SongAnalysisPage } from "@/components/song-analysis-page"
import { getRecentSongAnalyses } from "@/lib/song-analyses"

export default async function SongAnalysisRoute() {
  const initialAnalyses = await getRecentSongAnalyses()

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,oklch(0.985_0.006_78),oklch(0.965_0.01_78))]">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8 md:py-12">
        <SongAnalysisPage initialAnalyses={initialAnalyses} />
      </main>
    </div>
  )
}
