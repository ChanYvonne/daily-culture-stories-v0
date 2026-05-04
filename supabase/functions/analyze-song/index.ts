const DEFAULT_MODEL = "gpt-4.1-mini"

type SongMetadata = {
  title: string
  artist: string
  genreTags?: string[]
  releaseYear?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
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
  const apiKey = Deno.env.get("OPENAI_API_KEY")

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY secret")
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL
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
                "Unless a field is directly quoting or referencing the song lyrics, write it in English.",
                "Write overview, culturalContext, culturalMeaning, poeticNotes, literalTranslation, meaning, culturalNote, imageryNotes, and annotation notes in English.",
                "Only original lyric lines and quoted phrases should remain in Chinese.",
                "Every pinyin field must contain pinyin with tone marks, such as nǐ hǎo, not unmarked pinyin like ni hao and not tone numbers like ni3 hao3.",
                "Before returning, check every line pinyin and annotation pinyin value; if any Mandarin syllable lacks tone marks, add the correct tone marks.",
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
              text: `Song: ${metadata.title}\nArtist: ${metadata.artist}\nKnown API Genre Tags: ${
                metadata.genreTags?.join(", ") || "unknown"
              }\nRelease Year: ${metadata.releaseYear ?? "unknown"}\n\nLyrics:\n${lyrics}`,
            },
          ],
        },
      ],
      text: { format: getAnalysisSchema() },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}: ${await response.text()}`)
  }

  const body = await response.json()
  const outputText = extractOutputText(body)

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text")
  }

  return {
    analysis: JSON.parse(outputText),
    modelName: typeof body.model === "string" ? body.model : model,
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
    return jsonResponse({ error: error instanceof Error ? error.message : "Song analysis failed" }, 500)
  }
})
