import type { AssessmentRole } from '../types/database'

/**
 * Get badge color class for a given role
 */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'TEAM_LEADER':
      return 'bg-redi-navy/10 text-redi-navy'
    case 'TEAM_MEMBER':
      return 'bg-redi-teal/10 text-redi-teal'
    case 'BOTH':
      return 'bg-redi-sky/10 text-redi-sky'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Format role string by replacing underscores with spaces
 */
export function formatRole(role: string): string {
  return role.replaceAll('_', ' ')
}

/**
 * Abbreviate component name for compact display
 */
export function abbreviateComponentName(name: string): string {
  if (name.includes('Airway')) return 'Airway'
  if (name.includes('Electrical')) return 'Elec Tx'
  if (name.includes('CPR')) return 'CPR/AED'
  if (name.includes('Simulation')) return 'Int Sim'

  // Fallback: if name is short enough, return as-is
  if (name.length <= 10) return name

  // Otherwise take first 2 words or first 10 chars
  const words = name.split(' ')
  if (words.length <= 2) return name
  return words.slice(0, 2).join(' ')
}
