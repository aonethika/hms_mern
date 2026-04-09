'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getNotificationsPatientApi,
  markAllNotificationsReadPatient,
  markNotificationReadPatient,
  
} from '@/app/shared/api/patient.api'

// Format date as DD/MM/YYYY
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

type Notification = {
  _id: string
  appointmentId: {
    _id: string
    date: string
    status: string
    patientId: { _id: string; name: string }
  }
  prescriptionId: string
  leaveId: string
  createdAt: string
  isRead: boolean
  message: string
  receiver: string
  receiverRole: string
  scheduledFor: string
  type: string
  updatedAt: string
}

export default function Page() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showMarkAllButton, setShowMarkAllReadButton] = useState(true)

  const router = useRouter()

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsPatientApi()
      if (res.count === 0) setShowMarkAllReadButton(false)
      setNotifications(res.notifications || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Mark a single notification as read
  const handleMarkRead = async (n_id: string) => {
    try {
      await markNotificationReadPatient(n_id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === n_id ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Mark all notifications as read
  const handleReadAll = async () => {
    try {
      await markAllNotificationsReadPatient()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 sm:px-6 md:px-8 py-10 flex flex-col items-center space-y-8">
      {/* Empty state */}
      {notifications.length === 0 && (
        <p className="text-gray-400 text-center mt-20 text-sm sm:text-base">
          No notifications found.
        </p>
      )}

      {/* Mark All as Read button */}
      {showMarkAllButton && notifications.length > 0 && (
        <div className="w-full flex justify-end">
          <button
            onClick={handleReadAll}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-full shadow-md transition-transform transform hover:scale-105"
          >
            Mark All as Read
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className="flex flex-col gap-6 w-full max-w-lg">
        {notifications.map((notif) => (
          <div
            key={notif._id}
            onClick={() =>
              notif.prescriptionId
                ? router.push(`/patient/prescriptions/${notif.prescriptionId}`)
                : notif.type === 'leave'
                ? router.push('/patient/book-appointment')
                : router.push('/patient/appointments')
            }
            className={`relative w-full p-4 sm:p-6 rounded-xl cursor-pointer shadow-lg transition-transform transform hover:scale-105
              ${notif.isRead ? 'bg-gray-800 text-gray-100 opacity-60' : 'bg-cyan-900 text-white'}`}
          >
            {/* Notification Date */}
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              {formatDate(notif.createdAt)}
            </p>

            {/* Notification Message */}
            <span className="font-semibold text-sm sm:text-base">
              Dear {notif.appointmentId.patientId.name}
            </span>
            <p className="text-gray-300 mt-1 text-sm sm:text-base">{notif.message}</p>

            {/* Click indicator */}
            <p className="absolute bottom-3 right-4 text-cyan-300 text-xs sm:text-sm font-medium hover:text-cyan-100">
              Click here →
            </p>

            {/* Individual Mark Read button */}
            {!notif.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMarkRead(notif._id)
                }}
                className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full shadow-md transition-transform transform hover:scale-105"
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}