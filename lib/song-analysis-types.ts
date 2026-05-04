export type SongSourceType = "spotify" | "youtube"

export type PhraseAnnotation = {
  phrase: string
  pinyin?: string
  literalTranslation: string
  note: string
}

export type SongAnalysisLine = {
  original: string
  pinyin: string
  culturalMeaning: string
  poeticNotes?: string
  literalTranslation: string
  annotations: PhraseAnnotation[]
}

export type SongAnalysisPayload = {
  overview: string
  displayTags: string[]
  culturalContext: string
  idiomsAndPhrases: Array<{
    phrase: string
    pinyin?: string
    meaning: string
    culturalNote: string
  }>
  imageryNotes: string[]
  lines: SongAnalysisLine[]
}

export type SongAnalysis = {
  id: string
  sourceType: SongSourceType
  sourceId: string
  sourceUrl: string
  title: string
  artist: string
  album?: string
  artworkUrl?: string
  releaseYear?: string
  genreTags: string[]
  lyricsProvider: string
  providerTrackId?: string
  modelName?: string
  latencyMs?: number
  status: "published" | "failed"
  analysis: SongAnalysisPayload
  createdAt: string
  updatedAt: string
}

export type SongAnalysisRow = {
  id: string
  source_type: SongSourceType
  source_id: string
  source_url: string
  title: string
  artist: string
  album: string | null
  artwork_url: string | null
  release_year: string | null
  genre_tags: string[] | null
  lyrics_provider: string
  provider_track_id: string | null
  raw_lyrics: string | null
  analysis: SongAnalysisPayload
  model_name: string | null
  latency_ms: number | null
  status: "published" | "failed"
  created_at: string
  updated_at: string
}

export function mapSongAnalysisRow(row: SongAnalysisRow): SongAnalysis {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    title: row.title,
    artist: row.artist,
    album: row.album ?? undefined,
    artworkUrl: row.artwork_url ?? undefined,
    releaseYear: row.release_year ?? undefined,
    genreTags: row.genre_tags ?? row.analysis.displayTags ?? [],
    lyricsProvider: row.lyrics_provider,
    providerTrackId: row.provider_track_id ?? undefined,
    modelName: row.model_name ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    status: row.status,
    analysis: row.analysis,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
