import { supabase } from './supabase'
import type { InclusionPreset, Lead, Pkg } from './types'

export async function fetchPublished(): Promise<Pkg[]> {
  const { data, error } = await supabase
    .from('kp_packages')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Pkg[]
}

export async function fetchBySlug(slug: string): Promise<Pkg | null> {
  const { data, error } = await supabase.from('kp_packages').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data as Pkg | null
}

export function incrementViews(slug: string) {
  // fire-and-forget
  void supabase.rpc('kp_increment_views', { pkg_slug: slug })
}

export async function submitLead(lead: {
  package_id?: string | null
  name: string
  email: string
  phone?: string
  message?: string
  source?: string
  preferred_time?: string
}) {
  const { error } = await supabase.from('kp_leads').insert(lead)
  if (error) throw error
}

// ——— admin ———

export async function fetchAllPackages(): Promise<Pkg[]> {
  const { data, error } = await supabase
    .from('kp_packages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Pkg[]
}

export async function savePackage(pkg: Partial<Pkg>): Promise<Pkg> {
  const { data, error } = await supabase.from('kp_packages').upsert(pkg).select().single()
  if (error) throw error
  return data as Pkg
}

export async function deletePackage(id: string) {
  const { error } = await supabase.from('kp_packages').delete().eq('id', id)
  if (error) throw error
}

export async function fetchLeads(): Promise<(Lead & { kp_packages: { title: string } | null })[]> {
  const { data, error } = await supabase
    .from('kp_leads')
    .select('*, kp_packages(title)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as (Lead & { kp_packages: { title: string } | null })[]
}

export async function updateLead(id: string, patch: Partial<Lead>) {
  const { error } = await supabase.from('kp_leads').update(patch).eq('id', id)
  if (error) throw error
}

export async function fetchPresets(): Promise<InclusionPreset[]> {
  const { data, error } = await supabase.from('kp_inclusion_presets').select('*').order('name')
  if (error) throw error
  return (data ?? []) as InclusionPreset[]
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `media/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('keyplex').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('keyplex').getPublicUrl(path)
  return data.publicUrl
}
