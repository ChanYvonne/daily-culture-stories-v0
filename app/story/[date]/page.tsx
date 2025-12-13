import { Header } from "@/components/header"
import { StoryDetail } from "@/components/story-detail"
import { getStoryByDate } from "@/lib/stories"
import { notFound } from "next/navigation"

export default async function StoryPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  const story = getStoryByDate(date)

  if (!story) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <StoryDetail story={story} />
      </main>
    </div>
  )
}
