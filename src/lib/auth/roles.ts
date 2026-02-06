export const ROLES = {
  REGISTRY: 'REGISTRY',
  LECTURER: 'LECTURER',
  HOD: 'HOD',
  DEAN: 'DEAN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
