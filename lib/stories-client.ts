"use client"

import { mapStoryRow, type Story, type StoryRow } from "@/lib/story-types"
import { createSupabaseBrowserClient } from "@/lib/supabase"

function getMonthRange(year: number, monthIndex: number) {
  const month = (monthIndex + 1).toString().padStart(2, "0")
  const start = `${year}-${month}-01`

  const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1
  const nextYear = monthIndex === 11 ? year + 1 : year
  const nextMonthLabel = (nextMonth + 1).toString().padStart(2, "0")
  const end = `${nextYear}-${nextMonthLabel}-01`

  return { start, end }
}

export async function getStoryByDateClient(storyDate: string): Promise<Story | null> {
  const supabase = createSupabaseBrowserClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("story_date", storyDate)
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapStoryRow(data as StoryRow)
}

export async function getStoriesByMonthClient(year: number, monthIndex: number): Promise<Story[]> {
  const supabase = createSupabaseBrowserClient()

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
