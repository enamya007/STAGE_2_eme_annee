import { object, string, pipe, email, minLength, forward, check, type InferOutput } from 'valibot'

export const registerSchema = pipe(
    object({
        fullName: pipe(
            string('Le nom est requis'),
            minLength(2, 'Trop court')
        ),
        email: pipe(
            string("L'email est requis"),
            email('Format d\'email invalide')
        ),
        phone: pipe(
            string('Le numéro de téléphone est requis'),
            minLength(8, 'Le numéro doit contenir au moins 8 caractères')
        ),
        password: pipe(
            string('Le mot de passe est requis'),
            minLength(10, 'Entrez un minimum de 10 caractères')
        ),
        confirmPassword: pipe(
            string('Veuillez confirmer le mot de passe'),
            minLength(10, 'Entrez un minimum de 10 caractères')
        )
    }),
    forward(
        check((input) => input.password === input.confirmPassword, 'Les mots de passe ne correspondent pas'),
        ['confirmPassword']
    )
)

export type RegisterFormValues = InferOutput<typeof registerSchema>