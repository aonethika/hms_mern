"use client";

import { useState, useEffect } from "react";
import {
  getAvailableDoctorsByDatePatient,
  getDoctorSlots,
  createAppointmentPatientApi,
} from "@/app/shared/api/patient.api";
import useDepartmentStore from "@/app/shared/store/department.store";
import useAuthStore from "@/app/shared/store/auth.store";

export default function DoctorsByDatePage() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [selectedDept, setSelectedDept] = useState("all");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [booking, setBooking] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    bloodGroup: "",
  });

  const { departments, fetchDepartments } = useDepartmentStore();
  const { selectedPatient } = useAuthStore();

  // Fetch doctors available on selected date
  const fetchDoctors = async (selectedDate: string) => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const res = await getAvailableDoctorsByDatePatient(selectedDate);
      setDoctors(res?.data || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Open modal and fetch slots for selected doctor
  const openModal = async (doc: any) => {
    setSelectedDoctor(doc);
    setOpen(true);

    if (selectedPatient) {
      setForm({
        name: selectedPatient.name || "",
        email: selectedPatient.userId?.email || "",
        phone: selectedPatient.userId?.phone || "",
        gender: selectedPatient.gender || "",
        dob: selectedPatient?.dob
          ? new Date(selectedPatient.dob).toISOString().split("T")[0]
          : "",
        bloodGroup: selectedPatient.bloodGroup || "",
      });
    }

    const res = await getDoctorSlots(doc.doctorId, date);
    setSlots(res?.slots || []);
  };

  // Book appointment
  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot || !selectedPatient?._id) {
      alert("Missing required data");
      return;
    }

    setBooking(true);
    try {
      const res = await createAppointmentPatientApi({
        patientId: selectedPatient._id,
        doctorId: selectedDoctor.doctorId,
        departmentId: selectedDoctor.departmentId,
        date,
        time: selectedSlot,
        tokenType: "booked",
        source: "online",
      });

      if (res?.success) {
        alert("Appointment booked successfully");
        setOpen(false);
        setSelectedSlot("");
      } else {
        alert(res?.message || "Booking failed");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Something went wrong");
    } finally {
      setBooking(false);
    }
  };

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch doctors whenever date changes
  useEffect(() => {
    fetchDoctors(date);
  }, [date]);

  // Filter doctors by selected department
  const filteredDoctors =
    selectedDept === "all"
      ? doctors
      : doctors.filter((d) => d.specialization === selectedDept);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-6 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Date & Department Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500 w-full sm:w-auto"
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl focus:ring-2 focus:ring-cyan-500 w-full sm:w-auto"
            >
              <option value="all">All Departments</option>
              {departments.map((dep) => (
                <option key={dep._id} value={dep.name}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && <div className="text-cyan-400 mb-4">Loading...</div>}

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.doctorId}
              className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col justify-between h-full"
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-cyan-400">
                  {doc.doctorName}
                </h2>
                <p className="text-gray-300 text-sm">{doc.specialization}</p>
                <p className="text-gray-500 text-sm">
                  {doc.qualifications?.join(", ")}
                </p>
              </div>

              <div className="flex justify-between items-center mt-auto">
                <span className="text-sm">₹{doc.consultationFee}</span>
                <button
                  onClick={() => openModal(doc)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg transition"
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Appointment Modal */}
        {open && selectedPatient && (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-gray-800 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">

              <h2 className="text-xl font-semibold text-cyan-400">
                Confirm Appointment
              </h2>

              {/* Patient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries(form).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-gray-400 capitalize">{key}</label>
                    <input
                      value={value}
                      readOnly
                      className="w-full bg-gray-800 p-2 rounded mt-1"
                    />
                  </div>
                ))}
              </div>

              {/* Appointment Info */}
              <div className="text-sm text-gray-400">
                <p>Date: {date}</p>
                <p>Doctor: {selectedDoctor?.doctorName}</p>
              </div>

              {/* Slots Selection */}
              <div>
                <p className="text-gray-400 mb-2">Select Slot</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map((slot, i) => {
                    const time = slot?.time || "";
                    const isFull = slot?.bookings >= 3;

                    return (
                      <button
                        key={time + i}
                        disabled={isFull}
                        onClick={() => setSelectedSlot(time)}
                        className={`px-2 py-1 rounded-lg text-sm w-full sm:w-auto ${
                          selectedSlot === time
                            ? "bg-cyan-500 text-black"
                            : isFull
                            ? "bg-gray-800 opacity-50 cursor-not-allowed"
                            : "bg-gray-800"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleBook}
                  disabled={booking || !selectedSlot}
                  className="px-4 py-2 bg-cyan-500 text-black rounded-lg"
                >
                  {booking ? "Booking..." : "Confirm"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}