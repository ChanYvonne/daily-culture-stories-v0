import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase"
import { mapSongAnalysisRow, type SongAnalysisPayload, type SongAnalysisRow, type SongSourceType } from "@/lib/song-analysis-types"

const LYRICS_API_BASE_URL = process.env.LYRICS_API_BASE_URL ?? "https://lyrics.lewdhutao.my.eu.org"
const DEFAULT_MODEL = "gpt-4.1-mini"

type SongMetadata = {
  sourceType: SongSourceType
  sourceId: string
  sourceUrl: string
  title: string
  artist: string
  album?: string
  artworkUrl?: string
  releaseYear?: string
  genreTags: string[]
}

type LyricsResult = {
  provider: string
  providerTrackId?: string
  title?: string
  artist?: string
  artworkUrl?: string
  lyrics: string
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function getSpotifyTrackId(url: URL) {
  if (!url.hostname.includes("spotify.com")) {
    return null
  }

  const parts = url.pathname.split("/").filter(Boolean)
  const trackIndex = parts.indexOf("track")
  return trackIndex >= 0 ? parts[trackIndex + 1] ?? null : null
}

function getYouTubeVideoId(url: URL) {
  if (url.hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null
  }

  if (url.hostname.includes("youtube.com")) {
    return url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).at(-1) ?? null
  }

  return null
}

function parseMusicLink(link: string): { sourceType: SongSourceType; sourceId: string; sourceUrl: string } | null {
  let url: URL

  try {
    url = new URL(link)
  } catch {
    return null
  }

  const spotifyTrackId = getSpotifyTrackId(url)
  if (spotifyTrackId) {
    return { sourceType: "spotify", sourceId: spotifyTrackId, sourceUrl: url.toString() }
  }

  const youtubeVideoId = getYouTubeVideoId(url)
  if (youtubeVideoId) {
    return { sourceType: "youtube", sourceId: youtubeVideoId, sourceUrl: url.toString() }
  }

  return null
}

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  })

  if (!response.ok) {
    return null
  }

  const body = (await response.json()) as { access_token?: string }
  return body.access_token ?? null
}

function getReleaseYear(releaseDate: unknown) {
  return typeof releaseDate === "string" && releaseDate.length >= 4 ? releaseDate.slice(0, 4) : undefined
}

function normalizeTag(tag: string) {
  const normalized = tag
    .replace(/^chinese\s+/i, "")
    .replace(/^taiwan\s+/i, "Taiwanese ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) {
    return null
  }

  if (/mandopop|mandarin pop/i.test(normalized)) {
    return "MANDOPOP"
  }

  if (/cantopop|cantonese pop/i.test(normalized)) {
    return "CANTOPOP"
  }

  if (/ballad/i.test(normalized)) {
    return "ROMANTIC BALLAD"
  }

  return normalized.toUpperCase()
}

async function getSpotifyArtistGenres(accessToken: string, artistIds: string[]) {
  const uniqueArtistIds = Array.from(new Set(artistIds)).slice(0, 5)

  if (uniqueArtistIds.length === 0) {
    return []
  }

  const response = await fetch(`https://api.spotify.com/v1/artists?ids=${uniqueArtistIds.join(",")}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    return []
  }

  const body = await response.json().catch(() => null)
  const rawGenres = Array.isArray(body?.artists)
    ? body.artists.flatMap((artist: { genres?: unknown }) => (Array.isArray(artist.genres) ? artist.genres : []))
    : []

  return Array.from(
    new Set(rawGenres.map((genre: unknown) => (typeof genre === "string" ? normalizeTag(genre) : null)).filter(Boolean)),
  ).slice(0, 2) as string[]
}

async function getSpotifyMetadata(sourceId: string, sourceUrl: string): Promise<SongMetadata | null> {
  const accessToken = await getSpotifyAccessToken()

  if (accessToken) {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${sourceId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (response.ok) {
      const track = await response.json()
      const artists = Array.isArray(track.artists)
        ? track.artists.map((artist: { name?: string }) => artist.name).filter(Boolean).join(", ")
        : ""
      const artistIds = Array.isArray(track.artists)
        ? track.artists.map((artist: { id?: string }) => artist.id).filter(Boolean)
        : []
      const images = Array.isArray(track.album?.images) ? track.album.images : []
      const genreTags = await getSpotifyArtistGenres(accessToken, artistIds)

      if (typeof track.name === "string" && artists) {
        return {
          sourceType: "spotify",
          sourceId,
          sourceUrl,
          title: track.name,
          artist: artists,
          album: typeof track.album?.name === "string" ? track.album.name : undefined,
          artworkUrl: typeof images[0]?.url === "string" ? images[0].url : undefined,
          releaseYear: getReleaseYear(track.album?.release_date),
          genreTags,
        }
      }
    }
  }

  const fallback = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(sourceUrl)}`).catch(() => null)

  if (!fallback?.ok) {
    return null
  }

  const body = (await fallback.json()) as { title?: string; thumbnail_url?: string }
  const [title, artist] = (body.title ?? "").split(" - ")

  if (!title) {
    return null
  }

  return {
    sourceType: "spotify",
    sourceId,
    sourceUrl,
    title: title.trim(),
    artist: artist?.trim() || "Unknown artist",
    artworkUrl: body.thumbnail_url,
    genreTags: [],
  }
}

async function fetchLyrics(path: string, params: Record<string, string>) {
  const url = new URL(path, LYRICS_API_BASE_URL)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url, { next: { revalidate: 0 } })

  if (!response.ok) {
    return null
  }

  const body = await response.json().catch(() => null)
  const data = body?.data
  const lyrics = typeof data?.lyrics === "string" ? data.lyrics.trim() : ""

  if (!lyrics) {
    return null
  }

  return {
    provider: typeof data.searchEngine === "string" ? data.searchEngine : path.includes("youtube") ? "LyricsAPI YouTube" : "LyricsAPI Musixmatch",
    providerTrackId: typeof data.trackId === "string" ? data.trackId : undefined,
    title: typeof data.trackName === "string" ? data.trackName : undefined,
    artist: typeof data.artistName === "string" ? data.artistName : undefined,
    artworkUrl: typeof data.artworkUrl === "string" ? data.artworkUrl : undefined,
    lyrics,
  } satisfies LyricsResult
}

async function resolveYouTubeMetadataAndLyrics(sourceId: string, sourceUrl: string) {
  const lyrics = await fetchLyrics("/v2/youtube/lyrics", { trackid: sourceId })

  if (!lyrics) {
    return null
  }

  const metadata: SongMetadata = {
    sourceType: "youtube",
    sourceId,
    sourceUrl,
    title: lyrics.title ?? "YouTube song",
    artist: lyrics.artist ?? "Unknown artist",
    artworkUrl: lyrics.artworkUrl,
    genreTags: [],
  }

  return { metadata, lyrics }
}

async function resolveLyricsForMetadata(metadata: SongMetadata) {
  const musixmatchLyrics = await fetchLyrics("/v2/musixmatch/lyrics", {
    title: metadata.title,
    artist: metadata.artist,
  })

  if (musixmatchLyrics) {
    return musixmatchLyrics
  }

  return fetchLyrics("/v2/youtube/lyrics", {
    title: metadata.title,
    artist: metadata.artist,
  })
}

function getAnalysisSchema() {
  return {
    type: "json_schema",
    name: "song_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["overview", "displayTags", "culturalContext", "idiomsAndPhrases", "imageryNotes", "lines"],
      properties: {
        overview: { type: "string" },
        displayTags: {
          type: "array",
          minItems: 1,
          maxItems: 2,
          items: { type: "string" },
        },
        culturalContext: { type: "string" },
        idiomsAndPhrases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["phrase", "pinyin", "meaning", "culturalNote"],
            properties: {
              phrase: { type: "string" },
              pinyin: { type: "string" },
              meaning: { type: "string" },
              culturalNote: { type: "string" },
            },
          },
        },
        imageryNotes: {
          type: "array",
          items: { type: "string" },
        },
        lines: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["original", "pinyin", "culturalMeaning", "poeticNotes", "literalTranslation", "annotations"],
            properties: {
              original: { type: "string" },
              pinyin: { type: "string" },
              culturalMeaning: { type: "string" },
              poeticNotes: { type: "string" },
              literalTranslation: { type: "string" },
              annotations: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["phrase", "pinyin", "literalTranslation", "note"],
                  properties: {
                    phrase: { type: "string" },
                    pinyin: { type: "string" },
                    literalTranslation: { type: "string" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}

function getDisplayTags(metadata: SongMetadata, analysis: SongAnalysisPayload) {
  const tags = [...(analysis.displayTags ?? []), ...metadata.genreTags]
    .map((tag) => normalizeTag(tag))
    .filter(Boolean) as string[]

  return Array.from(new Set(tags)).slice(0, 2)
}

function extractOutputText(body: unknown) {
  if (!body || typeof body !== "object") {
    return null
  }

  const outputText = (body as { output_text?: unknown }).output_text
  if (typeof outputText === "string") {
    return outputText
  }

  const output = (body as { output?: unknown }).output
  if (!Array.isArray(output)) {
    return null
  }

  for (const item of output) {
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : []

    for (const part of content) {
      const text = (part as { text?: unknown }).text
      if (typeof text === "string") {
        return text
      }
    }
  }

  return null
}

async function createAnalysis(metadata: SongMetadata, lyrics: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return createAnalysisWithSupabaseFunction(metadata, lyrics)
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are a careful Mandarin Chinese lyric interpreter for English-speaking learners.",
                "Analyze Chinese lyrics for cultural depth, poetic imagery, idioms, proverbs, and emotional meaning.",
                "Prioritize meaningful English interpretation over literal translation.",
                "Do not reproduce large lyric passages beyond the line-by-line input needed for analysis.",
                "Unless a field is directly quoting or referencing the song lyrics, write it in English.",
                "Write overview, culturalContext, culturalMeaning, poeticNotes, literalTranslation, meaning, culturalNote, imageryNotes, and annotation notes in English.",
                "Only original lyric lines and quoted phrases should remain in Chinese. Pinyin fields must contain pinyin only.",
                "For each line, literalTranslation should be a clear English translation and culturalMeaning should explain the line in the context of the whole song.",
                "Cultural context, imagery, and phrase explanations must always be in English.",
                "Return displayTags as 1-2 short uppercase English genre/style labels suitable for UI chips, such as MANDOPOP, ROMANTIC BALLAD, CANTOPOP, FOLK POP, or ROCK BALLAD.",
                "Return concise, accessible, culturally grounded notes.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Song: ${metadata.title}\nArtist: ${metadata.artist}\nKnown API Genre Tags: ${metadata.genreTags.join(", ") || "unknown"}\nRelease Year: ${
                metadata.releaseYear ?? "unknown"
              }\n\nLyrics:\n${lyrics}`,
            },
          ],
        },
      ],
      text: { format: getAnalysisSchema() },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`)
  }

  const body = await response.json()
  const outputText = extractOutputText(body)

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text")
  }

  return {
    analysis: JSON.parse(outputText) as SongAnalysisPayload,
    modelName: typeof body.model === "string" ? body.model : model,
  }
}

async function createAnalysisWithSupabaseFunction(metadata: SongMetadata, lyrics: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing OpenAI key in Vercel and missing Supabase function credentials for fallback generation.")
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-song`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      metadata: {
        title: metadata.title,
        artist: metadata.artist,
        genreTags: metadata.genreTags,
        releaseYear: metadata.releaseYear,
      },
      lyrics,
    }),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : `Supabase analyze-song failed with status ${response.status}`
    throw new Error(message)
  }

  if (!body?.analysis) {
    throw new Error("Supabase analyze-song did not return an analysis.")
  }

  return {
    analysis: body.analysis as SongAnalysisPayload,
    modelName: typeof body.modelName === "string" ? body.modelName : process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const link = typeof body?.link === "string" ? body.link.trim() : ""
  const force = Boolean(body?.force)

  if (!link) {
    return jsonError("Paste a Spotify or YouTube link to analyze.")
  }

  const parsedLink = parseMusicLink(link)

  if (!parsedLink) {
    return jsonError("Use a Spotify track link or a YouTube / YouTube Music link.")
  }

  const supabase = createSupabaseServiceClient()

  if (supabase && !force) {
    const { data: existing } = await supabase
      .from("song_analyses")
      .select("*")
      .eq("status", "published")
      .eq("source_type", parsedLink.sourceType)
      .eq("source_id", parsedLink.sourceId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ analysis: mapSongAnalysisRow(existing as SongAnalysisRow), reused: true })
    }
  }

  let metadata: SongMetadata | null = null
  let lyrics: LyricsResult | null = null

  if (parsedLink.sourceType === "youtube") {
    const resolved = await resolveYouTubeMetadataAndLyrics(parsedLink.sourceId, parsedLink.sourceUrl)
    metadata = resolved?.metadata ?? null
    lyrics = resolved?.lyrics ?? null
  } else {
    metadata = await getSpotifyMetadata(parsedLink.sourceId, parsedLink.sourceUrl)
    lyrics = metadata ? await resolveLyricsForMetadata(metadata) : null
  }

  if (!metadata) {
    return jsonError("I could not identify that song from the link.", 422)
  }

  if (!lyrics) {
    return jsonError("I found the song, but the lyrics were not available from the free lyrics API.", 422)
  }

  const enrichedMetadata = {
    ...metadata,
    title: lyrics.title ?? metadata.title,
    artist: lyrics.artist ?? metadata.artist,
    artworkUrl: metadata.artworkUrl ?? lyrics.artworkUrl,
  }
  let generated: Awaited<ReturnType<typeof createAnalysis>>

  try {
    generated = await createAnalysis(enrichedMetadata, lyrics.lyrics)
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "The AI analysis could not be created.", 500)
  }

  const genreTags = getDisplayTags(enrichedMetadata, generated.analysis)

  if (!supabase) {
    return NextResponse.json({
      analysis: {
        id: "unsaved",
        ...enrichedMetadata,
        genreTags,
        lyricsProvider: lyrics.provider,
        providerTrackId: lyrics.providerTrackId,
        modelName: generated.modelName,
        status: "published",
        analysis: generated.analysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      reused: false,
      unsaved: true,
    })
  }

  const { data, error } = await supabase
    .from("song_analyses")
    .upsert(
      {
        source_type: enrichedMetadata.sourceType,
        source_id: enrichedMetadata.sourceId,
        source_url: enrichedMetadata.sourceUrl,
        title: enrichedMetadata.title,
        artist: enrichedMetadata.artist,
        album: enrichedMetadata.album ?? null,
        artwork_url: enrichedMetadata.artworkUrl ?? null,
        release_year: enrichedMetadata.releaseYear ?? null,
        genre_tags: genreTags,
        lyrics_provider: lyrics.provider,
        provider_track_id: lyrics.providerTrackId ?? null,
        raw_lyrics: lyrics.lyrics,
        analysis: generated.analysis,
        model_name: generated.modelName,
        status: "published",
      },
      { onConflict: "source_type,source_id" },
    )
    .select("*")
    .single()

  if (error || !data) {
    const saveMessage = error?.message ?? "No saved row was returned."
    return NextResponse.json({
      analysis: {
        id: "unsaved",
        ...enrichedMetadata,
        genreTags,
        lyricsProvider: lyrics.provider,
        providerTrackId: lyrics.providerTrackId,
        modelName: generated.modelName,
        status: "published",
        analysis: generated.analysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      reused: false,
      unsaved: true,
      warning: `The analysis was created, but it could not be saved yet: ${saveMessage}`,
    })
  }

  return NextResponse.json({ analysis: mapSongAnalysisRow(data as SongAnalysisRow), reused: false })
}
