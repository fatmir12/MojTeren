const ROLE_LABELS = {
  OWNER: "Vlasnik",
  WORKER: "Radnik",
  USER: "Korisnik",
}

export function formatRole(role) {
  return ROLE_LABELS[role] ?? role
}
