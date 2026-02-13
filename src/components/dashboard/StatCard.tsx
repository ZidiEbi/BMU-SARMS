// REMOVE 'use client'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend: string
  color?: 'blue' | 'maroon' | 'green'
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const accentColor = color === 'maroon' ? 'text-bmu-maroon bg-bmu-maroon/10' : 
                      color === 'green' ? 'text-bmu-green bg-bmu-green/10' : 
                      'text-bmu-blue bg-bmu-blue/10'

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-medical flex flex-col justify-between h-full transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${accentColor}`}>
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-bold text-bmu-green bg-bmu-green/10 px-2 py-1 rounded-full uppercase tracking-tighter">
          {trend}
        </span>
      </div>
      
      <div className="mt-6">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  )
}