'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings/general')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading...</div>
    </div>
  )
}
