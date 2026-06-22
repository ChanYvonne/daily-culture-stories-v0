const DEFAULT_MODEL = "gpt-4.1-mini"
const ANALYSIS_VERSION = "song-analysis-v4-song-background"
const SONG_BACKGROUND_PROMPT =
  "For each song, search the web and write one concise paragraph summarizing the Chinese drama, movie, TV show, or variety show it is most strongly associated with. Include the media title, how the song was used, key production credits, any memorable behind-the-scenes story, and only the most important popularity facts or statistics. Do not include lyric meaning analysis unless it directly explains the song’s media use or popularity. Prioritize official OST pages, label/artist sources, reputable entertainment outlets, interviews, award pages, and music databases. If no reliable media association exists, say so clearly and give the strongest known association instead. Keep each paragraph to 4 to 6 sentences. Do not cite sources sentence-by-sentence, and do not include raw URLs, bare domains like en.wikipedia.org, parenthetical domain citations like (music.apple.com), Markdown links, bracketed citations, or a source list inside the paragraph; put 2 to 4 verification links only in sourceUrls."
const OPENAI_TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504])
const OPENAI_MAX_ATTEMPTS = 3

class TemporaryOpenAIError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "TemporaryOpenAIError"
  }
}

type SongMetadata = {
  sourceType?: string
  sourceUrl?: string
  title: string
  artist: string
  album?: string
  genreTags?: string[]
  releaseYear?: string
  soundtrackContext?: SongSoundtrackContext
  songBackground?: SongBackground
}

type SongSoundtrackContext = {
  album?: string | null
  releaseYear?: string | null
  isSoundtrack?: boolean | null
  dramaTitle?: string | null
  dramaOriginalTitle?: string | null
  dramaDescription?: string | null
  relevanceInDrama?: string | null
  evidenceSummary?: string
  sourceUrls?: string[]
  searchQueriesTried?: string[]
}

type SongBackground = {
  summary: string
  sourceUrls: string[]
  prompt: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function isRetryableOpenAIStatus(status: number) {
  return OPENAI_TRANSIENT_STATUSES.has(status)
}

function getOpenAIErrorMessage(status: number) {
  if (isRetryableOpenAIStatus(status)) {
    return "OpenAI is temporarily unavailable. Please try again in a minute."
  }

  return `OpenAI request failed with status ${status}.`
}

function sanitizeOpenAIErrorBody(body: string) {
  const withoutTags = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
  return withoutTags.replace(/\s+/g, " ").trim().slice(0, 500)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getAnalysisSchema() {
  return {
    type: "json_schema",
    name: "song_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "analysisVersion",
        "overview",
        "displayTags",
        "culturalContext",
        "idiomsAndPhrases",
        "imageryNotes",
        "soundtrackContext",
        "songBackground",
        "lines",
      ],
      properties: {
        analysisVersion: { type: "string" },
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
        soundtrackContext: getSoundtrackContextProperties(),
        songBackground: getSongBackgroundProperties(),
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

function getSongBackgroundProperties() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "sourceUrls", "prompt"],
    properties: {
      summary: { type: "string" },
      sourceUrls: {
        type: "array",
        maxItems: 4,
        items: { type: "string" },
      },
      prompt: { type: "string" },
    },
  }
}

function getSongBackgroundSchema() {
  return {
    type: "json_schema",
    name: "song_background",
    strict: true,
    schema: getSongBackgroundProperties(),
  }
}

function getSoundtrackContextProperties() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "album",
      "releaseYear",
      "isSoundtrack",
      "dramaTitle",
      "dramaOriginalTitle",
      "dramaDescription",
      "relevanceInDrama",
      "evidenceSummary",
      "sourceUrls",
      "searchQueriesTried",
    ],
    properties: {
      album: { type: ["string", "null"] },
      releaseYear: { type: ["string", "null"] },
      isSoundtrack: { type: ["boolean", "null"] },
      dramaTitle: { type: ["string", "null"] },
      dramaOriginalTitle: { type: ["string", "null"] },
      dramaDescription: { type: ["string", "null"] },
      relevanceInDrama: { type: ["string", "null"] },
      evidenceSummary: { type: "string" },
      sourceUrls: {
        type: "array",
        maxItems: 3,
        items: { type: "string" },
      },
      searchQueriesTried: {
        type: "array",
        items: { type: "string" },
      },
    },
  }
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

function getLyricLineCount(lyrics: string | null | undefined) {
  if (!lyrics) {
    return 0
  }

  return lyrics.split("\n").filter((line) => line.trim()).length
}

function buildSoundtrackSearchQueries(metadata: SongMetadata) {
  const queries = [
    `"${metadata.title}" "${metadata.artist}"`,
    metadata.album ? `"${metadata.title}" "${metadata.album}"` : "",
    `"${metadata.title}" 原聲帶`,
    `"${metadata.title}" 主題曲`,
    `"${metadata.title}" 插曲`,
    `"${metadata.title}" 片尾曲`,
    `"${metadata.title}" 電影`,
    `"${metadata.title}" 電視劇`,
    `"${metadata.title}" 劇集`,
    `"${metadata.title}" 影集`,
    `"${metadata.title}" "${metadata.artist}" soundtrack`,
    `"${metadata.title}" "${metadata.artist}" drama OST`,
    `"${metadata.title}" "${metadata.artist}" movie theme song`,
    `"${metadata.title}" "${metadata.artist}" official video`,
  ]

  return Array.from(new Set(queries.filter(Boolean)))
}

function getFallbackSoundtrackContext(metadata: SongMetadata, evidenceSummary = "No separate soundtrack lookup was available."): SongSoundtrackContext {
  return {
    album: metadata.album ?? null,
    releaseYear: metadata.releaseYear ?? null,
    isSoundtrack: null,
    dramaTitle: null,
    dramaOriginalTitle: null,
    dramaDescription: null,
    relevanceInDrama: null,
    evidenceSummary,
    sourceUrls: [],
    searchQueriesTried: buildSoundtrackSearchQueries(metadata),
  }
}

function normalizeSoundtrackContext(metadata: SongMetadata, context: SongSoundtrackContext): SongSoundtrackContext {
  const sourceUrls = Array.isArray(context.sourceUrls) ? context.sourceUrls.filter(Boolean).slice(0, 3) : []
  const hasSourcesForSoundtrack = sourceUrls.length > 0
  const requestedIsSoundtrack = typeof context.isSoundtrack === "boolean" ? context.isSoundtrack : null
  const isSoundtrack = requestedIsSoundtrack === true && !hasSourcesForSoundtrack ? false : requestedIsSoundtrack
  const evidenceSummary =
    requestedIsSoundtrack === true && !hasSourcesForSoundtrack
      ? `${context.evidenceSummary?.trim() || "A soundtrack connection was suggested, but no reliable source URL was provided."} Treating this as not confirmed.`
      : context.evidenceSummary?.trim() || "No verified film/drama connection found yet."

  return {
    album: context.album ?? metadata.album ?? null,
    releaseYear: context.releaseYear ?? metadata.releaseYear ?? null,
    isSoundtrack,
    dramaTitle: isSoundtrack ? context.dramaTitle ?? null : null,
    dramaOriginalTitle: isSoundtrack ? context.dramaOriginalTitle ?? null : null,
    dramaDescription: isSoundtrack ? context.dramaDescription ?? null : null,
    relevanceInDrama: isSoundtrack ? context.relevanceInDrama ?? null : null,
    evidenceSummary,
    sourceUrls,
    searchQueriesTried: context.searchQueriesTried?.length ? context.searchQueriesTried : buildSoundtrackSearchQueries(metadata),
  }
}

function getFallbackSongBackground(summary = "Regenerate this analysis to fetch Song Background."): SongBackground {
  return {
    summary,
    sourceUrls: [],
    prompt: SONG_BACKGROUND_PROMPT,
  }
}

function removeInlineSourceUrls(summary: string) {
  return summary
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)\s]+[^)]*\)/g, "$1")
    .replace(/\s*\((?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^)\s]*)?)\)/gi, "")
    .replace(/\s*\[[^\]]*(?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,})[^\]]*\]/gi, "")
    .replace(/\b(?:(?:https?:\/\/|www\.)\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?)\b/gi, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function normalizeSongBackground(background: SongBackground | null | undefined) {
  return {
    summary: removeInlineSourceUrls(background?.summary?.trim() || "No reliable media association was found yet."),
    sourceUrls: Array.isArray(background?.sourceUrls) ? background.sourceUrls.filter(Boolean).slice(0, 4) : [],
    prompt: background?.prompt || SONG_BACKGROUND_PROMPT,
  }
}

function hasUsefulSuppliedSongBackground(background: SongBackground) {
  return Boolean(background.summary?.trim() && background.sourceUrls?.length)
}

async function researchSongBackground(metadata: SongMetadata, apiKey: string): Promise<SongBackground> {
  if (metadata.songBackground && hasUsefulSuppliedSongBackground(metadata.songBackground)) {
    return normalizeSongBackground(metadata.songBackground)
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL
  const requestBody = JSON.stringify({
    model,
    tools: [{ type: "web_search", search_context_size: "low" }],
    tool_choice: "required",
    include: ["web_search_call.action.sources"],
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              SONG_BACKGROUND_PROMPT,
              "Return only the requested structured JSON. The summary must be one paragraph of 4 to 6 sentences.",
              "The sourceUrls array must contain 2 to 4 verification links whenever reliable sources are available.",
              "Never put URLs, domains, source names in parentheses, footnotes, or sentence-by-sentence citations in summary. Use sourceUrls for links and mention source names in prose only when the source itself is part of the story.",
              "Use English prose except for official Chinese media, song, album, and person names.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Song title: ${metadata.title}`,
              `Artist: ${metadata.artist}`,
              `Album: ${metadata.album ?? "unknown"}`,
              `Release year: ${metadata.releaseYear ?? "unknown"}`,
              `Source URL: ${metadata.sourceUrl ?? "unknown"}`,
            ].join("\n"),
          },
        ],
      },
    ],
    text: { format: getSongBackgroundSchema() },
  })
  let body: unknown = null

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: requestBody,
    })

    if (response.ok) {
      body = await response.json()
      break
    }

    const errorBody = await response.text().catch(() => "")
    console.error("OpenAI song background lookup failed", {
      attempt,
      status: response.status,
      body: sanitizeOpenAIErrorBody(errorBody),
    })

    if (!isRetryableOpenAIStatus(response.status) || attempt === OPENAI_MAX_ATTEMPTS) {
      return getFallbackSongBackground(getOpenAIErrorMessage(response.status))
    }

    await wait(500 * attempt)
  }

  const outputText = body ? extractOutputText(body) : null

  if (!outputText) {
    return getFallbackSongBackground("The Song Background lookup did not return structured context.")
  }

  try {
    return normalizeSongBackground(JSON.parse(outputText) as SongBackground)
  } catch {
    return getFallbackSongBackground("The Song Background lookup returned unreadable context.")
  }
}

async function createAnalysis(metadata: SongMetadata, lyrics: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY")

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY secret")
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL
  const songBackground = await researchSongBackground(metadata, apiKey)
  const soundtrackContext = getFallbackSoundtrackContext(
    metadata,
    "Song Background is now the source for media, OST, and release context.",
  )
  const requestBody = JSON.stringify({
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
              "Analyze Chinese songs for cultural depth, poetic imagery, idioms, proverbs, emotional meaning, and release context.",
              "Prioritize meaningful English interpretation over literal translation.",
              "Unless a field is directly quoting or referencing the song lyrics, write it in English.",
              "Write overview, culturalContext, culturalMeaning, poeticNotes, literalTranslation, meaning, culturalNote, imageryNotes, and annotation notes in English.",
              "Only original lyric lines and quoted phrases should remain in Chinese.",
              `Return analysisVersion exactly as ${ANALYSIS_VERSION}.`,
              "Return exactly one line object for every supplied lyric line, in order. If a lyric repeats, include it again each time it appears. Do not dedupe, summarize, collapse choruses, or invent missing lines.",
              "For each line, original should keep the source lyric line unchanged except for trimming whitespace or timestamp markers.",
              "Every pinyin field must contain pinyin with tone marks, such as nǐ hǎo, not unmarked pinyin like ni hao and not tone numbers like ni3 hao3.",
              "Before returning, check every line pinyin and annotation pinyin value; if any Mandarin syllable lacks tone marks, add the correct tone marks.",
              "For each line, literalTranslation should read like polished English song lyrics: poetic, natural, emotionally faithful, and line-length conscious for side-by-side display.",
              "Do not make literalTranslation sound like a dictionary gloss; preserve the original line's feeling, image, and rhythm while keeping the meaning accurate.",
              "Use culturalMeaning for explanation and interpretation, not literalTranslation.",
              "Keep explanatory notes out of the lyric translation column; phrase-specific explanations belong only in annotations for the Chinese phrase they refer to.",
              "Write culturalContext as a concise lyric meaning overview. Do not repeat the Song Background paragraph there.",
              "Use the supplied soundtrackContext exactly for soundtrack, Chinese drama, film, OST, album, and release claims.",
              "Return soundtrackContext in the final analysis payload, preserving the supplied values unless the lyric evidence clearly requires a cautious wording adjustment to relevanceInDrama or evidenceSummary.",
              "Return songBackground exactly as supplied. Do not rewrite it inside lyric meaning fields.",
              "Do not invent unsupported release history, drama titles, chart facts, or biographical claims.",
              "In imageryNotes, if you mention any Chinese word, phrase, or lyric fragment, include pinyin with tone marks immediately after it in parentheses.",
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
            text: `Song: ${metadata.title}\nArtist: ${metadata.artist}\nAlbum: ${
              metadata.album ?? "unknown"
            }\nSource Platform: ${metadata.sourceType ?? "unknown"}\nSource URL: ${
              metadata.sourceUrl ?? "unknown"
            }\nKnown API Genre Tags: ${
              metadata.genreTags?.join(", ") || "unknown"
            }\nRelease Year: ${
              metadata.releaseYear ?? "unknown"
            }\nExpected Lyric Line Count: ${getLyricLineCount(lyrics)}\n\nSong Background:\n${JSON.stringify(songBackground)}\n\nSeparate Soundtrack Lookup:\n${JSON.stringify(soundtrackContext)}\n\nLyrics:\n${lyrics}`,
          },
        ],
      },
    ],
    text: { format: getAnalysisSchema() },
  })
  let body: unknown = null

  for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: requestBody,
    })

    if (response.ok) {
      body = await response.json()
      break
    }

    const errorBody = await response.text().catch(() => "")
    const sanitizedBody = sanitizeOpenAIErrorBody(errorBody)
    console.error("OpenAI analysis request failed", {
      attempt,
      status: response.status,
      body: sanitizedBody,
    })

    if (!isRetryableOpenAIStatus(response.status) || attempt === OPENAI_MAX_ATTEMPTS) {
      const message = getOpenAIErrorMessage(response.status)
      if (isRetryableOpenAIStatus(response.status)) {
        throw new TemporaryOpenAIError(message, response.status)
      }

      throw new Error(message)
    }

    await wait(750 * attempt)
  }

  if (!body) {
    throw new TemporaryOpenAIError("OpenAI is temporarily unavailable. Please try again in a minute.", 502)
  }

  const outputText = extractOutputText(body)

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text")
  }

  const analysis = JSON.parse(outputText)

  return {
    analysis: {
      ...analysis,
      analysisVersion: ANALYSIS_VERSION,
      soundtrackContext: normalizeSoundtrackContext(metadata, analysis.soundtrackContext ?? soundtrackContext),
      songBackground: normalizeSongBackground(analysis.songBackground ?? songBackground),
    },
    modelName: typeof (body as { model?: unknown }).model === "string" ? (body as { model: string }).model : model,
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const body = await request.json().catch(() => null)
  const metadata = body?.metadata
  const lyrics = typeof body?.lyrics === "string" ? body.lyrics.trim() : ""

  if (!metadata || typeof metadata.title !== "string" || typeof metadata.artist !== "string" || !lyrics) {
    return jsonResponse({ error: "metadata.title, metadata.artist, and lyrics are required" }, 400)
  }

  try {
    return jsonResponse(await createAnalysis(metadata, lyrics))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Song analysis failed" },
      error instanceof TemporaryOpenAIError ? 503 : 500,
    )
  }
})
