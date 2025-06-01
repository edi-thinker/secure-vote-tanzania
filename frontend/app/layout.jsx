import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SecureVote Tanzania - Digital Voting System",
  description: "Secure digital voting platform for Tanzanian citizens",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
