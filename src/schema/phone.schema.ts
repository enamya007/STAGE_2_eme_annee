import * as v from 'valibot'

export const phoneSchema = v.pipe(
  v.string('Le numéro de téléphone est requis'),
  v.nonEmpty('Le numéro de téléphone est requis'),
  v.minLength(8, 'Le numéro doit contenir au moins 8 caractères'),
  v.maxLength(30, 'Le numéro de téléphone ne doit pas dépasser 30 caractères'),
)

export function isValidPhone(phone: string) {
  const trimmed = phone.trim()
  return trimmed.length >= 8 && trimmed.length <= 30
}
