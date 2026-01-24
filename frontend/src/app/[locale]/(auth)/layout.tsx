import { Wallet } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <span className="ml-2 text-xl font-bold text-foreground">FinanceApp</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
