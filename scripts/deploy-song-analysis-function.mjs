import { existsSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const projectRefPath = path.join(projectRoot, "supabase", ".temp", "project-ref")

function getProjectRefFromSupabaseUrl(envKey) {
  const supabaseUrl = process.env[envKey]

  if (!supabaseUrl) {
    return ""
  }

  try {
    const hostname = new URL(supabaseUrl).hostname
    const suffix = ".supabase.co"

    if (!hostname.endsWith(suffix)) {
      console.log(`Could not derive Supabase project ref from ${envKey}: expected a *.supabase.co URL.`)
      return ""
    }

    return hostname.slice(0, -suffix.length)
  } catch {
    console.log(`Could not derive Supabase project ref from ${envKey}: invalid URL.`)
    return ""
  }
}

function getProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) {
    return {
      source: "SUPABASE_PROJECT_REF",
      value: process.env.SUPABASE_PROJECT_REF,
    }
  }

  const projectRefFromSupabaseUrl = getProjectRefFromSupabaseUrl("SUPABASE_URL")

  if (projectRefFromSupabaseUrl) {
    return {
      source: "SUPABASE_URL",
      value: projectRefFromSupabaseUrl,
    }
  }

  const projectRefFromPublicSupabaseUrl = getProjectRefFromSupabaseUrl("NEXT_PUBLIC_SUPABASE_URL")

  if (projectRefFromPublicSupabaseUrl) {
    return {
      source: "NEXT_PUBLIC_SUPABASE_URL",
      value: projectRefFromPublicSupabaseUrl,
    }
  }

  if (existsSync(projectRefPath)) {
    return {
      source: "supabase/.temp/project-ref",
      value: readFileSync(projectRefPath, "utf8").trim(),
    }
  }

  return {
    source: "",
    value: "",
  }
}

const projectRef = getProjectRef()

if (projectRef.source) {
  console.log(`Using Supabase project ref from ${projectRef.source}.`)
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.log("Skipping analyze-song deploy: SUPABASE_ACCESS_TOKEN is not set.")
  process.exit(0)
}

if (!projectRef.value) {
  console.log("Skipping analyze-song deploy: no Supabase project ref was found in SUPABASE_PROJECT_REF, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or the local linked project ref.")
  process.exit(0)
}

const result = spawnSync(
  "npx",
  ["supabase", "functions", "deploy", "analyze-song", "--project-ref", projectRef.value],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  },
)

process.exit(result.status ?? 1)
