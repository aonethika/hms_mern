"use client";
import { useEffect, useState } from "react";
import { addVitalsApi } from "@/app/shared/api/appointments.api";

export default function VitalsModal({ appointmentId, vitals, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    bp: "",
    temp: ""
  });

  // ✅ prefill when editing
  useEffect(() => {
    if (vitals) {
      setForm({
        bp: vitals.bloodPressure || "",
        temp: vitals.temperature || ""
      });
    }
  }, [vitals]);

  const saveVitals = async () => {
    if (!form.bp.includes("/")) {
      alert("Invalid BP format");
      return;
    }

    try {
      await addVitalsApi(appointmentId, {
        bloodPressure: form.bp,
        temperature: form.temp
      });

      alert("Vitals saved");

      onSaved();   // 🔥 refresh parent
      onClose();
    } catch (err) {
      alert("Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">
          {vitals ? "Edit Vitals" : "Add Vitals"}
        </h2>

        <input
          placeholder="Blood Pressure (120/80)"
          className="bg-gray-800 p-2 w-full rounded"
          value={form.bp}
          onChange={(e) => setForm({ ...form, bp: e.target.value })}
        />

        <input
          placeholder="Temperature (98.6)"
          className="bg-gray-800 p-2 w-full rounded"
          value={form.temp}
          onChange={(e) => setForm({ ...form, temp: e.target.value })}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="bg-gray-700 w-full py-2 rounded">
            Cancel
          </button>

          <button onClick={saveVitals} className="bg-cyan-500 w-full py-2 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}