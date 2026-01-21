import NextTopLoader from 'nextjs-toploader'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NextTopLoader
        color="#1A9B8E" // Primary teal color
        initialPosition={0.08}
        crawlSpeed={200}
        height={4}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #1A9B8E,0 0 5px #1A9B8E"
      />
      {children}
    </>
  )
}
