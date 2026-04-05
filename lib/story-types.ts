export const STORY_TIME_ZONE = "America/New_York"

export const STORY_CATEGORIES = [
  "Chinese History",
  "Taiwanese History",
  "Chinese Idiom",
  "Language Lesson",
  "Cultural Tradition",
] as const

export type StoryCategory = (typeof STORY_CATEGORIES)[number]

export type StoryRow = {
  id: string
  story_date: string
  is_featured: boolean
  display_order: number
  slug: string
  category: StoryCategory
  title: string
  title_chinese: string | null
  summary: string
  content: string
  read_time: number
  lesson_learned: string | null
  theme_key: string | null
  source_event_id: string | null
  content_hash: string | null
  model_name: string | null
  prompt_version: string | null
  created_at: string
  updated_at: string
}

export type Story = {
  id: string
  storyDate: string
  date: string
  isFeatured: boolean
  displayOrder: number
  slug: string
  category: StoryCategory
  title: string
  titleChinese?: string
  summary: string
  content: string
  readTime: number
  lessonLearned?: string
  themeKey?: string
  sourceEventId?: string
  contentHash?: string
  modelName?: string
  promptVersion?: string
  createdAt: string
  updatedAt: string
}

export function toIsoDateFromParts(year: number, monthIndex: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${(monthIndex + 1).toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`
}

export function formatStoryDisplayDate(storyDate: string): string {
  const [year, month, day] = storyDate.split("-").map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12))

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate)
}

export function getTodayIsoDateInTimezone(date = new Date(), timeZone = STORY_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function mapStoryRow(row: StoryRow): Story {
  return {
    id: row.id,
    storyDate: row.story_date,
    date: formatStoryDisplayDate(row.story_date),
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
    slug: row.slug,
    category: row.category,
    title: row.title,
    titleChinese: row.title_chinese ?? undefined,
    summary: row.summary,
    content: row.content,
    readTime: row.read_time,
    lessonLearned: row.lesson_learned ?? undefined,
    themeKey: row.theme_key ?? undefined,
    sourceEventId: row.source_event_id ?? undefined,
    contentHash: row.content_hash ?? undefined,
    modelName: row.model_name ?? undefined,
    promptVersion: row.prompt_version ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
