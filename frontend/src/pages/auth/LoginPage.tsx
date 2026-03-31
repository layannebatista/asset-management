import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const DEMO_USERS = [
  { role: 'ADMIN', email: 'admin@empresa.com', password: 'Admin@123', color: 'bg-red-100 text-red-700' },
  { role: 'GESTOR', email: 'gestor@empresa.com', password: 'Gestor@123', color: 'bg-blue-100 text-blue-700' },
  { role: 'OPERADOR', email: 'operador@empresa.com', password: 'Op@12345', color: 'bg-emerald-100 text-emerald-700' },
]

const inputCls = 'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[10px] text-[14px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, verifyMfa, authStep } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { mfaRequired } = await login(email, password)
      if (!mfaRequired) navigate('/dashboard')
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; error?: { message?: string } } } }

      const message =
        errorObj?.response?.data?.message ??
        errorObj?.response?.data?.error?.message ??
        'Credenciais inválidas'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyMfa(mfaCode)
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; error?: { message?: string } } } }

      const message =
        errorObj?.response?.data?.message ??
        errorObj?.response?.data?.error?.message ??
        'Código inválido ou expirado'

      setError(message)
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
            <div className="text-[11px] text-slate-500">Sistema de Gestão de Ativos</div>
          </div>
        </div>

        <div className="bg-white rounded-[14px] p-9 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {authStep === 'mfa' ? (
            <>
              <h1 className="text-[20px] font-bold text-center mb-1">Verificação MFA</h1>
              <p className="text-[13px] text-slate-500 text-center mb-6">Digite o código enviado via WhatsApp</p>

              <form onSubmit={handleMfa} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                    Código de 6 dígitos
                  </label>
                  <input
                    className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[10px] text-[20px] font-mono tracking-[.5em] text-center outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                {error && <p className="text-[12px] text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="w-full py-[11px] bg-blue-700 text-white rounded-[8px] text-[14px] font-bold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Confirmar'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[20px] font-bold text-center mb-1">Bem-vindo de volta</h1>
              <p className="text-[13px] text-slate-500 text-center mb-6">
                Entre com sua conta ou use um perfil de demonstração
              </p>

              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[.6px] text-slate-400 text-center mb-2">
                  Perfis de demonstração
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.role}
                      type="button"
                      onClick={() => {
                        setEmail(u.email)
                        setPassword(u.password)
                      }}
                      className="border-[1.5px] border-slate-200 bg-slate-50 rounded-[8px] p-[9px] text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
                    >
                      <span className={`text-[11px] font-bold px-2 py-[2px] rounded-full inline-block mb-1 ${u.color}`}>
                        {u.role}
                      </span>
                      <div className="text-[10.5px] text-slate-500 truncate">
                        {u.email.split('@')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-[14px]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                    required
                  />
                </div>

                {error && <p className="text-[12px] text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[11px] bg-blue-700 text-white rounded-[8px] text-[14px] font-bold hover:bg-blue-800 transition disabled:opacity-50 mt-1"
                >
                  {loading ? 'Entrando...' : 'Entrar no sistema'}
                </button>
              </form>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-[8px] p-3 mt-4 text-[12px] text-blue-700">
                <Shield size={14} className="flex-shrink-0 mt-[1px]" />
                <span>Usuários com telefone cadastrado recebem código MFA via WhatsApp.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}