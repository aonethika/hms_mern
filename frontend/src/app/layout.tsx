// app/layout.tsx
import './globals.css'
import RoleNavbar from './components/navbar/RoleNavbar' // client component
export const metadata = {
  title: 'Nalanda HMS',
  description: 'Hospital Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RoleNavbar />
        <main>{children}</main>
      </body>
    </html>
  )
}