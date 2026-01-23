import Link from 'next/link'
import { ArrowRight, Wallet, Users, TrendingUp, PieChart } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <span className="ml-2 text-xl font-bold text-foreground">FinanceApp</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href={`/${locale}/login`}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href={`/${locale}/register`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-foreground sm:text-6xl">
            Manage Your Money,
            <span className="text-blue-600 dark:text-blue-500"> Effortlessly</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
            Track expenses, manage budgets, split bills with friends, and gain insights into your spending habits - all in one powerful app.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href={`/${locale}/register`}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href={`/${locale}/login`}
              className="flex items-center gap-2 bg-card text-foreground px-8 py-3 rounded-lg text-lg font-medium hover:bg-muted transition-colors shadow-lg border border-border"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Multiple Accounts</h3>
            <p className="mt-2 text-muted-foreground">
              Track unlimited bank accounts, credit cards, and cash with multi-currency support.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Smart Budgets</h3>
            <p className="mt-2 text-muted-foreground">
              Set flexible budgets and get alerts before you overspend. Stay on track automatically.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Split Expenses</h3>
            <p className="mt-2 text-muted-foreground">
              Share costs with friends and family. Split bills easily and settle up fast.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <PieChart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Insights & Reports</h3>
            <p className="mt-2 text-muted-foreground">
              Beautiful charts and detailed reports to understand your spending patterns.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 bg-card rounded-2xl shadow-xl p-12 border border-border">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-500">4,000+</div>
              <div className="mt-2 text-muted-foreground">Banks Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-500">50+</div>
              <div className="mt-2 text-muted-foreground">Currencies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-500">100%</div>
              <div className="mt-2 text-muted-foreground">Free to Start</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl font-bold text-foreground">
            Ready to take control of your finances?
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Join thousands of users managing their money smarter
          </p>
          <Link
            href={`/${locale}/register`}
            className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card mt-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 FinanceApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
