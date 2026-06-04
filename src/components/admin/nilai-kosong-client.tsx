"use client";

import React, { useState, useEffect, Fragment } from "react";
import Link from "next/link";

type MissingMapel = {
  mapelId: string;
  mapelNama: string;
  missingColumns: string[];
  currentValues: { u1: number | null; u2: number | null; n: number | null; a: number | null };
  jumlahTes: number;
};

type SantriMissing = {
  riwayatId: string;
  santriId: string;
  nama: string;
  missingMapels: MissingMapel[];
};

type MapelInfo = {
  id: string;
  nama_indo: string;
  jumlah_tes: number;
  bobot_usbu: number;
  bobot: number;
};

type KelasGroup = {
  kelasId: string;
  kelasNama: string;
  programId: string;
  programNama: string;
  mapelList: MapelInfo[];
  santriList: SantriMissing[];
};

type ApiResponse = {
  activeDufah: string;
  activeFlags: { u1: boolean; u2: boolean; u3: boolean };
  kelasGroups: KelasGroup[];
};

type ChangesMap = Record<string, Record<string, Partial<{ u1: number | null; u2: number | null; n: number | null; a: number | null }>>>;

export function NilaiKosongClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedKelas, setExpandedKelas] = useState<Set<string>>(new Set());
  const [filterKelas, setFilterKelas] = useState("ALL");
  const [filterNama, setFilterNama] = useState("");
  const [changes, setChanges] = useState<ChangesMap>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/nilai-kosong");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal memuat data");
      }
      const json: ApiResponse = await res.json();
      setData(json);
      // Auto-expand all groups
      setExpandedKelas(new Set(json.kelasGroups.map(g => g.kelasId)));
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKelas = (kelasId: string) => {
    setExpandedKelas(prev => {
      const next = new Set(prev);
      if (next.has(kelasId)) next.delete(kelasId); else next.add(kelasId);
      return next;
    });
  };

  const handleChange = (riwayatId: string, mapelId: string, field: string, value: number | null) => {
    setChanges(prev => ({
      ...prev,
      [riwayatId]: {
        ...prev[riwayatId],
        [mapelId]: { ...(prev[riwayatId]?.[mapelId] || {}), [field]: value },
      },
    }));
  };

  const getVal = (santri: SantriMissing, mapelId: string, field: string): number | null => {
    if (changes[santri.riwayatId]?.[mapelId]?.[field as keyof typeof changes[string][string]] !== undefined) {
      return changes[santri.riwayatId][mapelId][field as keyof typeof changes[string][string]] as number | null;
    }
    const mm = santri.missingMapels.find(m => m.mapelId === mapelId);
    return mm?.currentValues?.[field as keyof typeof mm.currentValues] ?? null;
  };

  const totalChanges = Object.values(changes).reduce((sum, rMap) => {
    return sum + Object.values(rMap).reduce((s2, mMap) => s2 + Object.keys(mMap).length, 0);
  }, 0);

  const handleSave = async () => {
    if (totalChanges === 0) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const updates = Object.entries(changes).map(([riwayatId, mapels]) => ({
        riwayatId,
        nilai: mapels,
      }));
      const res = await fetch("/api/admin/nilai-kosong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setSuccess("Berhasil menyimpan nilai.");
      setChanges({});
      fetchData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-[var(--color-text-muted)]">Memuat data nilai kosong...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="neu-card-white p-8 text-center space-y-3">
        <div className="h-12 w-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xl">!</div>
        <p className="text-sm font-medium text-rose-600">{error}</p>
        <button onClick={fetchData} className="text-sm font-bold text-[var(--color-primary)] underline">Coba Lagi</button>
      </div>
    );
  }

  if (!data) return null;

  const { activeFlags, kelasGroups, activeDufah } = data;

  // Apply filters
  const filteredGroups = kelasGroups
    .filter(g => filterKelas === "ALL" || g.kelasId === filterKelas)
    .map(g => ({
      ...g,
      santriList: filterNama
        ? g.santriList.filter(s => s.nama.toLowerCase().includes(filterNama.toLowerCase()))
        : g.santriList,
    }))
    .filter(g => g.santriList.length > 0);

  const totalSantri = filteredGroups.reduce((s, g) => s + g.santriList.length, 0);
  const totalMissing = filteredGroups.reduce((s, g) => s + g.santriList.reduce((s2, st) => s2 + st.missingMapels.length, 0), 0);

  // Active usbu label
  const usbuLabels: string[] = [];
  if (activeFlags.u1) usbuLabels.push("Usbu' 1");
  if (activeFlags.u2) usbuLabels.push("Usbu' 2");
  if (activeFlags.u3) usbuLabels.push("Nihai");

  const inputClass = "w-full rounded-lg border border-[var(--color-surface-dark)] bg-white px-2 py-1.5 text-center font-bold text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-emerald-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm";

  return (
    <div className="space-y-5">
      {/* Context bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {activeDufah}
        </span>
        {usbuLabels.map(l => (
          <span key={l} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{l} Aktif</span>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="neu-card-white p-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Santri Belum Lengkap</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{totalSantri}</p>
        </div>
        <div className="neu-card-white p-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Kelas Terdampak</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{filteredGroups.length}</p>
        </div>
        <div className="neu-card-white p-4 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Nilai Kosong</p>
          <p className="text-2xl font-black text-[var(--color-primary)] mt-1">{totalMissing}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="neu-card-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
            <span>Filter Kelas</span>
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="ALL">Semua Kelas ({kelasGroups.length})</option>
              {kelasGroups.map(g => (
                <option key={g.kelasId} value={g.kelasId}>{g.kelasNama} — {g.programNama} ({g.santriList.length})</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-[var(--color-text)]">
            <span>Cari Nama Santri</span>
            <input
              type="text"
              value={filterNama}
              onChange={e => setFilterNama(e.target.value)}
              placeholder="Ketik nama..."
              className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-2.5 text-sm font-bold outline-none transition focus:border-[var(--color-primary)] focus:bg-white placeholder:font-medium placeholder:text-[var(--color-text-subtle)]"
            />
          </label>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

      {/* Save button (sticky) */}
      {totalChanges > 0 && (
        <div className="sticky top-2 z-30">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
            <p className="text-sm font-bold text-amber-800">
              {totalChanges} perubahan belum disimpan
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-[var(--color-primary)] px-6 py-2 text-sm font-bold text-white shadow transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan Semua"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredGroups.length === 0 && (
        <div className="neu-card-white p-12 text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-black">✓</div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">Semua Nilai Sudah Lengkap!</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Tidak ada nilai kosong untuk Usbu' yang sedang aktif.</p>
        </div>
      )}

      {/* Kelas groups */}
      {filteredGroups.map(group => {
        const isExpanded = expandedKelas.has(group.kelasId);
        const missingCount = group.santriList.reduce((s, st) => s + st.missingMapels.length, 0);

        return (
          <div key={group.kelasId} className="neu-card-white overflow-hidden">
            {/* Header */}
            <div className="w-full flex items-center justify-between p-4 md:p-5 text-left transition hover:bg-[var(--color-secondary)]/50 cursor-pointer" onClick={() => toggleKelas(group.kelasId)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white font-black text-sm">
                  {group.santriList.length}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[var(--color-text)] truncate">{group.kelasNama}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{group.programNama} · {missingCount} nilai kosong</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = `*Laporan Nilai Kosong - ${activeDufah}*\nKelas: *${group.kelasNama}*\n\n${group.santriList.map((s, i) => 
                      `${i + 1}. *${s.nama}*\n${s.missingMapels.map(m => `   - ${m.mapelNama} (${m.missingColumns.map(c => c === "u3" ? "Nihai" : c === "akhir" ? "Akhir" : c.toUpperCase()).join(", ")})`).join("\n")}`
                    ).join("\n\n")}`;
                    navigator.clipboard.writeText(text);
                    const btn = e.currentTarget;
                    const origText = btn.innerHTML;
                    btn.innerHTML = `<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Tersalin!</span>`;
                    btn.classList.add("bg-emerald-100", "text-emerald-700", "border-emerald-200");
                    btn.classList.remove("bg-white", "text-[var(--color-text-muted)]");
                    setTimeout(() => {
                      btn.innerHTML = origText;
                      btn.classList.remove("bg-emerald-100", "text-emerald-700", "border-emerald-200");
                      btn.classList.add("bg-white", "text-[var(--color-text-muted)]");
                    }, 2000);
                  }}
                  className="hidden md:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-surface-dark)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-text-muted)] transition hover:bg-[var(--color-secondary)] hover:text-emerald-600 hover:border-emerald-200"
                  title="Copy format WhatsApp"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy WA
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleKelas(group.kelasId); }} className="p-1">
                  <svg className={`h-5 w-5 shrink-0 text-[var(--color-text-subtle)] transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>

            {/* Content */}
            {isExpanded && (
              <div className="border-t border-[var(--color-surface)]">
                {group.santriList.map((santri, idx) => (
                  <div key={santri.riwayatId} className={`border-b border-[var(--color-surface)] last:border-b-0 p-4 transition ${changes[santri.riwayatId] ? "bg-amber-50/40" : ""}`}>
                    {/* Santri header */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 h-7 w-7 rounded-lg bg-[var(--color-secondary)] flex items-center justify-center text-xs font-black text-[var(--color-text-subtle)]">{idx + 1}</span>
                        <span className="font-bold text-[var(--color-text)] text-sm truncate">{santri.nama}</span>
                        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">{santri.missingMapels.length} mapel</span>
                      </div>
                      <Link href={`/admin/input-nilai/${santri.riwayatId}`}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[var(--color-surface-dark)] bg-white px-3 py-1 text-[11px] font-bold text-[var(--color-text-muted)] transition hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                        Detail
                      </Link>
                    </div>
                    {/* Mapel inputs grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {santri.missingMapels.map(mm => (
                        <div key={mm.mapelId} className="flex items-center gap-2 rounded-xl border border-[var(--color-surface)] bg-[var(--color-secondary)]/50 px-3 py-2">
                          <span className="text-xs font-bold text-[var(--color-text)] min-w-[80px] shrink-0">{mm.mapelNama}</span>
                          <div className="flex items-center gap-1.5 flex-1">
                            {mm.jumlahTes === 3 ? (
                              <Fragment>
                                {mm.missingColumns.includes("u1") && (
                                  <div className="flex-1 min-w-0">
                                    <label className="text-[9px] font-semibold text-[var(--color-text-subtle)] block mb-0.5 text-center">U1</label>
                                    <input type="number" min={0} max={100}
                                      value={getVal(santri, mm.mapelId, "u1") ?? ""}
                                      onChange={e => handleChange(santri.riwayatId, mm.mapelId, "u1", e.target.value === "" ? null : Number(e.target.value))}
                                      className={inputClass} />
                                  </div>
                                )}
                                {mm.missingColumns.includes("u2") && (
                                  <div className="flex-1 min-w-0">
                                    <label className="text-[9px] font-semibold text-[var(--color-text-subtle)] block mb-0.5 text-center">U2</label>
                                    <input type="number" min={0} max={100}
                                      value={getVal(santri, mm.mapelId, "u2") ?? ""}
                                      onChange={e => handleChange(santri.riwayatId, mm.mapelId, "u2", e.target.value === "" ? null : Number(e.target.value))}
                                      className={inputClass} />
                                  </div>
                                )}
                                {mm.missingColumns.includes("u3") && (
                                  <div className="flex-1 min-w-0">
                                    <label className="text-[9px] font-semibold text-[var(--color-text-subtle)] block mb-0.5 text-center">Nihai</label>
                                    <input type="number" min={0} max={100}
                                      value={getVal(santri, mm.mapelId, "n") ?? ""}
                                      onChange={e => handleChange(santri.riwayatId, mm.mapelId, "n", e.target.value === "" ? null : Number(e.target.value))}
                                      className={inputClass} />
                                  </div>
                                )}
                              </Fragment>
                            ) : (
                              mm.missingColumns.includes("akhir") && (
                                <div className="flex-1 min-w-0">
                                  <label className="text-[9px] font-semibold text-[var(--color-text-subtle)] block mb-0.5 text-center">Akhir</label>
                                  <input type="number" min={0} max={100}
                                    value={getVal(santri, mm.mapelId, "a") ?? ""}
                                    onChange={e => handleChange(santri.riwayatId, mm.mapelId, "a", e.target.value === "" ? null : Number(e.target.value))}
                                    className={inputClass} />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom save button */}
      {totalChanges > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isSaving}
            className="rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
            {isSaving ? "Menyimpan..." : `Simpan ${totalChanges} Perubahan`}
          </button>
        </div>
      )}
    </div>
  );
}
