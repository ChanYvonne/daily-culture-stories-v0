"use client"

import { useState, useTransition } from "react"
import { TodayStory } from "@/components/today-story"
import { CalendarSection } from "@/components/calendar-section"
import { getStoryByDateClient } from "@/lib/stories-client"
import type { Story } from "@/lib/story-types"

export function HomePage({
  initialStory,
  todayIsoDate,
  initialMonth,
  initialYear,
  initialMonthStories,
}: {
  initialStory: Story | null
  todayIsoDate: string
  initialMonth: number
  initialYear: number
  initialMonthStories: Story[]
}) {
  const [selectedDate, setSelectedDate] = useState(initialStory?.storyDate ?? todayIsoDate)
  const [displayStory, setDisplayStory] = useState<Story | null>(initialStory)
  const [isPending, startTransition] = useTransition()

  const handleDateSelect = (storyDate: string) => {
    setSelectedDate(storyDate)
    startTransition(async () => {
      const nextStory = await getStoryByDateClient(storyDate)
      setDisplayStory(nextStory)
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
      <div className="lg:flex-[3] lg:min-w-0 lg:overflow-y-auto">
        <TodayStory story={displayStory} isToday={selectedDate === todayIsoDate} isLoading={isPending} />
      </div>
      <div className="lg:flex-[2] lg:min-w-0 lg:overflow-y-auto">
        <CalendarSection
          currentDateIso={todayIsoDate}
          selectedDate={selectedDate}
          initialMonth={initialMonth}
          initialYear={initialYear}
          initialStories={initialMonthStories}
          onDateSelect={handleDateSelect}
        />
      </div>
    </div>
  )
}
