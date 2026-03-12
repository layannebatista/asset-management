import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Shield, CheckCircle } from 'lucide-react'
import { userApi } from '../../api'

export default function ActivateAccountPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [lgpd, setLgpd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    if (!lgpd) { setError('Aceite a política de privacidade para continuar'); return }
    setError('')
    setLoading(true)
    try {
      await userApi.activateAccount(token, password, confirm, lgpd)
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Token inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-blue-700 rounded-[10px] flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <div className="text-[22px] font-bold text-slate-100">Patrimônio 360</div>
            <div className="text-[11px] text-slate-500">Ativação de Conta</div>
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-9 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-[18px] font-bold mb-2">Conta ativada!</h2>
              <p className="text-[13px] text-slate-500 mb-6">Sua senha foi definida com sucesso.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-[11px] bg-blue-700 text-white rounded-[8px] text-[14px] font-bold hover:bg-blue-800 transition"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-[20px] font-bold text-center mb-1">Ative sua conta</h1>
              <p className="text-[13px] text-slate-500 text-center mb-6">Crie uma senha para acessar o sistema</p>
              <form onSubmit={handleSubmit} className="space-y-[14px]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Nova senha</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
                    className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[10px] text-[14px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Confirmar senha</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                    className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[10px] text-[14px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition" />
                </div>
                <label className="flex items-start gap-2 text-[12.5px] text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={lgpd} onChange={(e) => setLgpd(e.target.checked)} className="mt-[2px] accent-blue-700" />
                  <span>Li e aceito a <span className="text-blue-700 underline">Política de Privacidade</span> e os termos de tratamento de dados (LGPD).</span>
                </label>
                {error && <p className="text-[12px] text-red-600">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-[11px] bg-blue-700 text-white rounded-[8px] text-[14px] font-bold hover:bg-blue-800 transition disabled:opacity-50">
                  {loading ? 'Ativando...' : 'Ativar conta'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
