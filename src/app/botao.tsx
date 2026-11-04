'use client'
import { useFormStatus } from 'react-dom'

export function BotaoEnviar({ rotulo, enviando }: { rotulo: string; enviando: string }) {
  const { pending } = useFormStatus()
  return (
    <button className="btn" disabled={pending}>
      {pending ? enviando : rotulo}
    </button>
  )
}
