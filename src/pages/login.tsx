import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
    } catch {
      toast('Invalid email or password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7EE]">
      <div className="rounded-2xl bg-[#FFFEFB] p-8 max-w-sm w-full shadow-lg border border-[rgba(23,61,34,0.08)]">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Nutyum" className="h-12 w-auto object-contain mx-auto mb-3" />
          <p className="text-sm text-[#4C5A48] mt-1">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48] block mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FAF7EE] px-4 py-2.5 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
              placeholder="admin@nutyum.com"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48] block mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FAF7EE] px-4 py-2.5 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#173D22] text-white py-2.5 text-sm font-semibold hover:bg-[#0e2616] transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
