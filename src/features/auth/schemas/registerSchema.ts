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
        password: pipe(
            string('Le mot de passe est requis'),
            minLength(8, 'Entrez un minimum de 8 caractères')
        ),
        confirmPassword: pipe(
            string('Veuillez confirmer le mot de passe'),
            minLength(8, 'Entrez un minimum de 8 caractères')
        )
    }),
    forward(
        check((input) => input.password === input.confirmPassword, 'Les mots de passe ne correspondent pas'),
        ['confirmPassword']
    )
)

export type RegisterFormValues = InferOutput<typeof registerSchema>