
'use client'
import useAuthStore from '@/app/shared/store/auth.store';
import DoctorNavbar from './DoctorNavbar'
import AdminNavbar from './AdminNavbar'
import PatientNavbar from './PatientNavbar'

export default function RoleNavbar() {
  const { user, isHydrated } = useAuthStore()

  if (!isHydrated || !user) return null

  if (user.role === 'doctor') return <DoctorNavbar />
  if (user.role === 'admin') return <AdminNavbar />
  if (user.role === 'patient') return <PatientNavbar />

  return null
}