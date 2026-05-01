"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPrescriptionMedicinesApi,
  dispenseMedicineApi,
  generateBillApi,
  payBillApi,
} from "@/app/shared/api/pharmacy.api";

export default function Page() {
  const params = useParams();
  const prescriptionId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  const [payAmount, setPayAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPrescriptionMedicinesApi(prescriptionId);
      const prescription = res?.data || res;

      setData(prescription);
      setBill(prescription?.bill || null);

      setMedicines(
        (prescription?.medicines || []).map((m: any) => ({
          ...m,
          quantity: m.quantity || 0,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prescriptionId) fetchData();
  }, [prescriptionId]);

  const updateQty = (index: number, value: number) => {
    const updated = [...medicines];
    updated[index].quantity = Math.max(0, value);
    setMedicines(updated);
  };

  const dispense = async (medicineId: string, quantity: number) => {
    try {
      setDispensingId(medicineId);
      await dispenseMedicineApi(prescriptionId, medicineId, quantity);
      await fetchData();
    } finally {
      setDispensingId(null);
    }
  };

  const generateBill = async () => {
    const res = await generateBillApi(prescriptionId);
    setBill(res.prescription.bill);
  };

  const confirmPayment = async () => {
    try {
      setPaying(true);
      await payBillApi(prescriptionId, selectedAmount);

      setShowModal(false);
      setPayAmount(0);
      setSelectedAmount(0);

      await fetchData();
    } catch {
      alert("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="p-6 text-white bg-gray-950 min-h-screen">Loading...</div>;
  }

  const due = bill ? bill.totalAmount - (bill.paidAmount || 0) : 0;
  const isFullyPaid = due <= 0;

  return (
    <div className="p-6 bg-gray-950 min-h-screen text-white">

      {/* NORMAL UI */}
      <div className="no-print">
        <h1 className="text-2xl text-cyan-400 mb-4">Pharmacy</h1>
        <p>Patient: {data?.patient?.name}</p>
        <p>Doctor: {data?.doctor?.name}</p>

        {/* MED TABLE */}
        <table className="w-full mt-4 border text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="p-2">Medicine</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{m.name}</td>
                <td className="p-2 text-cyan-400">{m.availableStock}</td>
                <td className="p-2">
                  <input
                    type="number"
                    value={m.quantity}
                    onChange={(e) =>
                      updateQty(i, parseFloat(e.target.value) || 0)
                    }
                    className="w-16 bg-black border p-1"
                  />
                </td>
                <td className="p-2">
                  <button
                    disabled={m.quantity <= 0}
                    onClick={() =>
                      dispense(m.medicineId, m.quantity)
                    }
                    className="bg-cyan-600 px-2 py-1 rounded"
                  >
                    Dispense
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!bill && (
          <button
            onClick={generateBill}
            className="mt-4 bg-cyan-600 px-4 py-2 rounded"
          >
            Generate Bill
          </button>
        )}
      </div>

      {/* BILL */}
      {bill && (
        <div className="print-only flex justify-center mt-8">
          <div className="w-[380px] bg-white text-black p-6 text-sm">

            <div className="text-center mb-3">
              <h2 className="font-bold">HOSPITAL NAME</h2>
              <p className="text-xs">Calicut</p>
            </div>

            <div className="border-y py-2 mb-3">
              <p>Patient: {data?.patient?.name}</p>
              <p>Doctor: {data?.doctor?.name}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>

            {medicines
              .filter(m => (m.dispensedCount || m.quantity) > 0)
              .map((m, i) => {
                const qty = m.dispensedCount || m.quantity;
                const price = m.price || 0;

                return (
                  <div key={i} className="flex justify-between mb-1">
                    <div>
                      <p>{m.name}</p>
                      <p className="text-xs">{qty} × ₹{price}</p>
                    </div>
                    <p>₹{qty * price}</p>
                  </div>
                );
              })}

            <div className="border-t mt-3 pt-2">
              <div className="flex justify-between">
                <span>Total</span>
                <span>₹{bill.totalAmount}</span>
              </div>

              <div className="flex justify-between">
                <span>Paid</span>
                <span>₹{bill.paidAmount || 0}</span>
              </div>

              <div className="flex justify-between">
                <span>Due</span>
                <span>₹{due}</span>
              </div>

              <div className="text-center text-xs mt-2">
                Status: {bill.paymentStatus}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="no-print mt-4 flex gap-2 justify-center">

              <input
                type="number"
                placeholder="Amount"
                value={payAmount}
                onChange={(e) =>
                  setPayAmount(parseFloat(e.target.value) || 0)
                }
                className="border p-1 w-24"
                disabled={isFullyPaid}
              />

              <button
                disabled={isFullyPaid}
                onClick={() => {
                  if (!payAmount || payAmount <= 0)
                    return alert("Enter valid amount");
                  if (payAmount > due)
                    return alert("Amount exceeds due");

                  setSelectedAmount(payAmount);
                  setShowModal(true);
                }}
                className="bg-green-600 px-2 py-1 text-white rounded"
              >
                Pay
              </button>

              <button
                disabled={isFullyPaid}
                onClick={() => {
                  setSelectedAmount(due);
                  setShowModal(true);
                }}
                className="bg-blue-600 px-2 py-1 text-white rounded"
              >
                Pay Full
              </button>

              <button
                onClick={handlePrint}
                className="bg-cyan-600 px-2 py-1 text-white rounded"
              >
                Print
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 no-print">
          <div className="bg-white text-black p-6 rounded w-80 text-center">
            <h2 className="text-lg font-semibold mb-3">
              Confirm Payment
            </h2>

            <p className="mb-4">
              Pay ₹{selectedAmount} ?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="border px-3 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmPayment}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                {paying ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}