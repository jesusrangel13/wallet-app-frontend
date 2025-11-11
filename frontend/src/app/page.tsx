import Link from 'next/link'
import { ArrowRight, Wallet, Users, TrendingUp, PieChart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">FinanceApp</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
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
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Manage Your Money,
            <span className="text-blue-600"> Effortlessly</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Track expenses, manage budgets, split bills with friends, and gain insights into your spending habits - all in one powerful app.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Multiple Accounts</h3>
            <p className="mt-2 text-gray-600">
              Track unlimited bank accounts, credit cards, and cash with multi-currency support.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Smart Budgets</h3>
            <p className="mt-2 text-gray-600">
              Set flexible budgets and get alerts before you overspend. Stay on track automatically.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Split Expenses</h3>
            <p className="mt-2 text-gray-600">
              Share costs with friends and family. Split bills easily and settle up fast.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <PieChart className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Insights & Reports</h3>
            <p className="mt-2 text-gray-600">
              Beautiful charts and detailed reports to understand your spending patterns.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 bg-white rounded-2xl shadow-xl p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600">4,000+</div>
              <div className="mt-2 text-gray-600">Banks Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">50+</div>
              <div className="mt-2 text-gray-600">Currencies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">100%</div>
              <div className="mt-2 text-gray-600">Free to Start</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Ready to take control of your finances?
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Join thousands of users managing their money smarter
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-32 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 FinanceApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
