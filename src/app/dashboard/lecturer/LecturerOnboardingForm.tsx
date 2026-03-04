"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Camera, RefreshCw, X, Loader2, Shield, UserCircle } from "lucide-react"

export default function LecturerOnboardingForm({ userId }: { userId: string }) {
  const supabase = createSupabaseBrowserClient()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  const [profile, setProfile] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    title: "",
  })

  // Load existing profile + org names for display only
  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone_number,
          title,
          avatar_url,
          staff_id,
          faculties:faculty_id (name),
          departments:department_id (name)
        `)
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("Onboarding profile fetch:", error.message)
        return
      }
      setProfile(data)

      setForm({
        full_name: data?.full_name ?? "",
        phone_number: data?.phone_number ?? "",
        title: data?.title ?? "",
      })
      setAvatarUrl(data?.avatar_url ?? null)
    }
    run()
  }, [supabase, userId])

  const facultyName = profile?.faculties?.name ?? "—"
  const deptName = profile?.departments?.name ?? "—"
  const staffId = profile?.staff_id ?? null

  // CAMERA
  const startCamera = async () => {
    try {
      setShowCamera(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { aspectRatio: 1, facingMode: "user" },
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      alert("Camera access denied. Please upload a file instead.")
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach((t) => t.stop())
    setShowCamera(false)
  }

  const capturePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext("2d")
    ctx?.translate(canvas.width, 0)
    ctx?.scale(-1, 1)
    ctx?.drawImage(video, 0, 0, 400, 400)

    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], "passport.jpg", { type: "image/jpeg" })
      uploadFile(file)
    }, "image/jpeg", 0.9)

    stopCamera()
  }

  // UPLOAD
  const uploadFile = async (file: File) => {
    setUploading(true)
    const fileExt = file.name.split(".").pop()
    const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    setAvatarUrl(data.publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarUrl) return alert("A passport photo is required for verification.")

    setLoading(true)

    // Lecturer can edit ONLY core identity fields:
    // full_name, phone_number, title, avatar_url
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        title: form.title.trim(),
        avatar_url: avatarUrl,
        profile_completed: true,
        // keep verification controlled by HOD pipeline
        is_verified: false,
      })
      .eq("id", userId)

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    window.location.href = "/dashboard/lecturer/verification-pending"
  }

  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Lecturer Onboarding</h1>
        <p className="text-slate-500 font-medium mt-2">
          Confirm your identity details. Faculty/Department are assigned by Admin.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty</p>
            <p className="font-bold text-slate-900">{facultyName}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
            <p className="font-bold text-slate-900">{deptName}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff ID</p>
            <p className="font-bold text-slate-900">{staffId ?? "Pending Assignment"}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Passport */}
        <div className="flex flex-col items-center">
          <div className="relative w-52 h-52">
            <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden border-8 border-white shadow-xl flex items-center justify-center relative">
              {showCamera ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 border-[25px] border-black/10 rounded-full pointer-events-none" />
                </>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Passport" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="text-slate-200" size={120} />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              {!showCamera ? (
                <>
                  <button type="button" onClick={startCamera} className="bg-bmu-blue text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                    <Camera size={20} />
                  </button>
                  <label className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <RefreshCw size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && uploadFile(e.target.files[0])} />
                  </label>
                </>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={capturePhoto} className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg font-black uppercase text-[10px] tracking-widest">
                    Snap Passport
                  </button>
                  <button type="button" onClick={stopCamera} className="bg-red-500 text-white p-3 rounded-2xl shadow-lg">
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start max-w-sm">
            <Shield className="text-blue-500 shrink-0" size={18} />
            <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase">
              Use a formal headshot. This is used for departmental verification and audit accuracy.
            </p>
          </div>
        </div>

        {/* Core identity */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Title (e.g. Dr.)"
              className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Full name"
              className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue md:col-span-2"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>

          <input
            placeholder="Phone number"
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            required
          />
        </div>

        <button
          disabled={loading || uploading || !avatarUrl}
          type="submit"
          className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-bmu-blue transition-all disabled:bg-slate-200 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Submit for HOD Verification"}
        </button>
      </form>
    </div>
  )
}