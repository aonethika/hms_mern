'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPrescriptionHistory } from '@/app/shared/api/patient.api'
import useAuthStore from '@/app/shared/store/auth.store'

export default function PrescriptionHistoryPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { selectedPatient } = useAuthStore()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getPrescriptionHistory(selectedPatient?._id)
        setData(res?.prescriptions || [])
      } catch {
        setData([])
      }
      setLoading(false)
    }

    if (selectedPatient?._id) fetchData()
  }, [selectedPatient])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-6 md:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Prescription History
      </h1>

      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        {data.map((item) => (
          <div
            key={item._id}
            onClick={() => router.push(`/patient/prescriptions/${item._id}`)}
            className="flex bg-gray-900 cursor-pointer rounded-xl p-4 gap-4 transition hover:-translate-y-1 hover:shadow-xl shadow-md"
          >
            {/* Indicator bar */}
            <div className="w-1 bg-cyan-400 rounded-full"></div>

            <div className="flex-1 flex flex-col gap-1">
              {/* Doctor Name */}
              <p className="text-sm text-gray-400">
                Consulted{' '}
                <span className="text-white font-semibold">
                  Dr. {item?.doctorId?.name || 'Unknown'}
                </span>
              </p>

              {/* Diagnosis */}
              <p className="text-white text-base line-clamp-1">
                {item?.diagnosis || 'No diagnosis'}
              </p>

              {/* Prescription list */}
              {item?.prescription?.length > 0 && (
                <ul className="text-gray-300 text-sm list-disc list-inside mt-1 line-clamp-2">
                  {item.prescription.map((med: any, i: number) => (
                    <li key={i}>{med}</li>
                  ))}
                </ul>
              )}

              {/* Date */}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}

        {!data.length && (
          <p className="text-gray-400 text-center mt-10 text-sm sm:text-base">
            No prescriptions found
          </p>
        )}
      </div>
    </div>
  )
}