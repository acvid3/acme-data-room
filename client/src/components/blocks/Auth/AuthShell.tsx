import { Logo } from '@/components/icons/logo'

export function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2 text-xl font-semibold">
                        <Logo className="size-6" />
                        Acme Data Room
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
