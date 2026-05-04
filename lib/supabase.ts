import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export function hasSupabaseEnv() {
  return getSupabaseEnv() !== null
}

export function createSupabaseServerClient(): SupabaseClient | null {
  const env = getSupabaseEnv()

  if (!env) {
    return null
  }

  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

let browserClient: SupabaseClient | null = null
let serviceClient: SupabaseClient | null = null

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient
  }

  const env = getSupabaseEnv()

  if (!env) {
    return null
  }

  browserClient = createClient(env.url, env.anonKey)
  return browserClient
}

export function createSupabaseServiceClient(): SupabaseClient | null {
  if (serviceClient) {
    return serviceClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  serviceClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClient
}
