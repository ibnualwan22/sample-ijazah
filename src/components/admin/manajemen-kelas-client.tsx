"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DashboardSantri = {
  id: string;
  nama: string;
  gender: string;
  lokasi: string;
  programNama: string;
  kelasNama: string;
  isAktif: boolean;
};

type ProgramItem = {
  id: string;
  nama_indo: string;
  nama_arab: string;
  kelasList: Array<{
    id: string;
    nama: string;
  }>;
};

export function ManajemenKelasClient({
  santriRows,
  programList,
}: {
  santriRows: DashboardSantri[];
  programList: ProgramItem[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSantriIds, setTargetSantriIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const filteredSantri = santriRows.filter((s) =>
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (selectedIds.size === filteredSantri.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSantri.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const assignBatch = async (santriIds: string[], kelasId: string) => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/manajemen-kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santriIds, kelasId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan kelas");
      } else {
        setSelectedIds(new Set());
        setIsModalOpen(false);
        setTargetSantriIds([]);
        router.refresh();
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem saat menyimpan kelas.");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (santriIds: string[]) => {
    setTargetSantriIds(santriIds);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTargetSantriIds([]);
  };

  const handleAssignFromModal = (kelasId: string) => {
    assignBatch(targetSantriIds, kelasId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Aksi Massal</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Atur Kelas Santri</h3>
          <p className="mt-1 text-sm text-slate-500">Pilih santri dari tabel, tentukan kelasnya, lalu simpan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal(Array.from(selectedIds))}
            disabled={isSaving || selectedIds.size === 0}
            className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Tetapkan Kelas ({selectedIds.size})
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    checked={
                      filteredSantri.length > 0 && selectedIds.size === filteredSantri.length
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-4">Santri</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Status / Program Saat Ini</th>
                <th className="px-6 py-4 w-64 text-right">Ubah Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredSantri.map((santri) => (
                <tr
                  key={santri.id}
                  className="align-middle hover:bg-slate-50/80 cursor-pointer transition-colors"
                  onClick={() => toggleOne(santri.id)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                      checked={selectedIds.has(santri.id)}
                      onChange={() => { }} // Controlled by row click
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{santri.nama}</p>
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">{santri.lokasi}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{santri.gender}</td>
                  <td className="px-6 py-4">
                    {santri.programNama !== "-" ? (
                      <div>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                          {santri.kelasNama !== "-" ? santri.kelasNama : "Belum di Set"}
                        </span>

                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-600">
                        Belum Ditempatkan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openModal([santri.id])}
                        disabled={isSaving}
                        className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
                      >
                        Edit Ruangan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSantri.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ditemukan ada santri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Pilih Ruangan Kelas</h3>
              <button onClick={closeModal} disabled={isSaving} className="text-slate-400 hover:text-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
              {programList.map(k => k.kelasList.length > 0 && (
                <div key={k.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-2.5 text-xs font-black tracking-widest uppercase text-slate-600 border-b border-slate-100">
                    {k.nama_indo}
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 bg-white">
                    {k.kelasList.map(nk => (
                      <button 
                        key={nk.id}
                        onClick={() => handleAssignFromModal(nk.id)}
                        disabled={isSaving}
                        className="flex items-center justify-center rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 active:scale-95"
                      >
                        {nk.nama}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {programList.every(k => k.kelasList.length === 0) && (
                <div className="text-center text-slate-500 py-6 text-sm">Belum ada ruangan yang dikonfigurasi. Buat ruangan di menu Master Data terlebih dahulu.</div>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end">
              <button 
                onClick={closeModal} 
                className="px-5 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
                disabled={isSaving}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
