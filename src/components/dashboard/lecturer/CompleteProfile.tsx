'use client'

import { useState, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Camera, UserCircle, RefreshCw, X, Check, ShieldInfo, Loader2 } from 'lucide-react'

export default function CompleteProfile({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createSupabaseBrowserClient()
  
  const [bioData, setBioData] = useState({
    title: '',
    staff_id: '',
    department: '',
    faculty: ''
  })

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      setShowCamera(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { aspectRatio: 1, facingMode: 'user' } 
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      alert("Camera access denied. Please upload a file instead.")
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
    setShowCamera(false)
  }

  const capturePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (canvas && video) {
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      // Mirror the image to match the preview
      ctx?.translate(canvas.width, 0)
      ctx?.scale(-1, 1)
      ctx?.drawImage(video, 0, 0, 400, 400)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "passport.jpg", { type: "image/jpeg" })
          uploadFile(file)
        }
      }, 'image/jpeg', 0.9)
      stopCamera()
    }
  }

  // --- UPLOAD LOGIC ---
  const uploadFile = async (file: File) => {
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      alert(uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(publicUrl)
    }
    setUploading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarUrl) return alert("A passport photo is required for HOD verification.")
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        ...bioData,
        avatar_url: avatarUrl,
        profile_completed: true,
        is_verified: false // Resets verification for HOD approval
      })
      .eq('id', user.id)

    if (error) {
      alert(error.message)
    } else {
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
      <form onSubmit={handleUpdate} className="space-y-8">
        
        {/* PASSPORT PHOTO SECTION */}
        <div className="flex flex-col items-center">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lecturer Bio-Data</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verification Step 1: Formal Passport</p>
          </div>

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

            {/* Photo Actions */}
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
            <ShieldInfo className="text-blue-500 shrink-0" size={18} />
            <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase">
              Formal headshot only. Center your face within the frame. Casual photos will lead to <span className="underline">verification rejection</span>.
            </p>
          </div>
        </div>

        {/* BIO-DATA FORM */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Academic Title (e.g. Dr.)" 
              className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue"
              onChange={e => setBioData({...bioData, title: e.target.value})}
              required
            />
            <input 
              placeholder="Staff ID (e.g. BMU/STF/001)" 
              className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue"
              onChange={e => setBioData({...bioData, staff_id: e.target.value})}
              required
            />
          </div>

          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue"
            onChange={e => setBioData({...bioData, faculty: e.target.value})}
            required
          >
            <option value="">Select Faculty</option>
            <option value="Basic Medical Sciences">Basic Medical Sciences</option>
            <option value="Health Sciences">Health Sciences</option>
            <option value="Clinical Sciences">Clinical Sciences</option>
          </select>

          <input 
            placeholder="Home Department" 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-bmu-blue"
            onChange={e => setBioData({...bioData, department: e.target.value})}
            required
          />
        </div>

        <button 
          disabled={loading || uploading || !avatarUrl}
          type="submit"
          className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-bmu-blue transition-all disabled:bg-slate-200 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Submit for HOD Verification'}
        </button>
      </form>
    </div>
  )
}