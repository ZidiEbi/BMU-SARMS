export async function searchAllLecturers(query: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, department, faculty')
    .eq('role', 'lecturer')
    // Search across name, department, or faculty
    .or(`full_name.ilike.%${query}%,department.ilike.%${query}%,faculty.ilike.%${query}%`)
    .limit(10)

  if (error) return []
  return data
}