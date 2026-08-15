import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'

type Mode = 'login' | 'register' | 'forgot-password'

export default function Auth({ mode }: { mode: Mode }) {
    if (mode === 'register') return <RegisterForm />
    if (mode === 'forgot-password') return <ForgotPasswordForm />
    return <LoginForm />
}
