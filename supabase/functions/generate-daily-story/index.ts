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
  readTime: number
  themeKey: string
  whyThisDateMatters: string
}

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
    { category: "Cultural Tradition", themeKey: "weekend-tradition" },
    { category: "Chinese Idiom", themeKey: "idiom-monday" },
    { category: "Language Lesson", themeKey: "language-tuesday" },
    { category: "Chinese History", themeKey: "history-wednesday" },
    { category: "Taiwanese History", themeKey: "taiwan-thursday" },
    { category: "Cultural Tradition", themeKey: "tradition-friday" },
    { category: "Cultural Tradition", themeKey: "weekend-tradition" },
  ] as const

  return themes[dayIndex]
}

function getMonthDay(storyDate: string) {
  const [, month, day] = storyDate.split("-").map(Number)
  return { month, day }
}

function getDefaultSystemPrompt() {
  return `You are a culturally knowledgeable guide specializing in Chinese and Taiwanese language, history, and traditions.
Your goal is to generate a daily culturally relevant learning story that motivates English-speaking learners in their Mandarin journey while deepening their cultural understanding.

Determine whether the date has a real cultural, seasonal, or historical relevance in Chinese or Taiwanese culture.
If it does, prioritize that topic.
If it does not, fall back to this weekly system:
Monday: Chinese idiom.
Tuesday: Practical language lesson.
Wednesday: Chinese history story.
Thursday: Taiwanese history or culture.
Friday: Cultural tradition or philosophy.
Saturday and Sunday: Seasonal, food, customs, or lifestyle topics.

Write in the style of a polished daily cultural entry for a website.
The visible result should feel like this shape:
title
Chinese subtitle with pinyin in parentheses
one short summary paragraph
then 3 to 4 natural paragraphs of body content

Do not include visible section labels like "Phrase of the Day", "Background", or "Reflection".
Do not include bullet points.
Do not mention prompts or instructions.
Do not add filler.

The writing should be emotionally engaging but grounded, educational with real cultural depth, and concise.
Use English for the prose, but include Chinese where naturally useful.
Any time Chinese characters appear anywhere in the visible output, immediately follow them with pinyin with tone marks in parentheses, for example: 茶馆 (cháguǎn).
The titleChinese field should contain a concise Chinese subtitle formatted naturally, for example: 除夕 (Chú Xī)
The summary should be 1 to 2 sentences.
The content should be 3 to 4 paragraphs separated by blank lines and should read smoothly on a website.
If the topic is an idiom, include its origin story naturally in the body.
If the topic is historical, anchor it in real events.
If the topic is a language lesson, include practical nuance in prose.
If the topic is food or custom, explain cultural significance in prose.
Return only content that fits the requested schema.`
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
    "Keep the total learning content concise enough to fit roughly 200 to 350 words.",
    "The summary should read naturally on the website and should not mention formatting.",
    "The body content should be natural prose paragraphs with no visible labels.",
    "whyThisDateMatters should explain the date relevance or fallback rationale in one sentence for internal use only.",
  ].join("\n")
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
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano",
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
    modelName: typeof body.model === "string" ? body.model : Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano",
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
      model_name: Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano",
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
    const contentHash = await sha256(`${storyDate}:${payload.title}:${payload.content}`)
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
          content: payload.content,
          read_time: payload.readTime,
          lesson_learned: null,
          theme_key: payload.themeKey,
          source_event_id: event?.id ?? null,
          content_hash: contentHash,
          model_name: modelName,
          prompt_version: "daily-story-v1",
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
        content: payload.content,
        read_time: payload.readTime,
        lesson_learned: null,
        theme_key: payload.themeKey,
        source_event_id: event?.id ?? null,
        content_hash: contentHash,
        model_name: modelName,
        prompt_version: "daily-story-v1",
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
