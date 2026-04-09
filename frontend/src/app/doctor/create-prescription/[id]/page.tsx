"use client";

import { createPrescriptionApi, getPatientByAppointmentId } from "@/app/shared/api/doctor.api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const calculateAge = (dob?: string) => {
  if (!dob) return "NA";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [patient, setPatient] = useState<{ name: string; dob: string; gender: string; phone: string } | null>(null);
  const [doctor, setDoctor] = useState<{ name: string; qualification: string[]; specialization: string } | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      const res = await getPatientByAppointmentId(appointmentId);
      setPatient(res.patient);
      setDoctor(res.appointment.doctorId);
    };
    fetchPatient();
  }, [appointmentId]);

  const [prescription, setPrescription] = useState<any>({
    diagnosis: "",
    notes: "",
    advice: "",
    medicines: [{ name: "", dosage: "", frequency: "", duration: "" }],
    followUpDate: "",
    patientId: { name: "", dob: "", gender: "" },
    doctorId: { name: "", qualification: ["MBBS"], specialization: "" },
  });

  useEffect(() => {
    if (patient && doctor) {
      setPrescription((prev: any) => ({
        ...prev,
        patientId: patient,
        doctorId: doctor,
      }));
    }
  }, [patient, doctor]);

  console.log("doctor",doctor);
  

  const handleChange = (key: string, value: any) => {
    setPrescription((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleMedicineChange = (index: number, key: string, value: string) => {
    const updated = [...prescription.medicines];
    updated[index][key] = value;
    setPrescription((prev: any) => ({ ...prev, medicines: updated }));
  };

  const addMedicine = () => {
    setPrescription((prev: any) => ({
      ...prev,
      medicines: [...prev.medicines, { name: "", dosage: "", frequency: "", duration: "" }],
    }));
  };

  const removeMedicine = (index: number) => {
    const updated = prescription.medicines.filter((_: any, i: number) => i !== index);
    setPrescription((prev: any) => ({ ...prev, medicines: updated }));
  };

  const handleSubmit = async () => {
    try {
      await createPrescriptionApi(appointmentId, prescription);
      router.push(`/doctor/patient/${appointmentId}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen gap-6 p-6 bg-gray-900">
      <div className="w-1/2 bg-gray-800 text-white rounded-lg shadow-lg p-5 space-y-3 overflow-auto">
        <h2 className="text-xl font-bold border-b pb-1 mb-3">Create Prescription</h2>

        <input
          type="text"
          placeholder="Diagnosis"
          value={prescription.diagnosis}
          onChange={(e) => handleChange("diagnosis", e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
        />

        <textarea
          placeholder="Notes"
          value={prescription.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none text-sm h-16"
        />

        <textarea
          placeholder="Advice"
          value={prescription.advice}
          onChange={(e) => handleChange("advice", e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none text-sm h-16"
        />

        <div className="space-y-1">
          <span className="font-semibold text-cyan-400 text-sm">Medicines</span>
          {prescription.medicines.map((med: any, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Name"
                value={med.name}
                onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                className="flex-1 p-1.5 rounded bg-gray-700 text-white border border-gray-600 text-sm"
              />
              <input
                type="text"
                placeholder="Dosage"
                value={med.dosage}
                onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                className="w-20 p-1.5 rounded bg-gray-700 text-white border border-gray-600 text-sm"
              />
              <input
                type="text"
                placeholder="Frequency"
                value={med.frequency}
                onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                className="w-20 p-1.5 rounded bg-gray-700 text-white border border-gray-600 text-sm"
              />
              <input
                type="text"
                placeholder="Duration"
                value={med.duration}
                onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                className="w-20 p-1.5 rounded bg-gray-700 text-white border border-gray-600 text-sm"
              />
              <button onClick={() => removeMedicine(idx)} className="text-red-500 font-bold text-lg hover:text-red-600 transition">×</button>
            </div>
          ))}
          <button onClick={addMedicine} className="text-cyan-400 font-semibold mt-1 text-sm hover:underline">+ Add Medicine</button>
        </div>

        <input
          type="date"
          value={prescription.followUpDate}
          onChange={(e) => handleChange("followUpDate", e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded font-semibold text-sm transition"
        >
          Create Prescription
        </button>
      </div>

      <div className="bg-white max-w-xl w-full rounded-xl shadow-lg text-sm overflow-hidden">
        <div className="flex justify-between items-start rounded-t-xl bg-cyan-600 text-white px-4 py-3">
          <h1 className="text-lg font-bold text-white">Nalanda Hospital</h1>
          <div className="text-right">
            <h2 className="text-sm font-semibold underline text-white">{doctor?.name || "Dr. Name"}</h2>
            <p className="text-xs text-gray-200">{doctor?.qualification?.join(", ") || "MBBS"}</p>
            {doctor?.specialization && <p className="text-xs text-gray-200">{doctor.specialization}</p>}
          </div>
        </div>

        <div className="px-5 py-2 border-b border-gray-300 text-sm flex flex-wrap justify-between gap-2 text-black">
          <span><span className="font-semibold">Name:</span> {patient?.name || "—"}</span>
          <span><span className="font-semibold">Age:</span> {calculateAge(patient?.dob)}</span>
          <span><span className="font-semibold">Gender:</span> {patient?.gender || "—"}</span>
        </div>

        <h2 className="text-center text-sm font-semibold text-black my-2 tracking-widest">PRESCRIPTION</h2>

        <div className="px-5 mb-2">
          <p className="text-xs font-semibold text-black uppercase mb-1">Diagnosis</p>
          <p className="text-black min-h-[14px]">{prescription.diagnosis || "—"}</p>
        </div>

        <div className="text-lg font-bold text-cyan-900 px-5 mb-2">℞</div>

        <div className="px-5 mb-2">
          <div className="overflow-hidden rounded border border-gray-300">
            <table className="w-full text-xs">
              <thead className="bg-cyan-400 text-black">
                <tr className="text-left">
                  <th className="px-2 py-1 w-2/5">Name</th>
                  <th className="px-2 py-1 w-1/5">Dosage</th>
                  <th className="px-2 py-1 w-1/5">Frequency</th>
                  <th className="px-2 py-1 w-1/5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {prescription.medicines.map((med: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 font-medium text-black">{med.name || "—"}</td>
                    <td className="px-2 py-1 text-gray-700">{med.dosage || "—"}</td>
                    <td className="px-2 py-1 text-gray-700">{med.frequency || "—"}</td>
                    <td className="px-2 py-1 text-gray-700">{med.duration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-5 mb-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Notes</p>
          <p className="text-gray-700 min-h-[14px]">{prescription.notes || "—"}</p>
        </div>

        <div className="px-5 mb-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Advice</p>
          <p className="text-gray-700 min-h-[14px]">{prescription.advice || "—"}</p>
        </div>

        {prescription.followUpDate && (
          <div className="px-5 py-2 text-xs flex justify-between border-t border-gray-300">
            <span className="font-semibold text-gray-500">Follow-up:</span>
            <span className="text-cyan-700 font-medium">{new Date(prescription.followUpDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}