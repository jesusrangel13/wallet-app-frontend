import NextTopLoader from 'nextjs-toploader'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NextTopLoader
        color="#2563eb" // blue-600
        initialPosition={0.08}
        crawlSpeed={200}
        height={4} // h-1 equivalent
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #2563eb,0 0 5px #2563eb"
      />
      {children}
    </>
  )
}
