"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllMedicines,
  createMdicines,
  addStockApi,
} from "@/app/shared/api/pharmacy.api";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  const [selectedMed, setSelectedMed] = useState<any>(null);

  const [newMed, setNewMed] = useState({
    name: "",
    price: "",
    stock: "",
  });

  const [stockQty, setStockQty] = useState("");

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await getAllMedicines();
      setMedicines(res?.medicines || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // 🔍 SEARCH FILTER
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [medicines, search]);

  // ✅ CREATE MEDICINE
  const handleCreate = async () => {
    if (!newMed.name || Number(newMed.price) <= 0) {
      return alert("Enter valid details");
    }

    await createMdicines({
      name: newMed.name,
      price: Number(newMed.price),
      stock: Number(newMed.stock) || 0,
    });

    setShowAddModal(false);
    setNewMed({ name: "", price: "", stock: "" });

    fetchMedicines();
  };

  // ✅ ADD STOCK
  const handleAddStock = async () => {
    if (!stockQty || Number(stockQty) <= 0) {
      return alert("Enter valid quantity");
    }

    await addStockApi(selectedMed.id, Number(stockQty));

    setShowStockModal(false);
    setStockQty("");
    setSelectedMed(null);

    fetchMedicines();
  };

  if (loading) {
    return <div className="p-6 bg-gray-950 text-white">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-950 min-h-screen text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-cyan-400">Medicines</h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-600 px-4 py-2 rounded"
        >
          + Add Medicine
        </button>
      </div>

      {/* 🔍 SEARCH */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded bg-black border border-gray-700"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-800 text-sm">

          <thead className="bg-gray-900">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Stock</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredMedicines.map((m) => (
              <tr key={m.id} className="border-t border-gray-800">

                <td className="p-2">{m.name}</td>
                <td className="p-2">₹{m.price}</td>

                <td className="p-2">
                  <span className="text-cyan-400 font-medium">
                    {m.stock}
                  </span>
                </td>

                <td className="p-2">
                  <button
                    onClick={() => {
                      setSelectedMed(m);
                      setShowStockModal(true);
                    }}
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    Add Stock
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

        {filteredMedicines.length === 0 && (
          <p className="text-gray-400 mt-4">No medicines found</p>
        )}
      </div>

      {/* ================= ADD MEDICINE MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white text-black p-6 rounded w-80">
            <h2 className="text-lg font-semibold mb-4">
              Add Medicine
            </h2>

            <input
              type="text"
              placeholder="Medicine name"
              value={newMed.name}
              onChange={(e) =>
                setNewMed({ ...newMed, name: e.target.value })
              }
              className="w-full border p-2 mb-2"
            />

            <input
              type="number"
              placeholder="Price"
              value={newMed.price}
              onChange={(e) =>
                setNewMed({
                  ...newMed,
                  price: e.target.value,
                })
              }
              className="w-full border p-2 mb-2"
            />

            <input
              type="number"
              placeholder="Initial stock (optional)"
              value={newMed.stock}
              onChange={(e) =>
                setNewMed({
                  ...newMed,
                  stock: e.target.value,
                })
              }
              className="w-full border p-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="border px-3 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                className="bg-cyan-600 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD STOCK MODAL ================= */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white text-black p-6 rounded w-80">
            <h2 className="text-lg font-semibold mb-3">
              Add Stock
            </h2>

            <p className="mb-2 font-medium">{selectedMed?.name}</p>

            <input
              type="number"
              placeholder="Enter quantity"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full border p-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStockModal(false)}
                className="border px-3 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleAddStock}
                className="bg-green-600 text-white px-3 py-1 rounded"
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