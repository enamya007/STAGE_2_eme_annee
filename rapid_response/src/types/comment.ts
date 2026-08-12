// types/comment.ts — modèles commentaires (généré api-forge).

import type { CommentVisibility } from '@/types/enums'

export type CommentAuthor = {
  id: string
  username: string
}

export type Comment = {
  id: string
  body: string
  visibility: CommentVisibility
  author: CommentAuthor | null
  createdAt: string
}

