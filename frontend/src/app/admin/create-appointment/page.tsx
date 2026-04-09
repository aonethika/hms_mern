"use client";
import {
  getAvailableDoctorsByDateAdmin,
  getPatientsByPhone,
  addPatientAdminApi
} from "@/app/shared/api/admin.api";
import {
  createAppointmentByAdminApi,
  generateTokenApi
} from "@/app/shared/api/appointments.api";
import useDepartmentStore from "@/app/shared/store/department.store";
import React, { useEffect, useMemo, useState } from "react";

const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function Page() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { departments, fetchDepartments } = useDepartmentStore();
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  const [showAddPatient, setShowAddPatient] = useState(false);

  const [form, setForm] = useState<any>({
    phone: "",
    name: "",
    gender: "",
    dob: "",
    email: "",
    bloodGroup: "",
    notes: "",
    doctorId: "",
    departmentId: ""
  });

  const [newPatient, setNewPatient] = useState<any>({
    name: "",
    phone: "",
    gender: "",
    dob: "",
    bloodGroup: ""
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      const res = await getAvailableDoctorsByDateAdmin(selectedDate);
      setDoctors(res?.data || []);
      setLoading(false);
    };
    fetchDoctors();
  }, [selectedDate]);

  const filteredDoctors = useMemo(() => {
    if (!departmentFilter) return doctors;
    return doctors.filter(
      (d: any) => d.departmentId?._id === departmentFilter
    );
  }, [doctors, departmentFilter]);

  const openModal = (doc: any) => {
    setSelectedDoctor(doc);
    setShowModal(true);
    setPatients([]);
    setSelectedPatient("");
    setForm({
      phone: "",
      name: "",
      gender: "",
      dob: "",
      email: "",
      bloodGroup: "",
      notes: "",
      doctorId: doc.doctorId || "",
      departmentId: doc.departmentId?._id || ""
    });
  };

  const handleSearch = async () => {
    if (!form.phone) return;
    const res = await getPatientsByPhone(form.phone);
    let results = res?.data || [];
    if (selectedPatient) {
      results = results.filter((p: any) => p._id !== selectedPatient);
    }
    setPatients(results);
  };

  const handleSelect = (p: any) => {
    setSelectedPatient(p._id);
    setPatients([]);
    setForm((prev: any) => ({
      ...prev,
      phone: p.phone || "",
      name: p.name || "",
      gender: p.gender || "",
      dob: p.dob ? p.dob.split("T")[0] : "",
      email: p.email || "",
      bloodGroup: p.bloodGroup || ""
    }));
  };

  const createPatient = async () => {
    const res = await addPatientAdminApi(newPatient);
    const p = res?.patient;

    const alreadyExists = patients.some(
      (p: any) =>
        p.name === newPatient.name &&
        p.dob === newPatient.dob
    );

    if (alreadyExists) {
      alert("Patient already exists. Please select from list.");
      return;
    }

    setSelectedPatient(p._id);
    setPatients([]);

    setForm((prev: any) => ({
      ...prev,
      phone: p.phone || "",
      name: p.name || "",
      gender: p.gender || "",
      dob: p.dob ? p.dob.split("T")[0] : "",
      email: p.email || "",
      bloodGroup: p.bloodGroup || ""
    }));

    setShowAddPatient(false);
    setNewPatient({
      name: "",
      phone: "",
      gender: "",
      dob: "",
      bloodGroup: ""
    });
  };

  const resetPatient = () => {
    setSelectedPatient("");
    setPatients([]);
    setForm((prev: any) => ({
      ...prev,
      name: "",
      gender: "",
      dob: "",
      email: "",
      bloodGroup: ""
    }));
  };

  const submit = async () => {
    if (!form.name || !form.phone || !form.gender || !form.dob) {
      alert("Fill required fields");
      return;
    }

    let patientType: "walk-in" | "register" | "registered" = "walk-in";

    if (selectedPatient && form.email) patientType = "registered";
    else if (form.email) patientType = "register";

    const res = await createAppointmentByAdminApi({
      patientType,
      patientId: selectedPatient || undefined,
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      gender: form.gender,
      dob: form.dob,
      bloodGroup: form.bloodGroup || undefined,
      doctorId: form.doctorId,
      departmentId: form.departmentId,
      notes: form.notes,
      source: "walk-in",
      date: selectedDate
    });

    const appointment = res.appointment;

    if (selectedDate === getToday()) {
      await generateTokenApi(appointment._id);
    }

    alert("Appointment booked successfully");
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 space-y-6">
      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        />

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="bg-gray-800 p-2 rounded"
        >
          <option value="">All Departments</option>
          {departments.map((d: any) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : (
          filteredDoctors.map((doc: any) => (
            <div key={doc.doctorId} className="bg-gray-900 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{doc.doctorName}</p>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.status?.toLowerCase() === "available"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              <p className="text-sm text-gray-400">{doc.departmentName}</p>

              <button
                onClick={() => openModal(doc)}
                className="bg-cyan-500 w-full mt-2 py-2 rounded"
              >
                Book Appointment
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-3xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex gap-2">
              <input
                placeholder="Phone"
                value={form.phone}
                disabled={!!selectedPatient}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="bg-gray-800 p-2 w-full rounded"
              />
              <button
                onClick={handleSearch}
                disabled={!!selectedPatient}
                className="bg-cyan-500 px-4 rounded disabled:opacity-50"
              >
                Search
              </button>
            </div>

            {patients.length > 0 && (
              <div className="bg-gray-800 p-2 rounded space-y-2">
                {patients.map((p: any) => (
                  <div
                    key={p._id}
                    onClick={() => handleSelect(p)}
                    className="p-2 bg-gray-700 rounded cursor-pointer"
                  >
                    {p.name}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setShowAddPatient(true);
                    setNewPatient((prev: any) => ({
                      ...prev,
                      phone: form.phone
                    }));
                  }}
                  className="bg-gray-700 w-full py-2 rounded"
                >
                  + Add New Patient
                </button>
              </div>
            )}

            {selectedPatient && (
              <button
                onClick={resetPatient}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Change Patient
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Name"
                className="bg-gray-800 p-2 rounded"
              />
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value })
                }
                className="bg-gray-800 p-2 rounded"
              >
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input
                type="date"
                value={form.dob}
                onChange={(e) =>
                  setForm({ ...form, dob: e.target.value })
                }
                className="bg-gray-800 p-2 rounded"
              />
              <input
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Email"
                className="bg-gray-800 p-2 rounded"
              />
              <input
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value })
                }
                placeholder="Blood Group"
                className="bg-gray-800 p-2 rounded"
              />
              <input
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Notes"
                className="bg-gray-800 p-2 rounded col-span-2"
              />
            </div>

            <div className="bg-gray-800 p-3 rounded">
              <p>{selectedDoctor?.doctorName}</p>
              <p className="text-sm text-gray-400">
                {selectedDoctor?.departmentName}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-700 w-full py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={submit}
                className="bg-green-500 w-full py-2 rounded"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPatient && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md space-y-3">
            <input
              value={newPatient.name}
              onChange={(e) =>
                setNewPatient({ ...newPatient, name: e.target.value })
              }
              placeholder="Name"
              className="bg-gray-800 p-2 w-full rounded"
            />
            <input
              value={newPatient.phone}
              onChange={(e) =>
                setNewPatient({ ...newPatient, phone: e.target.value })
              }
              className="bg-gray-800 p-2 w-full rounded"
            />
            <input
              type="date"
              value={newPatient.dob}
              onChange={(e) =>
                setNewPatient({ ...newPatient, dob: e.target.value })
              }
              className="bg-gray-800 p-2 w-full rounded"
            />
            <select
              value={newPatient.gender}
              onChange={(e) =>
                setNewPatient({ ...newPatient, gender: e.target.value })
              }
              className="bg-gray-800 p-2 w-full rounded"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              value={newPatient.bloodGroup}
              onChange={(e) =>
                setNewPatient({
                  ...newPatient,
                  bloodGroup: e.target.value
                })
              }
              placeholder="Blood Group"
              className="bg-gray-800 p-2 w-full rounded"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddPatient(false)}
                className="bg-gray-700 w-full py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createPatient}
                className="bg-cyan-500 w-full py-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}