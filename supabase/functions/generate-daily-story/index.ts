import { createClient } from "npm:@supabase/supabase-js@2"

const STORY_CATEGORIES = [
  "Chinese History",
  "Taiwanese History",
  "Chinese Idiom",
  "Language Lesson",
  "Cultural Tradition",
] as const

type StoryCategory = (typeof STORY_CATEGORIES)[number]

type CalendarEvent = {
  id: string
  month: number
  day: number
  title: string
  title_chinese: string | null
  region: "china" | "taiwan" | "shared"
  kind: "holiday" | "historical_event" | "solar_term" | "festival" | "anniversary"
  brief_context: string
}

type StoryPayload = {
  category: StoryCategory
  title: string
  titleChinese: string
  summary: string
  content: string
  phraseSimplified: string
  phraseTraditional: string
  phrasePinyin: string
  phraseMeaning: string
  backgroundParagraphs: [string, string]
  sourceUrl: string
  reflection: string
  readTime: number
  themeKey: string
  whyThisDateMatters: string
}

const DEFAULT_MODEL = "gpt-5-mini"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function sha256(input: string) {
  const buffer = new TextEncoder().encode(input)
  return crypto.subtle.digest("SHA-256", buffer).then((hash) =>
    Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""),
  )
}

function getTodayIsoDateInTimezone(date = new Date(), timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function getThemeFallback(storyDate: string) {
  const dayIndex = new Date(`${storyDate}T12:00:00Z`).getUTCDay()
  const themes = [
    { category: "Language Lesson", themeKey: "sunday-tongue-twister-or-joke" },
    { category: "Chinese Idiom", themeKey: "idiom-monday" },
    { category: "Language Lesson", themeKey: "language-tuesday" },
    { category: "Chinese History", themeKey: "history-wednesday" },
    { category: "Taiwanese History", themeKey: "taiwan-thursday" },
    { category: "Cultural Tradition", themeKey: "tradition-friday" },
    { category: "Language Lesson", themeKey: "saturday-practical-language" },
  ] as const

  return themes[dayIndex]
}

function getMonthDay(storyDate: string) {
  const [, month, day] = storyDate.split("-").map(Number)
  return { month, day }
}

function getDefaultSystemPrompt() {
  return `You are a culturally knowledgeable guide specializing in Chinese and Taiwanese language, history, and traditions.

Your goal is to generate a **daily Chinese Culture Story** that is concise, engaging, and educational for English-speaking learners. Each story should help users learn **Simplified and Traditional Chinese** while deepening their understanding of **Chinese and Taiwanese culture**.

---

### Step 1: Determine the Content Type

First, determine the most relevant topic for today using this priority:

1. If today aligns with a real **Chinese or Taiwanese holiday, festival, or culturally significant historical event**, generate a story based on that topic.
2. If no relevant event exists, follow this weekly fallback system:
- Monday: Chinese idiom
- Tuesday: Practical language lesson (may include cultural slang)
- Wednesday: Chinese history
- Thursday: Taiwanese history or culture
- Friday: Cultural tradition or philosophy
- Saturday: Practical language lesson focused on real-life vocabulary and phrases used with friends, family, or at restaurants (may include cultural slang)
- Sunday: Chinese tongue twister or a Chinese or Taiwanese joke with explanation

---

### Step 2: Output Format (STRICT)

Return content that can be displayed in the following exact structure:

Title

Chinese Phrase of the Day

Simplified: [text]

Traditional: [text]

Pinyin: [text with tone marks]

Meaning: [concise English meaning]

Background Story

- Paragraph 1: Context, background, or story
- Paragraph 2: Cultural meaning, modern relevance, or reflection

Source

- Include exactly **1 credible link** that is accessible (e.g., Wikipedia or Britannica)

Reflection

- One concise sentence with a takeaway, insight, or question

---

### Writing Guidelines

- Keep the Background Story to **no more than 2 paragraphs total**
- Keep the overall response **concise, clear, and easy to scan**
- Avoid filler; every sentence should teach something meaningful
- Write in **natural, polished English prose**
- Ensure Chinese text is **accurate and natural**
- Use only **Simplified Chinese, Traditional Chinese, and English**
- Include **pinyin with tone marks**
- Maintain a tone that is **engaging, thoughtful, and culturally grounded**

---

### Source & Accuracy Requirements (CRITICAL)

- Use **at least 3 credible sources internally** to verify facts before generating the response
- Cross-check key details (dates, meanings, historical claims) across sources
- Only display **1 final source** in the output
- Ensure the displayed source is **well-known, verifiable, accessible, and directly relevant to the topic**
- Prefer sources such as TaiwanPlus, World Journal, **Wikipedia, Britannica, or reputable cultural/educational sites**

---

### Content-Specific Guidance

- Idioms (Monday): Include origin or historical context naturally
- Language Lessons (Tuesday & Saturday): Focus on practical usage, tone, and real-life nuance; slang is allowed when relevant
- History (Wednesday/Thursday): Anchor in real events or cultural developments
- Traditions (Friday): Explain meaning, rituals, and cultural significance
- Sunday (Tongue Twister or Joke):
    - Provide a short, memorable Chinese tongue twister or joke
    - Ensure it is understandable for learners
    - Use the Background Story to explain pronunciation challenges, wordplay, or humor

---

### Hard Constraints

- Do NOT exceed **2 paragraphs** in the Background Story
- MUST include **Simplified + Traditional Chinese + Pinyin + Meaning**
- MUST include exactly **1 working, credible source link**
- MUST follow the **content selection logic strictly**
- Do NOT include any languages other than **English, Simplified Chinese, and Traditional Chinese**
- Do NOT include extra commentary, explanations, or meta text
- Do NOT mention prompts or instructions
- Return only content that fits the requested schema.`
}

function getSystemPrompt() {
  return Deno.env.get("DAILY_STORY_SYSTEM_PROMPT")?.trim() || getDefaultSystemPrompt()
}

function getSchema() {
  return {
    type: "json_schema",
    name: "daily_culture_story",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        category: {
          type: "string",
          enum: [...STORY_CATEGORIES],
        },
        title: { type: "string" },
        titleChinese: { type: "string" },
        summary: { type: "string" },
        content: { type: "string" },
        phraseSimplified: { type: "string" },
        phraseTraditional: { type: "string" },
        phrasePinyin: { type: "string" },
        phraseMeaning: { type: "string" },
        backgroundParagraphs: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "string" },
        },
        sourceUrl: { type: "string" },
        reflection: { type: "string" },
        readTime: { type: "integer", minimum: 3, maximum: 8 },
        themeKey: { type: "string" },
        whyThisDateMatters: { type: "string" },
      },
      required: [
        "category",
        "title",
        "titleChinese",
        "summary",
        "content",
        "phraseSimplified",
        "phraseTraditional",
        "phrasePinyin",
        "phraseMeaning",
        "backgroundParagraphs",
        "sourceUrl",
        "reflection",
        "readTime",
        "themeKey",
        "whyThisDateMatters",
      ],
    },
  }
}

function buildUserPrompt(storyDate: string, event: CalendarEvent | null, recentStories: Array<{ story_date: string; title: string; theme_key: string | null }>) {
  const fallback = getThemeFallback(storyDate)
  const recentSummary =
    recentStories.length === 0
      ? "None"
      : recentStories.map((story) => `${story.story_date}: ${story.title}${story.theme_key ? ` [${story.theme_key}]` : ""}`).join("\n")

  return [
    `Target story date: ${storyDate}.`,
    `Fallback category if there is no strong date-specific event: ${fallback.category}.`,
    `Fallback theme key if there is no strong date-specific event: ${fallback.themeKey}.`,
    event
      ? `Relevant calendar event: ${event.title}${event.title_chinese ? ` (${event.title_chinese})` : ""}. Region: ${event.region}. Kind: ${event.kind}. Context: ${event.brief_context}`
      : "There is no exact event match in the cultural calendar for this date.",
    "Recent published stories to avoid repeating too closely:",
    recentSummary,
    "Return a single story that is distinct from recent titles and themes.",
    "The story should feel date-aware when applicable and evergreen when not.",
    "Keep the total learning content concise enough to fit roughly 150 to 250 words.",
    "The summary should be one concise sentence that introduces the learning value of the story.",
    "The content field may be concise because the final visible story will be assembled from the structured fields.",
    "Provide exactly two backgroundParagraphs. Do not include heading text inside either paragraph.",
    "Provide exactly one sourceUrl. It must be a credible, accessible, directly relevant URL.",
    "whyThisDateMatters should explain the date relevance or fallback rationale in one sentence for internal use only.",
  ].join("\n")
}

function buildStoryContent(payload: StoryPayload) {
  return [
    "Chinese Phrase of the Day",
    `Simplified: ${payload.phraseSimplified}`,
    `Traditional: ${payload.phraseTraditional}`,
    `Pinyin: ${payload.phrasePinyin}`,
    `Meaning: ${payload.phraseMeaning}`,
    "Background Story",
    payload.backgroundParagraphs[0],
    payload.backgroundParagraphs[1],
    "Source",
    payload.sourceUrl,
    "Reflection",
    payload.reflection,
  ].join("\n\n")
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") {
    return response.output_text
  }

  const output = Array.isArray(response.output) ? response.output : []

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue
    }

    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : []

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue
      }

      const candidate = part as { text?: unknown }
      if (typeof candidate.text === "string") {
        return candidate.text
      }
    }
  }

  return null
}

async function createStoryPayload(storyDate: string, event: CalendarEvent | null, recentStories: Array<{ story_date: string; title: string; theme_key: string | null }>) {
  const apiKey = Deno.env.get("OPENAI_API_KEY")

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY secret")
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL,
      reasoning: {
        effort: "low",
      },
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: getSystemPrompt() }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildUserPrompt(storyDate, event, recentStories) }],
        },
      ],
      text: {
        format: getSchema(),
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}: ${await response.text()}`)
  }

  const body = await response.json()

  if (body.error) {
    throw new Error(`OpenAI API error: ${JSON.stringify(body.error)}`)
  }

  const outputText = extractOutputText(body)

  if (!outputText) {
    throw new Error("OpenAI response did not include structured output text")
  }

  return {
    payload: JSON.parse(outputText) as StoryPayload,
    responseId: typeof body.id === "string" ? body.id : null,
    modelName: typeof body.model === "string" ? body.model : Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL,
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const cronSecret = Deno.env.get("CRON_SECRET")
  const suppliedSecret = request.headers.get("x-cron-secret")

  if (cronSecret && suppliedSecret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const requestBody = await request.json().catch(() => ({}))
  const forcedDate = typeof requestBody.date === "string" ? requestBody.date : null
  const force = Boolean(requestBody.force)
  const storyDate = forcedDate ?? getTodayIsoDateInTimezone(new Date(), "America/New_York")

  const { data: run, error: runInsertError } = await supabase
    .from("generation_runs")
    .insert({
      story_date: storyDate,
      status: "running",
      model_name: Deno.env.get("OPENAI_MODEL") ?? DEFAULT_MODEL,
    })
    .select("id")
    .single()

  if (runInsertError) {
    return jsonResponse({ error: runInsertError.message }, 500)
  }

  const runId = run.id as string

  try {
    const { data: existingStory, error: existingStoryError } = await supabase
      .from("stories")
      .select("id, story_date, title")
      .eq("story_date", storyDate)
      .eq("is_featured", true)
      .limit(1)
      .maybeSingle()

    if (existingStoryError) {
      throw new Error(existingStoryError.message)
    }

    if (existingStory && !force) {
      await supabase
        .from("generation_runs")
        .update({
          status: "skipped",
          error_message: `Featured story already exists for ${storyDate}`,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId)

      return jsonResponse({
        status: "skipped",
        storyDate,
        existingStory,
      })
    }

    const { month, day } = getMonthDay(storyDate)
    const { data: eventRows, error: eventError } = await supabase
      .from("cultural_calendar")
      .select("id, month, day, title, title_chinese, region, kind, brief_context")
      .eq("month", month)
      .eq("day", day)
      .order("region", { ascending: true })
      .limit(1)

    if (eventError) {
      throw new Error(eventError.message)
    }

    const { data: recentStories, error: recentError } = await supabase
      .from("stories")
      .select("story_date, title, theme_key")
      .order("story_date", { ascending: false })
      .limit(14)

    if (recentError) {
      throw new Error(recentError.message)
    }

    const event = (eventRows?.[0] as CalendarEvent | undefined) ?? null
    const { payload, responseId, modelName } = await createStoryPayload(storyDate, event, recentStories ?? [])
    const storyContent = buildStoryContent(payload)
    const contentHash = await sha256(`${storyDate}:${payload.title}:${storyContent}`)
    const slug = `${storyDate}-${slugify(payload.title)}`

    if (existingStory && force) {
      const { error: updateError } = await supabase
        .from("stories")
        .update({
          slug,
          category: payload.category,
          title: payload.title,
          title_chinese: payload.titleChinese,
          summary: payload.summary,
          content: storyContent,
          read_time: payload.readTime,
          lesson_learned: null,
          theme_key: payload.themeKey,
          source_event_id: event?.id ?? null,
          content_hash: contentHash,
          model_name: modelName,
          prompt_version: "daily-story-v2",
          is_featured: true,
          display_order: 0,
        })
        .eq("id", existingStory.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    } else {
      const { error: insertError } = await supabase.from("stories").insert({
        story_date: storyDate,
        is_featured: true,
        display_order: 0,
        slug,
        category: payload.category,
        title: payload.title,
        title_chinese: payload.titleChinese,
        summary: payload.summary,
        content: storyContent,
        read_time: payload.readTime,
        lesson_learned: null,
        theme_key: payload.themeKey,
        source_event_id: event?.id ?? null,
        content_hash: contentHash,
        model_name: modelName,
        prompt_version: "daily-story-v2",
      })

      if (insertError) {
        throw new Error(insertError.message)
      }
    }

    await supabase
      .from("generation_runs")
      .update({
        status: "succeeded",
        response_id: responseId,
        model_name: modelName,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId)

    return jsonResponse({
      status: "succeeded",
      storyDate,
      title: payload.title,
      category: payload.category,
      usedCalendarEvent: event?.title ?? null,
      responseId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    await supabase
      .from("generation_runs")
      .update({
        status: "failed",
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId)

    return jsonResponse(
      {
        status: "failed",
        storyDate,
        error: message,
      },
      500,
    )
  }
})
