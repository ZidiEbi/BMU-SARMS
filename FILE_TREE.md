# BMU-SARMS Project File Tree

```
BMU-SARMS/
├── Configuration & Build Files
│   ├── .env.local
│   ├── .gitignore
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── .git/
│   └── [Git repository files]
│
├── .next/
│   └── [Next.js build output]
│
├── node_modules/
│   └── [Project dependencies]
│
├── public/
│   ├── bmu-logo.png
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
└── src/
    ├── proxy.ts
    │
    ├── actions/
    │   └── createStudentRecord.ts
    │
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   │
    │   ├── api/
    │   │   ├── admin/
    │   │   │   └── assign-staff/
    │   │   │       └── route.ts
    │   │   │
    │   │   └── scan-form/
    │   │       ├── route.ts
    │   │       └── lecturer/
    │   │           └── results/
    │   │               └── upsert/
    │   │                   └── route.ts
    │   │
    │   ├── auth/
    │   │   ├── getUserWithRole.ts
    │   │   ├── loading.tsx
    │   │   ├── callback/
    │   │   │   └── route.ts
    │   │   ├── forgot-password/
    │   │   │   └── page.tsx
    │   │   ├── login/
    │   │   │   │   └── favicon.ico
    │   │   │   └── page.tsx
    │   │   ├── pending/
    │   │   │   └── page.tsx
    │   │   └── signup/
    │   │       └── page.tsx
    │   │
    │   ├── complete-profile/
    │   │   └── page.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── page.tsx
    │   │   │
    │   │   ├── admin/
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   │   ├── logs/
    │   │   │   │   └── page.tsx
    │   │   │   └── roles/
    │   │   │       └── page.tsx
    │   │   │
    │   │   ├── dean/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   │
    │   │   ├── hod/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   │
    │   │   ├── lecturer/
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   │   ├── LecturerOnboardingForm.tsx
    │   │   │   ├── ResultEntryList.tsx
    │   │   │   ├── ResultsTable.tsx
    │   │   │   ├── courses/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── [courseId]/
    │   │   │   │       ├── actions.ts
    │   │   │   │       └── page.tsx
    │   │   │   ├── onboarding/
    │   │   │   │   └── page.tsx
    │   │   │   └── verification-pending/
    │   │   │       └── page.tsx
    │   │   │
    │   │   └── registry/
    │   │       ├── layout.tsx
    │   │       ├── page.tsx
    │   │       ├── audit/
    │   │       │   └── page.tsx
    │   │       ├── components/
    │   │       │   ├── StudentRegistryTable.tsx
    │   │       │   └── SuccessModal.tsx
    │   │       ├── history/
    │   │       │   └── page.tsx
    │   │       ├── scan/
    │   │       │   └── page.tsx
    │   │       └── secure/
    │   │           └── page.tsx
    │   │
    │   ├── dev/
    │   │   └── lecturer-preview/
    │   │       └── page.tsx
    │   │
    │   └── pending/
    │       └── page.tsx
    │
    ├── components/
    │   ├── ApprovalQueue.tsx
    │   ├── CourseAssignmentTable.tsx
    │   ├── LecturerCourseCard.tsx
    │   ├── ScoreEntryTable.tsx
    │   │
    │   ├── auth/
    │   │   └── CompleteProfileForm.tsx
    │   │
    │   └── dashboard/
    │       ├── DashboardSkeleton.tsx
    │       ├── Header.tsx
    │       ├── Sidebar.tsx
    │       ├── StatCard.tsx
    │       │
    │       ├── admin/
    │       │   └── UserAssignment.tsx
    │       │
    │       ├── hod/
    │       │   ├── AssignCourse.tsx
    │       │   ├── DeleteAssignmentBtn.tsx
    │       │   ├── page.tsx
    │       │   ├── StaffManagement.tsx
    │       │   └── verify/
    │       │       └── page.tsx
    │       │
    │       └── lecturer/
    │           ├── LecturerPreview.tsx
    │           ├── ResultEntryForm.tsx
    │           ├── ResultEntryRow.tsx
    │           └── ResultsTable.tsx
    │
    └── lib/
        ├── supabase.ts
        ├── supabase-browser.ts
        │
        ├── actions/
        │   └── course-actions.ts
        │
        ├── auth/
        │   ├── guards.ts
        │   ├── require-profile.ts
        │   ├── requireRole.ts
        │   └── roles.ts
        │
        ├── data/
        │   ├── lecturers.ts
        │   └── stats.ts
        │
        └── supabase/
            ├── browser.ts
            ├── client.ts
            └── server.ts
```

## Project Structure Summary

### Root Level
- **Configuration Files**: Next.js, TypeScript, ESLint, PostCSS, and Tailwind configuration
- **public/**: Static assets (logos and SVG icons)
- **src/**: Application source code

### Key Directories

#### `src/app/` - Next.js App Router
- **api/**: API routes for admin operations and form handling
- **auth/**: Authentication system with login, signup, and OAuth callback
- **dashboard/**: Role-based dashboards (admin, dean, hod, lecturer, registry)
- **complete-profile/**: User profile completion
- **dev/**: Development/preview pages
- **pending/**: Pending approval pages

#### `src/components/` - Reusable Components
- **auth/**: Authentication-related components
- **dashboard/**: Dashboard UI components organized by role (admin, hod, lecturer)
- **Root level**: Shared components (ApprovalQueue, CourseAssignmentTable, etc.)

#### `src/lib/` - Utilities and Helpers
- **supabase/**: Supabase client configurations (server, browser, client)
- **auth/**: Authentication guards, role requirements, and permission logic
- **data/**: Data fetching helpers (lecturers, statistics)
- **actions/**: Server actions for course operations

#### `src/actions/` - Server Actions
- Contains `createStudentRecord.ts` for student record creation
