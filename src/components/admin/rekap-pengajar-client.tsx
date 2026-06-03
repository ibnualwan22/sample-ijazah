"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FileText, Search, User, Clock, Calendar } from "lucide-react";

type PengajarRecord = {
  id: string;
  pengajar: string;
  kelas: string;
  tanggal: string;
  sesi: string;
  materi: string;
  waktuMulai: string;
  waktuSelesai: string;
  status?: string;
  isBadal?: boolean;
  pengajarDigantikan?: string | null;
  atribut: {
    nametag: boolean;
    kopiah: boolean;
    bros: boolean;
  };
};

const HARI_OPTIONS = [
  { value: "ALL", label: "Semua Hari" },
  { value: "Senin", label: "Senin" },
  { value: "Selasa", label: "Selasa" },
  { value: "Rabu", label: "Rabu" },
  { value: "Kamis", label: "Kamis" },
  { value: "Jumat", label: "Jumat" },
  { value: "Sabtu", label: "Sabtu" },
  { value: "Minggu", label: "Minggu" },
];

export function RekapPengajarClient() {
  const searchParams = useSearchParams();
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  const [data, setData] = useState<PengajarRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHari, setFilterHari] = useState("ALL");
  const [filterKelas, setFilterKelas] = useState("ALL");
  const [filterPengajar, setFilterPengajar] = useState("ALL");

  useEffect(() => {
    if (!dari || !sampai) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ dari, sampai });
        const res = await fetch(`/api/admin/absensi/rekap/pengajar?${params}`);
        const result = await res.json();
        if (Array.isArray(result)) {
          setData(result);
        } else {
          setData([]);
        }
      } catch (e) {
        console.error("Gagal memuat rekap pengajar", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dari, sampai]);

  // Unique kelas dan pengajar untuk dropdown filter
  const uniqueKelas = useMemo(() => Array.from(new Set(data.map(d => d.kelas))).sort(), [data]);
  const uniquePengajar = useMemo(() => Array.from(new Set(data.map(d => d.pengajar))).sort(), [data]);

  // Grouped by Tanggal → pengajar rows
  const groupedData = useMemo(() => {
    const filtered = data.filter(d => {
      const matchSearch =
        d.pengajar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.kelas.toLowerCase().includes(searchQuery.toLowerCase());

      const hari = format(new Date(d.tanggal), "EEEE", { locale: id });
      const matchHari = filterHari === "ALL" || hari === filterHari;
      const matchKelas = filterKelas === "ALL" || d.kelas === filterKelas;
      const matchPengajar = filterPengajar === "ALL" || d.pengajar === filterPengajar;

      return matchSearch && matchHari && matchKelas && matchPengajar;
    });

    // Group by tanggal
    const groups: Record<string, PengajarRecord[]> = {};
    filtered.forEach(d => {
      if (!groups[d.tanggal]) groups[d.tanggal] = [];
      groups[d.tanggal].push(d);
    });

    return Object.keys(groups).sort().map(tgl => ({
      tanggal: tgl,
      records: groups[tgl].sort((a, b) => a.sesi.localeCompare(b.sesi) || a.pengajar.localeCompare(b.pengajar))
    }));
  }, [data, searchQuery, filterHari, filterKelas, filterPengajar]);

  if (!dari || !sampai) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[var(--color-surface-dark)]">
        <p className="font-bold text-[var(--color-text)]">Silakan pilih rentang tanggal atau Usbu&apos; terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="neu-card-white overflow-hidden flex flex-col">
        {/* Header + Filters */}
        <div className="p-6 border-b border-[var(--color-surface)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">Data Kehadiran Pengajar</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-medium">Dikelompokkan berdasarkan Hari/Tanggal</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-subtle)]" />
              <input
                type="text"
                placeholder="Cari pengajar/kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-secondary)] border border-[var(--color-surface-dark)] rounded-xl outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterHari}
              onChange={(e) => setFilterHari(e.target.value)}
              className="rounded-xl border border-[var(--color-surface-dark)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-violet-500"
            >
              {HARI_OPTIONS.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>

            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="rounded-xl border border-[var(--color-surface-dark)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-violet-500"
            >
              <option value="ALL">Semua Kelas</option>
              {uniqueKelas.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <select
              value={filterPengajar}
              onChange={(e) => setFilterPengajar(e.target.value)}
              className="rounded-xl border border-[var(--color-surface-dark)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-violet-500"
            >
              <option value="ALL">Semua Pengajar</option>
              {uniquePengajar.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {(filterHari !== "ALL" || filterKelas !== "ALL" || filterPengajar !== "ALL" || searchQuery) && (
              <button
                onClick={() => { setFilterHari("ALL"); setFilterKelas("ALL"); setFilterPengajar("ALL"); setSearchQuery(""); }}
                className="text-xs font-bold text-[var(--color-danger)] hover:text-[var(--color-danger)] transition"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
          </div>
        ) : groupedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <FileText className="h-10 w-10 text-[var(--color-text-subtle)] mb-4" />
            <p className="text-base font-bold text-[var(--color-text)]">Tidak ada data kehadiran</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">Belum ada absen pengajar pada periode yang dipilih.</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 bg-[var(--color-surface-light)] space-y-6">
            {groupedData.map((group) => (
              <div key={group.tanggal} className="bg-white border border-[var(--color-surface-dark)] rounded-2xl overflow-hidden shadow-sm">
                {/* Date Header */}
                <div className="bg-violet-50/50 p-4 border-b border-[var(--color-surface-dark)] flex items-center gap-3">
                  <div className="h-10 w-10 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--color-text)]">
                      {format(new Date(group.tanggal), "EEEE, d MMMM yyyy", { locale: id })}
                    </h4>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">{group.records.length} Sesi Mengajar</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--color-secondary)] border-b border-[var(--color-surface-dark)]">
                      <tr>
                        <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Pengajar</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Sesi</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Kelas</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] text-xs uppercase tracking-wider">Materi</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] text-xs uppercase tracking-wider text-center">Waktu</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-text-muted)] text-xs uppercase tracking-wider text-center">Atribut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-surface)]">
                      {group.records.map((r) => (
                        <tr key={r.id} className="hover:bg-[var(--color-surface-light)]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-bold text-[var(--color-text)]">{r.pengajar}</span>
                            </div>
                            {r.isBadal && (
                              <div className="mt-1 ml-9">
                                <span className="inline-flex items-center rounded-md bg-[var(--color-warning-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-warning)]">BADAL</span>
                                {r.pengajarDigantikan && <span className="ml-1 text-[10px] text-[var(--color-text-muted)] font-medium">menggantikan {r.pengajarDigantikan}</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-lg bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-text-muted)]">
                              {r.sesi.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--color-primary)]">{r.kelas}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate" title={r.materi}>
                            {r.status === "ALPHA" ? (
                              <span className="text-[var(--color-danger)] font-bold bg-[var(--color-danger-light)] px-2 py-1 rounded">{r.materi}</span>
                            ) : (
                              r.materi
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.status === "ALPHA" ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)] text-xs font-bold font-mono">
                                ALPHA
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] text-xs font-bold font-mono">
                                <Clock className="w-3.5 h-3.5" />
                                {r.waktuMulai} - {r.waktuSelesai}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.status === "ALPHA" ? (
                               <span className="text-rose-400 font-bold text-lg">-</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {r.atribut.kopiah ? <span className="bg-[var(--color-primary-100)] text-[var(--color-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded">Kopiah ✓</span> : <span className="bg-[var(--color-danger-light)] text-[var(--color-danger)] text-[10px] font-bold px-1.5 py-0.5 rounded">Kopiah X</span>}
                                {r.atribut.nametag ? <span className="bg-[var(--color-primary-100)] text-[var(--color-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded">Tag ✓</span> : <span className="bg-[var(--color-danger-light)] text-[var(--color-danger)] text-[10px] font-bold px-1.5 py-0.5 rounded">Tag X</span>}
                                {r.atribut.bros ? <span className="bg-[var(--color-primary-100)] text-[var(--color-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded">Bros ✓</span> : <span className="bg-[var(--color-danger-light)] text-[var(--color-danger)] text-[10px] font-bold px-1.5 py-0.5 rounded">Bros X</span>}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
