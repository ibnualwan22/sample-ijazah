"use client";

import { useState, useEffect } from "react";
import { Clock, Save, Loader2, Edit3, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type JadwalSesi = {
  id: string;
  sesi: string;
  label: string;
  jamBuka: string;
  jamTutup: string;
  toleransiMenit: number;
  isActive: boolean;
};

export default function JadwalSesiPage() {
  const [jadwalList, setJadwalList] = useState<JadwalSesi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalSesi | null>(null);

  const fetchJadwal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/jadwal-sesi");
      if (!res.ok) throw new Error("Gagal mengambil data jadwal");
      const data = await res.json();
      setJadwalList(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const handleEdit = (jadwal: JadwalSesi) => {
    setEditingJadwal({ ...jadwal });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJadwal) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/jadwal-sesi/${editingJadwal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingJadwal)
      });
      if (!res.ok) throw new Error("Gagal menyimpan jadwal");
      toast.success("Jadwal sesi berhasil diperbarui!");
      setIsModalOpen(false);
      fetchJadwal();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Clock className="h-6 w-6 text-[var(--color-primary)]" />
            Jadwal Buka/Tutup Sesi
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Atur jam buka, jam tutup, dan waktu toleransi absensi untuk tiap sesi kelas.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-surface-dark)] overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-text-muted)] uppercase bg-[var(--color-secondary)]/50 border-b border-[var(--color-surface-dark)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Sesi</th>
                  <th className="px-6 py-4 font-semibold">Label</th>
                  <th className="px-6 py-4 font-semibold">Jam Buka</th>
                  <th className="px-6 py-4 font-semibold">Jam Tutup</th>
                  <th className="px-6 py-4 font-semibold">Toleransi</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jadwalList.map((jadwal) => (
                  <tr key={jadwal.id} className="hover:bg-[var(--color-secondary)]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--color-text)]">{jadwal.sesi}</td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)]">{jadwal.label}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-[var(--color-primary)] bg-[var(--color-primary-50)]/30">{jadwal.jamBuka}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-rose-700 bg-rose-50/30">{jadwal.jamTutup}</td>
                    <td className="px-6 py-4">{jadwal.toleransiMenit} Menit</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${jadwal.isActive ? 'bg-[var(--color-primary-100)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                        {jadwal.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(jadwal)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {jadwalList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[var(--color-text-muted)]">Belum ada data jadwal sesi</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && editingJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-surface)] flex justify-between items-center bg-[var(--color-secondary)]/50">
              <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--color-primary)]" />
                Edit Jadwal {editingJadwal.label}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)] mb-1">Jam Buka</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={editingJadwal.jamBuka.split(':')[0]}
                      onChange={(e) => setEditingJadwal({ ...editingJadwal, jamBuka: `${e.target.value}:${editingJadwal.jamBuka.split(':')[1] || '00'}` })}
                      className="w-full px-3 py-2 border border-[var(--color-surface-dark)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-center font-mono"
                    >
                      {Array.from({length: 24}).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="font-bold text-[var(--color-text-subtle)]">:</span>
                    <select
                      value={editingJadwal.jamBuka.split(':')[1] || '00'}
                      onChange={(e) => setEditingJadwal({ ...editingJadwal, jamBuka: `${editingJadwal.jamBuka.split(':')[0] || '00'}:${e.target.value}` })}
                      className="w-full px-3 py-2 border border-[var(--color-surface-dark)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-center font-mono"
                    >
                      {Array.from({length: 60}).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text)] mb-1">Jam Tutup</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={editingJadwal.jamTutup.split(':')[0]}
                      onChange={(e) => setEditingJadwal({ ...editingJadwal, jamTutup: `${e.target.value}:${editingJadwal.jamTutup.split(':')[1] || '00'}` })}
                      className="w-full px-3 py-2 border border-[var(--color-surface-dark)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-center font-mono"
                    >
                      {Array.from({length: 24}).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="font-bold text-[var(--color-text-subtle)]">:</span>
                    <select
                      value={editingJadwal.jamTutup.split(':')[1] || '00'}
                      onChange={(e) => setEditingJadwal({ ...editingJadwal, jamTutup: `${editingJadwal.jamTutup.split(':')[0] || '00'}:${e.target.value}` })}
                      className="w-full px-3 py-2 border border-[var(--color-surface-dark)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-center font-mono"
                    >
                      {Array.from({length: 60}).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">Toleransi Terlambat (Menit)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingJadwal.toleransiMenit}
                  onChange={(e) => setEditingJadwal({ ...editingJadwal, toleransiMenit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[var(--color-surface-dark)] rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingJadwal.isActive}
                  onChange={(e) => setEditingJadwal({ ...editingJadwal, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-[var(--color-primary)] focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-[var(--color-text)]">Sesi Aktif</label>
              </div>

              <div className="pt-4 border-t border-[var(--color-surface)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
