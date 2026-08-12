// services/attachments.service.ts — appels API attachments (généré api-forge).

import * as v from 'valibot'
import { http } from '@/services/http/axios'
import type { Attachment } from '@/types/attachment'

export const attachmentsService = {
  list: (id: string): Promise<Attachment[]> => {
    return http.get<Attachment[]>(`/tickets/${id}/attachments`).then((r) => r.data)
  },

  upload: (id: string, file: File): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<Attachment>(`/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  remove: (id: string, attId: string): Promise<void> => {
    return http.delete(`/tickets/${id}/attachments/${attId}`).then(() => undefined)
  }
}

