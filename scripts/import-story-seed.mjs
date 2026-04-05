import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedFilePath = path.join(__dirname, "..", "lib", "story-seed.ts")
const envFilePath = path.join(__dirname, "..", ".env.local")

async function loadDotEnvFile(filePath) {
  try {
    const contents = await readFile(filePath, "utf8")

    for (const line of contents.split("\n")) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith("#")) {
        continue
      }

      const separatorIndex = trimmed.indexOf("=")

      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex)
      const value = trimmed.slice(separatorIndex + 1)

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error
    }
  }
}

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toIsoDate(longDate) {
  const parsed = new Date(`${longDate} UTC`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Could not parse story date: ${longDate}`)
  }

  const year = parsed.getUTCFullYear()
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${parsed.getUTCDate()}`.padStart(2, "0")

  return `${year}-${month}-${day}`
}

function extractSeedArray(source) {
  const startMarker = "const stories: Story[] = ["
  const endMarker = "\n\nfunction formatDate"
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Could not locate the seed stories array in lib/story-seed.ts")
  }

  const arrayLiteral = source.slice(startIndex + "const stories: Story[] = ".length, endIndex)
  return Function(`"use strict"; return (${arrayLiteral});`)()
}

async function main() {
  await loadDotEnvFile(envFilePath)

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const source = await readFile(seedFilePath, "utf8")
  const seedStories = extractSeedArray(source)
  const storiesToInsert = []
  const duplicateStories = []
  const seenDates = new Set()

  for (const story of seedStories) {
    const storyDate = toIsoDate(story.date)

    if (seenDates.has(storyDate)) {
      duplicateStories.push({
        storyDate,
        title: story.title,
        category: story.category,
      })
      continue
    }

    seenDates.add(storyDate)
    const contentHash = createHash("sha256").update(`${storyDate}:${story.title}:${story.content}`).digest("hex")

    storiesToInsert.push({
      story_date: storyDate,
      is_featured: true,
      display_order: 0,
      slug: `${storyDate}-${slugify(story.title)}`,
      category: story.category,
      title: story.title,
      title_chinese: story.titleChinese ?? null,
      summary: story.summary,
      content: story.content,
      read_time: story.readTime,
      lesson_learned: story.lessonLearned ?? null,
      theme_key: null,
      source_event_id: null,
      content_hash: contentHash,
      model_name: null,
      prompt_version: null,
    })
  }

  const { error } = await supabase.from("stories").upsert(storiesToInsert, {
    onConflict: "slug",
  })

  if (error) {
    throw error
  }

  console.log(`Imported ${storiesToInsert.length} featured stories into Supabase.`)
  console.log(`Skipped ${duplicateStories.length} duplicate-date stories.`)

  if (duplicateStories.length > 0) {
    console.log("Duplicate date report:")
    for (const story of duplicateStories) {
      console.log(`- ${story.storyDate}: ${story.title} (${story.category})`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
