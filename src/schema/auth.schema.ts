// schema/auth.schema.ts — validation entrées auth (généré api-forge).

import * as v from 'valibot'

export const registerSchema = v.object({
  username: v.pipe(
    v.string("Le nom d'utilisateur est requis"),
    v.nonEmpty("Le nom d'utilisateur est requis"),
  ),
  email: v.pipe(
    v.string("L'adresse e-mail est requise"),
    v.nonEmpty("L'adresse e-mail est requise"),
    v.email('Adresse email invalide'),
  ),
  password: v.pipe(
    v.string('Le mot de passe est requis'),
    v.nonEmpty('Le mot de passe est requis'),
    v.minLength(10, 'Le mot de passe doit contenir au moins 10 caractères'),
    v.maxLength(72, 'Le mot de passe ne doit pas dépasser 72 caractères'),
  ),
  firstName: v.optional(v.string('Le prénom est invalide')),
  lastName: v.optional(v.string('Le nom est invalide')),
  phone: v.optional(v.string('Le téléphone est invalide')),
})

export type RegisterInput = v.InferInput<typeof registerSchema>

export const loginSchema = v.object({
  identifier: v.pipe(
    v.string("L'identifiant est requis"),
    v.nonEmpty("L'identifiant est requis"),
  ),
  password: v.pipe(
    v.string('Le mot de passe est requis'),
    v.nonEmpty('Le mot de passe est requis'),
  ),
})

export type LoginInput = v.InferInput<typeof loginSchema>

export const refreshTokenSchema = v.object({
  refreshToken: v.pipe(
    v.string('Le refresh token est requis'),
    v.nonEmpty('Le refresh token est requis'),
  ),
})

export type RefreshTokenInput = v.InferInput<typeof refreshTokenSchema>

export const forgotPasswordSchema = v.object({
  email: v.pipe(
    v.string("L'adresse e-mail est requise"),
    v.nonEmpty("L'adresse e-mail est requise"),
    v.email('Adresse email invalide'),
  ),
})

export type ForgotPasswordInput = v.InferInput<typeof forgotPasswordSchema>

export const resetPasswordSchema = v.object({
  token: v.pipe(
    v.string('Le jeton est requis'),
    v.nonEmpty('Le jeton est requis'),
  ),
  newPassword: v.pipe(
    v.string('Le nouveau mot de passe est requis'),
    v.nonEmpty('Le nouveau mot de passe est requis'),
    v.minLength(10, 'Le nouveau mot de passe doit contenir au moins 10 caractères'),
    v.maxLength(72, 'Le nouveau mot de passe ne doit pas dépasser 72 caractères'),
  ),
})

export type ResetPasswordInput = v.InferInput<typeof resetPasswordSchema>
