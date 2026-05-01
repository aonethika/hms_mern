"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBillApi, payBillApi } from "@/app/shared/api/pharmacy.api";

export default function BillViewPage() {
  const params = useParams();
  const prescriptionId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [payAmount, setPayAmount] = useState<number>(0);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const res = await getBillApi(prescriptionId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prescriptionId) fetchBill();
  }, [prescriptionId]);

  const confirmPayment = async () => {
    try {
      setPaying(true);

      await payBillApi(prescriptionId, selectedAmount);

      setShowModal(false);
      setPayAmount(0);
      setSelectedAmount(0);

      await fetchBill();
    } catch (err) {
      alert("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading || !data) {
    return <div className="p-6">Loading...</div>;
  }

  const { bill, patient, doctor, medicines } = data;

  const due = bill.totalAmount - (bill.paidAmount || 0);
  const isFullyPaid = due <= 0;

  return (
    <div className="flex justify-center p-6 bg-gray-100 min-h-screen">

      {/* ================= BILL ================= */}
      <div className="w-[380px] bg-white text-black p-6 text-sm shadow print:shadow-none">

        {/* HEADER */}
        <div className="text-center mb-3">
          <h2 className="font-bold text-lg">HOSPITAL NAME</h2>
          <p className="text-xs">Calicut</p>
        </div>

        <div className="border-y py-2 mb-3">
          <p>Patient: {patient?.name}</p>
          <p>Phone: {patient?.phone}</p>
          <p>Doctor: {doctor?.name}</p>
          <p>Date: {new Date(bill?.billedAt).toLocaleDateString()}</p>
        </div>

        {/* ITEMS */}
        {medicines
          ?.filter((m: any) => m.dispensedCount > 0)
          .map((m: any, i: number) => {
            const qty = m.dispensedCount;
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

        {/* TOTAL */}
        <div className="border-t mt-3 pt-2">
          <div className="flex justify-between">
            <span>Doctor Fee</span>
            <span>₹{bill.doctorFee}</span>
          </div>

          <div className="flex justify-between">
            <span>Medicines</span>
            <span>₹{bill.medicineTotal}</span>
          </div>

          <div className="flex justify-between font-bold border-t mt-2 pt-2">
            <span>Total</span>
            <span>₹{bill.totalAmount}</span>
          </div>

          <div className="flex justify-between mt-1">
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

        {/* ================= ACTIONS ================= */}
        <div className="no-print mt-4 flex flex-col gap-2">

          <div className="flex gap-2 justify-center">
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
          </div>

          <button
            onClick={handlePrint}
            className="bg-cyan-600 text-white py-2 rounded"
          >
            Print
          </button>

        </div>
      </div>

      {/* ================= MODAL ================= */}
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

      {/* ================= PRINT ================= */}
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