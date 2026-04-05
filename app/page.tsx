import { Header } from "@/components/header"
import { HomePage } from "@/components/home-page"
import { getLatestFeaturedStory, getStoriesByMonth, getStoryByDate, getTodayStory } from "@/lib/stories"
import { getTodayIsoDateInTimezone } from "@/lib/story-types"

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const todayIsoDate = getTodayIsoDateInTimezone()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedDate = resolvedSearchParams?.date
  const todayStory = await getTodayStory(todayIsoDate)
  const initialStory =
    (requestedDate ? await getStoryByDate(requestedDate) : null) ?? todayStory ?? (await getLatestFeaturedStory())
  const initialStoryDate = initialStory?.storyDate ?? todayIsoDate
  const [initialYear, initialMonth] = initialStoryDate.split("-").map(Number)
  const initialMonthStories = await getStoriesByMonth(initialYear, initialMonth - 1)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col">
        <HomePage
          initialStory={initialStory}
          todayIsoDate={todayIsoDate}
          initialMonth={initialMonth - 1}
          initialYear={initialYear}
          initialMonthStories={initialMonthStories}
        />
      </main>
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Discover Chinese and Taiwanese culture, one story at a time</p>
        </div>
      </footer>
    </div>
  )
}
