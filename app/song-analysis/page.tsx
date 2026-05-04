import { Header } from "@/components/header"
import { SongAnalysisPage } from "@/components/song-analysis-page"
import { getRecentSongAnalyses } from "@/lib/song-analyses"

export default async function SongAnalysisRoute() {
  const initialAnalyses = await getRecentSongAnalyses()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 flex-1">
        <SongAnalysisPage initialAnalyses={initialAnalyses} />
      </main>
    </div>
  )
}
