export type UserRole = 'ADMIN' | 'TECHNICIEN' | 'CLIENT'

export interface AppUser {
    id: string
    name: string
    initials: string
    email: string
    role: UserRole
    active: boolean
    createdAt: string
}

/** Données locales : Nest n’expose pas GET /users. */
export const mockUsers: AppUser[] = [
    { id: 'u1', name: 'Morgane Lefèvre', initials: 'ML', email: 'morgane@rr.fr', role: 'ADMIN', active: true, createdAt: '2024-01-15' },
    { id: 'u2', name: 'Théo Marchand', initials: 'TM', email: 'theo@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-02-03' },
    { id: 'u3', name: 'Inès Bouchard', initials: 'IB', email: 'ines@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-02-10' },
    { id: 'u4', name: 'Karim Saïdi', initials: 'KS', email: 'karim@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-03-01' },
    { id: 'u5', name: 'Ambre Girard', initials: 'AG', email: 'ambre@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-03-12' },
    { id: 'u6', name: 'Arnaud Vidal', initials: 'AV', email: 'arnaud@client.fr', role: 'CLIENT', active: true, createdAt: '2024-04-02' },
    { id: 'u7', name: 'Claire Dubois', initials: 'CD', email: 'claire@client.fr', role: 'CLIENT', active: true, createdAt: '2024-04-18' },
    { id: 'u8', name: 'Paul Roche', initials: 'PR', email: 'paul@client.fr', role: 'CLIENT', active: false, createdAt: '2024-05-06' },
]

export const mockSkills = [
    'Réseau', 'Sécurité', 'Windows', 'Linux', 'macOS',
    'Cloud AWS', 'Cloud Azure', 'Base de données',
    'Imprimantes', 'Téléphonie VoIP', 'Virtualisation', 'Active Directory',
]
