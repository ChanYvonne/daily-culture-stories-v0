import { mapStoryRow, type Story, type StoryRow } from "@/lib/story-types"
import { createSupabaseServerClient } from "@/lib/supabase"

function normalizeStoryDateInput(date: string | Date): string {
  if (typeof date === "string") {
    return date
  }

  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getMonthRange(year: number, monthIndex: number) {
  const month = (monthIndex + 1).toString().padStart(2, "0")
  const start = `${year}-${month}-01`

  const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1
  const nextYear = monthIndex === 11 ? year + 1 : year
  const nextMonthLabel = (nextMonth + 1).toString().padStart(2, "0")
  const end = `${nextYear}-${nextMonthLabel}-01`

  return { start, end }
}

export async function getTodayStory(storyDate: string): Promise<Story | null> {
  return getStoryByDate(storyDate)
}

export async function getLatestFeaturedStory(): Promise<Story | null> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_featured", true)
    .order("story_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapStoryRow(data as StoryRow)
}

export async function getStoryByDate(date: string | Date): Promise<Story | null> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("story_date", normalizeStoryDateInput(date))
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapStoryRow(data as StoryRow)
}

export async function getStoriesByMonth(year: number, monthIndex: number): Promise<Story[]> {
  const supabase = createSupabaseServerClient()

  if (!supabase) {
    return []
  }

  const { start, end } = getMonthRange(year, monthIndex)
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_featured", true)
    .gte("story_date", start)
    .lt("story_date", end)
    .order("story_date", { ascending: true })

  if (error || !data) {
    return []
  }

  return data.map((row) => mapStoryRow(row as StoryRow))
}
