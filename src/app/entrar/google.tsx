'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth/client'

export function BotaoGoogle() {
  const [indo, setIndo] = useState(false)
  const [erro, setErro] = useState('')
  async function entrar() {
    setIndo(true)
    setErro('')
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: '/' })
    if (error) {
      setErro(error.message || 'Não deu para entrar com o Google.')
      setIndo(false)
    }
  }
  return (
    <div className="actions">
      <button className="btn" onClick={entrar} disabled={indo}>
        {indo ? 'Abrindo o Google…' : 'Entrar com o Google'}
      </button>
      {erro && (
        <p className="warn" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
