"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getStoriesByMonthClient } from "@/lib/stories-client"
import { toIsoDateFromParts, type Story } from "@/lib/story-types"

export function CalendarSection({
  currentDateIso,
  selectedDate,
  initialMonth,
  initialYear,
  initialStories,
  onDateSelect,
}: {
  currentDateIso: string
  selectedDate: string
  initialMonth: number
  initialYear: number
  initialStories: Story[]
  onDateSelect: (storyDate: string) => void
}) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [stories, setStories] = useState(initialStories)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadStories = async () => {
      setIsLoading(true)
      const nextStories = await getStoriesByMonthClient(selectedYear, selectedMonth)

      if (isActive) {
        setStories(nextStories)
        setIsLoading(false)
      }
    }

    void loadStories()

    return () => {
      isActive = false
    }
  }, [selectedMonth, selectedYear])

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  return (
    <div id="calendar" className="scroll-mt-20">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-accent" />
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Story Archive</h2>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="gap-2 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <h3 className="text-lg font-semibold">
            {monthNames[selectedMonth]} {selectedYear}
          </h3>

          <Button variant="outline" size="sm" onClick={goToNextMonth} className="gap-2 bg-transparent">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {isLoading && <p className="mb-4 text-sm text-muted-foreground">Loading stories for this month...</p>}

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const storyDate = toIsoDateFromParts(selectedYear, selectedMonth, day)
            const story = stories.find((entry) => entry.storyDate === storyDate)
            const hasStory = Boolean(story)
            const isToday = storyDate === currentDateIso
            const isSelected = storyDate === selectedDate

            return hasStory ? (
              <button
                key={day}
                onClick={() => onDateSelect(storyDate)}
                className={`
                  aspect-square flex flex-col items-center justify-center p-2 rounded-md
                  transition-all hover:scale-105
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary ring-offset-2"
                      : isToday
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "bg-accent/10 hover:bg-accent/20 text-foreground"
                  }
                `}
              >
                <span className="text-sm md:text-base">{day}</span>
                {story && (
                  <span className="text-[0.6rem] mt-1 text-center leading-tight line-clamp-2">{story.category}</span>
                )}
              </button>
            ) : (
              <div
                key={day}
                className={`
                  aspect-square flex items-center justify-center p-2 rounded-md
                  ${isToday ? "bg-muted font-bold border-2 border-primary" : "text-muted-foreground"}
                `}
              >
                <span className="text-sm md:text-base">{day}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary ring-2 ring-primary ring-offset-2" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent/10" />
            <span>Story available</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
