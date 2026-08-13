'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Modal from '@/features/dashboard/components/Modal'
import { useAssignTicket, useAssignmentSuggestions } from '@/hooks/useTickets'
import type { TicketStatus } from '@/types/ticket'
import {
  displayPersonName,
  initialsOf,
  ticketFieldClass,
  ticketLabelClass,
} from '@/features/tickets/ticketUi'

type AssignableTicket = {
  id: string
  reference: string
  title: string
  status: TicketStatus
  assignee: { id: string } | null
}

export default function AssignTicketModal({
  ticket,
  onClose,
}: {
  ticket: AssignableTicket | null
  onClose: () => void
}) {
  const suggestionsQuery = useAssignmentSuggestions(ticket?.id ?? '', {
    enabled: Boolean(ticket),
  })
  const assignTicket = useAssignTicket()
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    setSelectedTech(ticket?.assignee?.id ?? null)
    setReason('')
  }, [ticket])

  const needsReason = ticket?.status === 'ASSIGNED'
  const suggestions = suggestionsQuery.data ?? []

  const confirm = () => {
    if (!ticket || !selectedTech) return
    if (needsReason && !reason.trim()) return

    assignTicket.mutate(
      {
        id: ticket.id,
        body: {
          technicianId: selectedTech,
          reason: needsReason ? reason.trim() : undefined,
          isAutoSuggested: true,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={!!ticket}
      title={ticket?.assignee ? 'Réaffecter le ticket' : 'Affecter le ticket'}
      onClose={onClose}
    >
      {ticket && (
        <>
          <p className="mb-4 rounded-lg bg-moon-rose/25 px-3.5 py-2.5 text-sm text-moon-abyss/70">
            <span className="font-mono text-xs text-moon-abyss/45">{ticket.reference}</span>
            <span className="mx-2 text-moon-abyss/30">·</span>
            <span className="font-semibold text-moon-abyss">{ticket.title}</span>
          </p>

          {suggestionsQuery.isLoading && (
            <p className="text-sm text-moon-abyss/50">Chargement des suggestions…</p>
          )}
          {suggestionsQuery.isError && (
            <p className="text-sm text-rose-700">
              Impossible de charger les techniciens éligibles.
            </p>
          )}
          {!suggestionsQuery.isLoading && suggestions.length === 0 && (
            <p className="text-sm text-moon-abyss/50">
              Aucun technicien éligible pour cette catégorie (compétence requise ou charge
              max).
            </p>
          )}

          <div className="space-y-2">
            {suggestions.map((t) => {
              const name = displayPersonName(t.firstName, t.lastName, t.username)
              const selected = selectedTech === t.technicianId

              return (
                <button
                  key={t.technicianId}
                  type="button"
                  onClick={() => setSelectedTech(t.technicianId)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? 'border-moon-violet bg-moon-violet/5'
                      : 'border-moon-abyss/10 hover:border-moon-violet/40'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moon-lavande/15 text-xs font-bold text-moon-lavande">
                    {initialsOf(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-moon-abyss">
                      {name}
                    </span>
                    <span className="text-xs text-moon-abyss/50">
                      {t.currentLoad}/{t.maxConcurrentTickets} tickets
                      {t.skillLevel != null ? ` · niveau ${t.skillLevel}` : ''}
                    </span>
                  </span>
                  {selected && <Check size={16} className="shrink-0 text-moon-violet" />}
                </button>
              )
            })}
          </div>

          {needsReason && (
            <div className="mt-4">
              <label htmlFor="assign-reason" className={ticketLabelClass}>
                Motif de réaffectation (obligatoire)
              </label>
              <textarea
                id="assign-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className={`${ticketFieldClass} resize-none`}
                placeholder="Pourquoi changer de technicien ?"
              />
            </div>
          )}

          {assignTicket.isError && (
            <p className="mt-3 text-sm text-rose-700">
              {assignTicket.error instanceof Error
                ? assignTicket.error.message
                : 'Affectation impossible'}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={
                !selectedTech ||
                selectedTech === ticket.assignee?.id ||
                (needsReason && !reason.trim()) ||
                assignTicket.isPending
              }
              className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet disabled:cursor-not-allowed disabled:opacity-40"
            >
              {assignTicket.isPending ? 'Envoi…' : "Confirmer l'affectation"}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
