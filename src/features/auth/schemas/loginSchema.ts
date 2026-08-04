import {object, string, pipe, email, minLength, type InferOutput} from 'valibot';
export const loginSchema = object({
    email: pipe(
        string("l'email est requis!"),
        email('Format d\'email invalide !')
    ),
    password: pipe(
        string("le mot de passe est requis! "),
        minLength(8,"Entrez un minimum de 8 caractères")
    )
})
export type LoginFormValues = InferOutput<typeof loginSchema>