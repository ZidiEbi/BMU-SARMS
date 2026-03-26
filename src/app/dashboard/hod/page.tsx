import CourseCreator from '@/components/dashboard/hod/CourseCreator'
import HODWorkspace from '@/components/dashboard/hod/HODWorkspace'
import { getHODPageData } from '@/lib/hod/getHODPageData'

export default async function HODDashboard() {
  const { isAdmin, departmentLabel, lecturers, offerings } = await getHODPageData()

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">
            👑 You are viewing in Admin mode - showing all departments
          </p>
        </div>
      )}

      <section>
        <CourseCreator department={departmentLabel} />
      </section>

      <section>
        <HODWorkspace
          departmentLabel={departmentLabel}
          lecturers={lecturers}
          offerings={offerings}
        />
      </section>
    </div>
  )
}