/**
 * Données simulées du dashboard — remplacées plus tard par les appels
 * TanStack Query vers l'API NestJS (GET /tickets, /technicians, /users, /stats).
 */

export type TicketStatus = 'OUVERT' | 'AFFECTÉ' | 'EN COURS' | 'RÉSOLU'
export type TicketPriority = 'Urgente' | 'Haute' | 'Moyenne' | 'Basse'

export interface Ticket {
    ref: string
    title: string
    client: string
    status: TicketStatus
    priority: TicketPriority
    technician: string | null
    createdAt: string
}

export const tickets: Ticket[] = [
    { ref: 'RR-0041', title: 'Panne chauffage central immeuble B', client: 'Résidence Les Cèdres', status: 'EN COURS', priority: 'Urgente', technician: 'Karim Saïdi', createdAt: '24 juil. 2026' },
    { ref: 'RR-0040', title: 'Fuite canalisation salle de bain', client: 'M. Arnaud Vidal', status: 'AFFECTÉ', priority: 'Haute', technician: 'Ambre Girard', createdAt: '24 juil. 2026' },
    { ref: 'RR-0039', title: 'Électricité coupée dans 3 bureaux', client: 'Entreprise Solari', status: 'OUVERT', priority: 'Haute', technician: null, createdAt: '24 juil. 2026' },
    { ref: 'RR-0038', title: 'Serveur de fichiers inaccessible', client: 'Cabinet Morel', status: 'EN COURS', priority: 'Urgente', technician: 'Inès Bouchard', createdAt: '23 juil. 2026' },
    { ref: 'RR-0037', title: 'Imprimante réseau hors ligne', client: 'Agence Lumia', status: 'EN COURS', priority: 'Moyenne', technician: 'Inès Bouchard', createdAt: '23 juil. 2026' },
    { ref: 'RR-0036', title: 'Configuration VPN nouveau salarié', client: 'Entreprise Solari', status: 'AFFECTÉ', priority: 'Basse', technician: 'Théo Marchand', createdAt: '22 juil. 2026' },
    { ref: 'RR-0035', title: 'Poste de travail très lent', client: 'Mme Claire Dubois', status: 'EN COURS', priority: 'Moyenne', technician: 'Théo Marchand', createdAt: '22 juil. 2026' },
    { ref: 'RR-0034', title: 'Sauvegarde automatique en échec', client: 'Cabinet Morel', status: 'RÉSOLU', priority: 'Haute', technician: 'Karim Saïdi', createdAt: '21 juil. 2026' },
]

export interface Technician {
    id: string
    name: string
    initials: string
    available: boolean
    skills: string[]
    activeTickets: number
    capacity: number
}

export const technicians: Technician[] = [
    { id: 't1', name: 'Théo Marchand', initials: 'TM', available: true, skills: ['Réseau', 'Linux', 'Sécurité'], activeTickets: 3, capacity: 5 },
    { id: 't2', name: 'Inès Bouchard', initials: 'IB', available: false, skills: ['Windows', 'Active Directory', 'Imprimantes'], activeTickets: 7, capacity: 8 },
    { id: 't3', name: 'Karim Saïdi', initials: 'KS', available: true, skills: ['Cloud AWS', 'Virtualisation', 'Linux'], activeTickets: 2, capacity: 5 },
    { id: 't4', name: 'Ambre Girard', initials: 'AG', available: false, skills: ['Téléphonie VoIP', 'Réseau', 'Cloud Azure'], activeTickets: 5, capacity: 6 },
]

export const initialSkills = [
    'Réseau', 'Sécurité', 'Windows', 'Linux', 'macOS',
    'Cloud AWS', 'Cloud Azure', 'Base de données',
    'Imprimantes', 'Téléphonie VoIP', 'Virtualisation', 'Active Directory',
]

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

export const users: AppUser[] = [
    { id: 'u1', name: 'Morgane Lefèvre', initials: 'ML', email: 'morgane@rr.fr', role: 'ADMIN', active: true, createdAt: '2024-01-15' },
    { id: 'u2', name: 'Théo Marchand', initials: 'TM', email: 'theo@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-02-03' },
    { id: 'u3', name: 'Inès Bouchard', initials: 'IB', email: 'ines@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-02-10' },
    { id: 'u4', name: 'Karim Saïdi', initials: 'KS', email: 'karim@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-03-01' },
    { id: 'u5', name: 'Ambre Girard', initials: 'AG', email: 'ambre@rr.fr', role: 'TECHNICIEN', active: true, createdAt: '2024-03-12' },
    { id: 'u6', name: 'Arnaud Vidal', initials: 'AV', email: 'arnaud@client.fr', role: 'CLIENT', active: true, createdAt: '2024-04-02' },
    { id: 'u7', name: 'Claire Dubois', initials: 'CD', email: 'claire@client.fr', role: 'CLIENT', active: true, createdAt: '2024-04-18' },
    { id: 'u8', name: 'Paul Roche', initials: 'PR', email: 'paul@client.fr', role: 'CLIENT', active: false, createdAt: '2024-05-06' },
]

export const statusBreakdown = [
    { label: 'Ouvert', value: 3, color: '#7B337E' },
    { label: 'En cours', value: 4, color: '#6667AB' },
    { label: 'Affecté', value: 2, color: '#420D4B' },
    { label: 'Résolu', value: 8, color: '#2e9e6b' },
    { label: 'Urgent', value: 1, color: '#d24b6a' },
]

export const weeklyTrend = [
    { day: '22 juil', value: 2 },
    { day: '23 juil', value: 5 },
    { day: '24 juil', value: 3 },
    { day: '25 juil', value: 8 },
    { day: '26 juil', value: 4 },
    { day: '27 juil', value: 7 },
    { day: '28 juil', value: 6 },
]

export const technicianLoad = [
    { name: 'Karim Benali', value: 3, capacity: 5 },
    { name: 'Léa Moreau', value: 1, capacity: 5 },
    { name: 'Arnaud Vidal', value: 0, capacity: 5 },
    { name: 'Nadia Ouhab', value: 2, capacity: 5 },
]
