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
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,oklch(0.985_0.006_78),oklch(0.965_0.01_78))]">
      <Header />
      <main className="container mx-auto flex flex-1 flex-col px-4 py-8 md:py-12">
        <HomePage
          initialStory={initialStory}
          todayIsoDate={todayIsoDate}
          initialMonth={initialMonth - 1}
          initialYear={initialYear}
          initialMonthStories={initialMonthStories}
        />
      </main>
      <footer className="border-t border-border/70 bg-card/60 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Discover Chinese And Taiwanese Culture, One Story At A Time</p>
        </div>
      </footer>
    </div>
  )
}
