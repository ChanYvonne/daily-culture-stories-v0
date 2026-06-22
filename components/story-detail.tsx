import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Story } from "@/lib/story-types"

export function StoryDetail({ story }: { story: Story }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href={`/?date=${story.storyDate}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Today
          </Button>
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{story.date}</h2>
      </div>

      <Card className="border-border/80 bg-card/90 p-6 shadow-sm shadow-black/[0.04] md:p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          <Badge variant="secondary" className="border-accent/20 bg-accent/10 text-accent">
            {story.category}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {story.readTime} min read
          </Badge>
        </div>

        <h1 className="mb-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {story.title}
        </h1>

        {story.titleChinese && <p className="mb-6 text-xl font-medium text-accent md:text-2xl">{story.titleChinese}</p>}

        <div className="max-w-none text-foreground/90">
          <p className="mb-5 border-l-2 border-accent/60 pl-4 text-lg leading-relaxed text-foreground">{story.summary}</p>

          <div className="mt-6 space-y-4 text-base leading-7">
            {story.content.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {story.lessonLearned && (
            <div className="mt-8 rounded-md border border-border bg-muted/45 p-5">
              <h3 className="mb-2 text-lg font-semibold text-foreground">Lesson To Remember</h3>
              <p className="text-muted-foreground italic">{story.lessonLearned}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
