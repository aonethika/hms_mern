"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAvailableDoctorsByDateAdmin, getDoctorTodayQueueApi } from "@/app/shared/api/admin.api";
import { log } from "node:console";

const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function DoctorQueueTable() {
  const [data, setData] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const doctorsRes = await getAvailableDoctorsByDateAdmin(getToday());

      console.log(doctorsRes);
      

      const result = await Promise.all(
        doctorsRes.data.map(async (doc: any) => {
            console.log("DOC", doc);
            
          const queue = await getDoctorTodayQueueApi(doc.doctorId);

          return {
            doctorId: doc.doctorId,
            doctorName: doc.doctorName,
            current: queue.inConsultation,
            next: queue.nextPatient
          };
        })
      );
      console.log(result);
      

      setData(result);
    };

    console.log(data);
    

    fetchData();
  }, []);

  return (
    <div className="mt-0 w-full h-screen bg-gray-900">
      

      <div className="bg-gray-850 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">

        
        
        <div className="grid grid-cols-3 bg-gray-800 px-6 py-4 text-sm uppercase tracking-wide text-gray-400 font-semibold">
          <div>Doctor</div>
          <div>Current</div>
          <div>Next</div>
        </div>

        
      
        {data.map((row) => (
          <div
            key={row.doctorId}
            onClick={() => router.push(`/admin/doctor-queue/${row.doctorId}`)}
            className="grid grid-cols-3 items-center px-6 py-5 border-t border-gray-800 hover:bg-gray-800/70 transition cursor-pointer group"
          >
            
            <div className="flex flex-col">
              <span className="text-cyan-400 font-semibold group-hover:underline">
                Dr. {row.doctorName}
              </span>
              <span className="text-xs text-gray-500">
                Click to view full queue
              </span>
            </div>

            <div>
              {row.current ? (
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {row.current.patient?.name}
                  </span>
                  <span className="text-xs text-green-400">
                    Token: {row.current.token}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500 italic">No active</span>
              )}
            </div>

           
            <div>
              {row.next ? (
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {row.next.patient?.name}
                  </span>
                  <span className="text-xs text-yellow-400">
                    Token: {row.next.token}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500 italic">No waiting</span>
              )}
            </div>
          </div>
        ))} 

       
        {data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No doctors available
          </div>
        )}
      </div>
    </div>
  );
} 