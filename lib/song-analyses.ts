import { createSupabaseServerClient } from "@/lib/supabase"
import { mapSongAnalysisRow, type SongAnalysis, type SongAnalysisRow, type SongSourceType } from "@/lib/song-analysis-types"

export async function getRecentSongAnalyses(limit = 6): Promise<SongAnalysis[]> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("song_analyses")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map((row) => mapSongAnalysisRow(row as SongAnalysisRow))
}

export async function getSongAnalysisBySource(sourceType: SongSourceType, sourceId: string): Promise<SongAnalysis | null> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("song_analyses")
    .select("*")
    .eq("status", "published")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapSongAnalysisRow(data as SongAnalysisRow)
}
