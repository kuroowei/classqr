// Turns UNIVERSITY_SUPER_ADMIN into "University Super Admin".
export function roleLabel(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}