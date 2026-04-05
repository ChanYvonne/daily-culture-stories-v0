"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import type { Story } from "@/lib/story-types"

export function TodayStory({
  story,
  isToday = true,
  isLoading = false,
}: {
  story: Story | null
  isToday?: boolean
  isLoading?: boolean
}) {
  if (!story) {
    return (
      <div className="mb-12 md:mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-accent" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">No Story Published Yet</h2>
        </div>

        <Card className="p-6 md:p-8 border-2 border-dashed border-border shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Today&apos;s story is still being prepared.</h1>
          <p className="text-muted-foreground leading-relaxed">
            Check back later, or explore the archive using the calendar while the next featured story is added.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-12 md:mb-16">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-accent" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {isToday ? "Today's Story" : "Story from Archive"} · {story.date}
        </h2>
      </div>

      <Card className="p-6 md:p-8 border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            {story.category}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {story.readTime} min read
          </Badge>
          {isLoading && (
            <Badge variant="outline" className="text-muted-foreground">
              Loading...
            </Badge>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight text-balance">
          {story.title}
        </h1>

        {story.titleChinese && <p className="text-xl md:text-2xl text-accent mb-6 font-medium">{story.titleChinese}</p>}

        <div className="prose prose-lg max-w-none text-foreground/90">
          <p className="text-lg leading-relaxed mb-4">{story.summary}</p>

          <div className="mt-6 space-y-4 text-base leading-relaxed">
            {story.content.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {story.lessonLearned && (
            <div className="mt-8 p-6 bg-muted/50 rounded-lg border-l-4 border-accent">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Lesson to Remember</h3>
              <p className="text-muted-foreground italic">{story.lessonLearned}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
