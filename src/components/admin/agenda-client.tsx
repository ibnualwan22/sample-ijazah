"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X, Clock, Repeat } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type TipePerulangan = "HARIAN" | "MINGGUAN" | "BULANAN" | null;

type Agenda = {
  id: string;
  judul: string;
  deskripsi: string | null;
  waktuMulai: string | Date; // Using ISO formats usually returned from JSON API
  waktuSelesai: string | Date;
  isBerulang: boolean;
  tipePerulangan: TipePerulangan;
  batasPerulangan: string | Date | null;
};

export function AgendaClient({ initialData }: { initialData: Agenda[] }) {
  const router = useRouter();
  const [data, setData] = useState<Agenda[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");
  const [isBerulang, setIsBerulang] = useState(false);
  const [tipePerulangan, setTipePerulangan] = useState<TipePerulangan>("MINGGUAN");
  const [batasPerulangan, setBatasPerulangan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (agenda?: Agenda) => {
    if (agenda) {
      setEditId(agenda.id);
      setJudul(agenda.judul);
      setDeskripsi(agenda.deskripsi || "");
      
      // format for datetime-local (YYYY-MM-DDThh:mm)
      const parseDt = (d: string | Date) => new Date(d).toISOString().slice(0, 16);
      setWaktuMulai(parseDt(agenda.waktuMulai));
      setWaktuSelesai(parseDt(agenda.waktuSelesai));
      
      setIsBerulang(agenda.isBerulang);
      setTipePerulangan(agenda.tipePerulangan || "MINGGUAN");
      setBatasPerulangan(agenda.batasPerulangan ? new Date(agenda.batasPerulangan).toISOString().slice(0, 10) : "");
    } else {
      setEditId(null);
      setJudul("");
      setDeskripsi("");
      const now = new Date();
      now.setMinutes(0);
      setWaktuMulai(now.toISOString().slice(0, 16));
      now.setHours(now.getHours() + 1);
      setWaktuSelesai(now.toISOString().slice(0, 16));
      setIsBerulang(false);
      setTipePerulangan("MINGGUAN");
      setBatasPerulangan("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      judul,
      deskripsi,
      waktuMulai: new Date(waktuMulai).toISOString(),
      waktuSelesai: new Date(waktuSelesai).toISOString(),
      isBerulang,
      tipePerulangan: isBerulang ? tipePerulangan : null,
      batasPerulangan: (isBerulang && batasPerulangan) ? new Date(batasPerulangan).toISOString() : null,
    };

    const method = editId ? "PUT" : "POST";
    const endpoint = editId ? `/api/admin/agenda/${editId}` : "/api/admin/agenda";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editId) {
          setData((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          setData((prev) => [saved, ...prev]);
        }
        closeModal();
        router.refresh();
      } else {
        alert("Gagal menyimpan data.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Beneran mau hapus agenda ini?")) return;
    try {
      const res = await fetch(`/api/admin/agenda/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      }
    } catch (err) {
      alert("Gagal menghapus.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)] shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tambah Agenda
        </button>
      </div>

      <div className="overflow-hidden neu-card-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-surface-dark)] text-left text-sm">
            <thead className="bg-[var(--color-secondary)] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4">Agenda</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pengulangan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface)] text-[var(--color-text)]">
              {data.map((agenda) => (
                <tr key={agenda.id} className="hover:bg-[var(--color-secondary)]/80 align-top">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[var(--color-text)]">{agenda.judul}</p>
                    {agenda.deskripsi && <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-2">{agenda.deskripsi}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-[var(--color-text-subtle)]" />
                      {format(new Date(agenda.waktuMulai), "dd MMM yyyy HH:mm", { locale: idLocale })}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 pl-6">
                      s/d {format(new Date(agenda.waktuSelesai), "HH:mm", { locale: idLocale })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {agenda.isBerulang ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 uppercase">
                        <Repeat className="w-3.5 h-3.5" />
                        {agenda.tipePerulangan}
                      </div>
                    ) : (
                      <span className="inline-block px-3 py-1 text-xs font-bold text-[var(--color-text-subtle)]">TIDAK</span>
                    )}
                    {(agenda.isBerulang && agenda.batasPerulangan) && (
                      <p className="text-[10px] text-[var(--color-text-subtle)] mt-1 uppercase font-semibold">
                        S/D {format(new Date(agenda.batasPerulangan), "dd MMM yyyy", { locale: idLocale })}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(agenda)} className="rounded-full bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary)]">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(agenda.id)} className="rounded-full bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">Belum ada agenda tersimpan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/50 p-4">
          <div className="w-full max-w-xl rounded-3xl neu-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-surface)] px-6 py-4 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
              <h3 className="font-bold text-[var(--color-text)] text-lg">{editId ? "Edit Agenda" : "Tambah Agenda"}</h3>
              <button onClick={closeModal} className="text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                <span>Judul Agenda / Kegiatan</span>
                <input
                  type="text" required value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white"
                />
              </label>

              <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                <span>Deskripsi Lanjutan (opsional)</span>
                <textarea
                  rows={3} value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                  <span>Waktu Mulai</span>
                  <input
                    type="datetime-local" required value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                  <span>Waktu Selesai</span>
                  <input
                    type="datetime-local" required value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-4">
                <label className="flex items-center gap-3 text-sm font-bold text-indigo-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBerulang}
                    onChange={(e) => setIsBerulang(e.target.checked)}
                    className="h-5 w-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  Agenda ini diulang secara rutin
                </label>

                {isBerulang && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-100/60">
                    <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                      <span>Tipe Pengulangan</span>
                      <select
                        value={tipePerulangan || ""}
                        onChange={(e) => setTipePerulangan(e.target.value as TipePerulangan)}
                        className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-white px-4 py-3 outline-none focus:border-indigo-500"
                      >
                        <option value="HARIAN">Setiap Hari</option>
                        <option value="MINGGUAN">Setiap Minggu</option>
                        <option value="BULANAN">Setiap Bulan</option>
                      </select>
                    </label>
                    <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                      <span>Batas Akhir (Opsional)</span>
                      <input
                        type="date" value={batasPerulangan}
                        onChange={(e) => setBatasPerulangan(e.target.value)}
                        className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-white px-4 py-3 outline-none focus:border-indigo-500"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--color-surface)]">
                <button type="button" onClick={closeModal} className="w-full rounded-full border border-[var(--color-surface-dark)] py-3 font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-secondary)]">Batal</button>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--color-primary)] py-3 font-bold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
