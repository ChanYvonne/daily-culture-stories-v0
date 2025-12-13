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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <TodayStory story={displayStory} isToday={selectedDate.toDateString() === today.toDateString()} />
        <CalendarSection currentDate={today} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </main>
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Discover Chinese and Taiwanese culture, one story at a time</p>
        </div>
      </footer>
    </div>
  )
}
