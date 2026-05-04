import { existsSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const projectRefPath = path.join(projectRoot, "supabase", ".temp", "project-ref")

function getProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) {
    return process.env.SUPABASE_PROJECT_REF
  }

  if (existsSync(projectRefPath)) {
    return readFileSync(projectRefPath, "utf8").trim()
  }

  return ""
}

const projectRef = getProjectRef()

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.log("Skipping analyze-song deploy: SUPABASE_ACCESS_TOKEN is not set.")
  process.exit(0)
}

if (!projectRef) {
  console.log("Skipping analyze-song deploy: SUPABASE_PROJECT_REF is not set and no linked project ref was found.")
  process.exit(0)
}

const result = spawnSync(
  "npx",
  ["supabase", "functions", "deploy", "analyze-song", "--project-ref", projectRef],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  },
)

process.exit(result.status ?? 1)
