"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { TodayStory } from "@/components/today-story"
import { CalendarSection } from "@/components/calendar-section"
import { getTodayStory, getStoryByDate } from "@/lib/stories"

export default function Home() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(today)

  const todayStory = getTodayStory()
  const displayStory = getStoryByDate(selectedDate) || todayStory

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          {/* Story takes 60% width on large screens */}
          <div className="lg:flex-[3] lg:min-w-0 lg:overflow-y-auto">
            <TodayStory story={displayStory} isToday={selectedDate.toDateString() === today.toDateString()} />
          </div>
          {/* Calendar takes 40% width on large screens */}
          <div className="lg:flex-[2] lg:min-w-0 lg:overflow-y-auto">
            <CalendarSection currentDate={today} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          </div>
        </div>
      </main>
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Discover Chinese and Taiwanese culture, one story at a time</p>
        </div>
      </footer>
    </div>
  )
}
