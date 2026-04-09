"use client";

import { getDoctorByIdAdminApi, getDoctorMonthlyAttendanceApi } from "@/app/shared/api/admin.api";
import useDoctorStore from "@/app/shared/store/doctor.store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const params = useParams();
  const { editDoctor } = useDoctorStore();

  const [doctor, setDoctor] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const doctorId = params.id as string;

  useEffect(() => {
    if (!doctorId) return;

    const fetchData = async () => {
      const docRes = await getDoctorByIdAdminApi(doctorId);
      setDoctor(docRes.doctor);

      const attRes = await getDoctorMonthlyAttendanceApi(doctorId, month, year);
      setDays(attRes.days || []);
    };

    fetchData();
  }, [doctorId, month, year]);

  if (!doctor) return <div className="p-8 text-gray-400 bg-gray-950 min-h-screen">Loading...</div>;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setDoctor((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await editDoctor(doctor._id, doctor);
    setSaving(false);
    setEditing(false);
  };

  const getColor = (status: string) => {
    if (status === "worked") return "bg-emerald-500/20 text-emerald-400";
    if (status === "leave") return "bg-amber-500/20 text-amber-400";
    return "bg-red-500/20 text-red-400";
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 max-w-7xl mx-auto space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dr. {doctor.name}</h1>
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${doctor.status === "available" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          {doctor.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">

          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-16 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => (
              <div
                key={i}
                className={`h-10 flex items-center justify-center rounded-md text-xs font-medium ${getColor(d.status)}`}
              >
                {new Date(d.date).getDate()}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">

          {!editing ? (
            <div className="grid grid-cols-2 gap-y-4 text-sm">

              <div>
                <span className="text-gray-400">Email</span>
                <p className="text-gray-100">{doctor.email}</p>
              </div>

              <div>
                <span className="text-gray-400">Specialization</span>
                <p>{doctor.specialization}</p>
              </div>

              <div>
                <span className="text-gray-400">Qualification</span>
                <p>{doctor.qualification?.join(", ")}</p>
              </div>

              <div>
                <span className="text-gray-400">Fee</span>
                <p>₹{doctor.consultationFee}</p>
              </div>

              <div>
                <span className="text-gray-400">Working Time</span>
                <p>{doctor.workingHours.startTime} - {doctor.workingHours.endTime}</p>
              </div>

              <div className="col-span-2 mt-4">
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition"
                >
                  Edit Details
                </button>
              </div>

            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">

              <input name="name" value={doctor.name} onChange={handleChange} className="p-2 rounded bg-gray-800 border border-gray-700" />
              <input name="email" value={doctor.email} onChange={handleChange} className="p-2 rounded bg-gray-800 border border-gray-700" />
              <input name="specialization" value={doctor.specialization} onChange={handleChange} className="p-2 rounded bg-gray-800 border border-gray-700" />

              <input
                value={doctor.qualification?.join(", ")}
                onChange={(e) =>
                  setDoctor((prev: any) => ({
                    ...prev,
                    qualification: e.target.value.split(",").map((q) => q.trim()),
                  }))
                }
                className="p-2 rounded bg-gray-800 border border-gray-700"
              />

              <input name="consultationFee" value={doctor.consultationFee} onChange={handleChange} className="p-2 rounded bg-gray-800 border border-gray-700" />

              <div className="flex gap-2">
                <input
                  type="time"
                  value={doctor.workingHours.startTime}
                  onChange={(e) =>
                    setDoctor((prev: any) => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, startTime: e.target.value },
                    }))
                  }
                  className="w-1/2 p-2 rounded bg-gray-800 border border-gray-700"
                />
                <input
                  type="time"
                  value={doctor.workingHours.endTime}
                  onChange={(e) =>
                    setDoctor((prev: any) => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, endTime: e.target.value },
                    }))
                  }
                  className="w-1/2 p-2 rounded bg-gray-800 border border-gray-700"
                />
              </div>

              <select name="status" value={doctor.status} onChange={handleChange} className="col-span-2 p-2 rounded bg-gray-800 border border-gray-700">
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="col-span-2 flex gap-3 mt-3">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditing(false)} className="px-5 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}