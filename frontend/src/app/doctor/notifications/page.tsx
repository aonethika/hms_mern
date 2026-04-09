'use client'

import { authRequest } from '@/app/shared/api/auth.api'
import { getNotificationsDoctorApi, markAllNotificationsReadDoctor, markNotificationReadDoctor } from '@/app/shared/api/doctor.api'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

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
  leaveId: string,
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
  const[showMarkAllButton, setShowMarkAllReadButton] = useState(true);

  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsDoctorApi()
      if(res.count == 0) setShowMarkAllReadButton(false);
      setNotifications(res.notifications || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkRead = async (n_id: string) => {
    try {
      await markNotificationReadDoctor(n_id)
      setNotifications(prev =>
        prev.map(n =>
          n._id === n_id ? { ...n, isRead: true } : n
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleReadAll = async () => {
    try {
      await markAllNotificationsReadDoctor()
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      )
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-10 flex flex-col items-center space-y-10">
      {notifications.length === 0 && (
        <p className="text-gray-400 text-center mt-20">No notifications found.</p>
      )}
    {showMarkAllButton &&(
        <div className="w-full flex justify-end">
        <button
          onClick={handleReadAll}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2 rounded-full shadow-md transition-transform transform hover:scale-105"
        >
          Mark All as Read
        </button>
      </div>
    )}
      

      {notifications.map((notif) => {
        return (
          <div
          onClick={()=> notif.leaveId && router.push("/doctor/leave") }
            key={notif._id}
            className={`relative max-w-sm w-full p-4 pb-12 rounded-xl cursor-pointer shadow-lg transition-transform transform hover:scale-105
              ${notif.isRead ? 'bg-gray-800 text-gray-100 opacity-60' : 'bg-cyan-900 text-white'}`}
          >
            <p className="text-xs text-gray-400 mb-1">
              {formatDate(notif.createdAt)}
            </p>

            <p className="text-gray-300 mt-1">{notif.message}</p>
            <p className="absolute bottom-3 right-4 text-cyan-300 text-xs font-medium hover:text-cyan-100">
            Click here →
            </p>

            {!notif.isRead && (
              <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleMarkRead(notif._id)
                }}
                className="absolute mt-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md transition-transform transform hover:scale-105"
              >
                Mark Read
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}