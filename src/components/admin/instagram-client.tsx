"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type InstagramPost = {
  id: string;
  judul: string | null;
  url: string;
  isActive: boolean;
  createdAt: Date;
};

export function InstagramClient({ initialData }: { initialData: InstagramPost[] }) {
  const router = useRouter();
  const [data, setData] = useState<InstagramPost[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [judul, setJudul] = useState("");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleOpenModal = (post?: InstagramPost) => {
    if (post) {
      setEditId(post.id);
      setJudul(post.judul || "");
      setUrl(post.url);
      setIsActive(post.isActive);
    } else {
      setEditId(null);
      setJudul("");
      setUrl("");
      setIsActive(true);
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

    const payload = { judul, url, isActive };
    const method = editId ? "PUT" : "POST";
    const endpoint = editId ? `/api/admin/instagram/${editId}` : "/api/admin/instagram";

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
    if (!confirm("Beneran mau hapus postingan ini?")) return;
    try {
      const res = await fetch(`/api/admin/instagram/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      }
    } catch (err) {
      alert("Gagal menghapus.");
    }
  };

  const handleSync = async () => {
    if (!confirm("Tarik data feed terbaru dari 3 Akun Official sekarang? (Ini akan mengecek URL baru via API)")) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        router.refresh(); // Segarkan tabel
      } else {
        alert(data.error || "Gagal melakukan sinkronisasi otomatis.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat mencoba menghubungi server.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-full border border-[var(--color-surface-dark)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--color-text)] transition hover:bg-[var(--color-secondary)] shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
          {isSyncing ? "Menyinkronkan..." : "Sync Otomatis (3 Akun)"}
        </button>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)] shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tambah Manual
        </button>
      </div>

      <div className="overflow-hidden neu-card-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-surface-dark)] text-left text-sm">
            <thead className="bg-[var(--color-secondary)] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4">Judul / Ket</th>
                <th className="px-6 py-4">URL</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Dibuat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface)] text-[var(--color-text)]">
              {data.map((post) => (
                <tr key={post.id} className="hover:bg-[var(--color-secondary)]/80 align-top">
                  <td className="px-6 py-4 font-semibold text-[var(--color-text)]">{post.judul || "-"}</td>
                  <td className="px-6 py-4">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline break-all block max-w-xs">
                      {post.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${post.isActive ? 'bg-[var(--color-primary-100)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                      {post.isActive ? "Aktif" : "Sembunyi"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)]">
                    {format(new Date(post.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(post)} className="rounded-full bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary)]">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="rounded-full bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">Belum ada konten tersimpan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/50 p-4">
          <div className="w-full max-w-md rounded-3xl neu-card">
            <div className="flex items-center justify-between border-b border-[var(--color-surface)] px-6 py-4">
              <h3 className="font-bold text-[var(--color-text)] text-lg">{editId ? "Edit Postingan" : "Tambah Postingan"}</h3>
              <button onClick={closeModal} className="text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                <span>Judul / Keterangan (opsional)</span>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white"
                  placeholder="Kajian Rutin..."
                />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
                <span>URL Postingan / Reels (wajib)</span>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:bg-white"
                  placeholder="https://instagram.com/p/..."
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-[var(--color-surface-dark)] text-[var(--color-primary)]"
                />
                Tampilkan di Aplikasi Mobile
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="w-full rounded-full border border-[var(--color-surface-dark)] py-3 font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-secondary)]">Batal</button>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-[var(--color-primary)] py-3 font-bold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
