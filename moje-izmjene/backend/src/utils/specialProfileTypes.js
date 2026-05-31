export const SPECIAL_PROFILE_TYPES = {
  SPORTSKI_KLUB: "SPORTSKI_KLUB",
  LICENCIRANI_TRENER: "LICENCIRANI_TRENER",
}

export const VALIDATION_STATUS = {
  PENDING: "PENDING",
  VALIDATED: "VALIDATED",
  REJECTED: "REJECTED",
}

export const SPECIAL_PROFILE_LABELS = {
  SPORTSKI_KLUB: "Sportski klub",
  LICENCIRANI_TRENER: "Licencirani trener",
}

export const SPORTS_CLUB_BENEFITS = [
  { id: "schedule", label: "Pregled klupskog rasporeda", description: "Pregled rezerviranih termina kluba." },
  { id: "membership", label: "Upravljanje članarinom", description: "Evidencija i status članarina." },
  { id: "members", label: "Upravljanje članovima kluba", description: "Lista i podaci o članovima." },
  { id: "seasonal", label: "Zakup sezonskog termina", description: "Rezervacija sezonskih termina po povoljnijoj cijeni." },
]

export const TRAINER_BENEFITS = [
  { id: "clients", label: "Upravljanje klijentima", description: "Lista klijenata i kontakt podaci." },
  { id: "sessions", label: "Kreiranje trening termina", description: "Kreiranje i objava trening termina." },
  { id: "referrals", label: "Upravljanje referral kodovima", description: "Generisanje i praćenje referral kodova." },
  { id: "manage", label: "Otkaži/izmijeni termin", description: "Upravljanje postojećim treninzima." },
]

export function isValidSpecialProfileType(type) {
  return Object.values(SPECIAL_PROFILE_TYPES).includes(type)
}

export function getBenefitsForType(type) {
  if (type === SPECIAL_PROFILE_TYPES.SPORTSKI_KLUB) return SPORTS_CLUB_BENEFITS
  if (type === SPECIAL_PROFILE_TYPES.LICENCIRANI_TRENER) return TRAINER_BENEFITS
  return []
}
