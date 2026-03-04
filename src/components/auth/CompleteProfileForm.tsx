"use client"
import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle } from "lucide-react"

export default function CompleteProfileForm({ userId }: { userId: string }) {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [staffId, setStaffId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Update the profile
    const { error } = await supabase
      .from("profiles")
      .update({
        staff_id: staffId.toUpperCase(),
        profile_completed: true, // Crucial for Middleware bypass
      })
      .eq("id", userId)

    if (error) {
      console.error("Update failed:", error.message)
      alert("System Error: " + error.message)
      setLoading(false)
      return
    }

    // 2. FORCE NEXT.JS TO RE-EVALUATE MIDDLEWARE
    // Without this, the proxy still thinks profile_completed is false
    router.refresh()

    // 3. Move to dashboard
    setTimeout(() => {
      router.push("/dashboard")
    }, 100)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Assigned Staff ID
        </label>
        <input
          type="text"
          placeholder="e.g., BMU/STF/001"
          className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !staffId}
        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
        {loading ? "VERIFYING..." : "ACTIVATE DASHBOARD"}
      </button>
    </form>
  )
}