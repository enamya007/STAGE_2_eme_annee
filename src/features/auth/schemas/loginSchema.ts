import { object, string, pipe, email, minLength, boolean, type InferOutput } from 'valibot'

export const loginSchema = object({
    email: pipe(
        string("L'adresse e-mail est requise"),
        email('Adresse e-mail invalide')
    ),
    password: pipe(
        string('Le mot de passe est requis'),
        minLength(8, 'Entrez un minimum de 8 caractères')
    ),
    rememberMe: boolean(),
})

export type LoginFormValues = InferOutput<typeof loginSchema>
