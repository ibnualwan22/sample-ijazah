"use client";

import { useState } from "react";
import Link from "next/link";

type StatusKelulusan = "LULUS" | "TIDAK_LULUS" | "MUSYAROKAH";

type DashboardSantri = {
  id: string;
  nama: string;
  gender: string;
  lokasi: string;
  programNama: string;
  programId: string | null;
  kelasNama: string;
  kelasId: string | null;
  statusKelulusan: StatusKelulusan;
  isTasmi: boolean;
  canPrintSyahadah: boolean;
  canViewIjazah: boolean;
  isAktif: boolean;
};

type ProgramItem = {
  id: string;
  nama_indo: string;
  kelasList: Array<{
    id: string;
    nama: string;
  }>;
};

function statusClass(status: string) {
  if (status === "LULUS") return "bg-[var(--color-primary-100)] text-[var(--color-primary)]";
  if (status === "MUSYAROKAH") return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  return "bg-[var(--color-danger-light)] text-[var(--color-danger)]";
}

export function SyahadahClient({
  santriRows,
  programList,
}: {
  santriRows: DashboardSantri[];
  programList: ProgramItem[];
}) {
  const [filterKelasId, setFilterKelasId] = useState<string>("ALL");

  const allOptions = [
    { id: "ALL", label: "Semua Santri", group: "" },
    ...programList.flatMap((program) =>
      program.kelasList.length > 0
        ? program.kelasList.map((k) => ({ id: k.id, label: k.nama, group: program.nama_indo }))
        : [{ id: `PROGRAM_${program.id}`, label: program.nama_indo, group: "Program" }]
    ),
    { id: "UNASSIGNED", label: "Belum Ditempatkan", group: "" },
  ];

  const filteredSantri = santriRows.filter((santri) => {
    if (filterKelasId === "ALL") return true;
    if (filterKelasId === "UNASSIGNED") return santri.programId === null;
    if (filterKelasId.startsWith("PROGRAM_")) {
      const programId = filterKelasId.replace("PROGRAM_", "");
      return santri.programId === programId;
    }
    return santri.kelasId === filterKelasId;
  });

  const totalTasmi = filteredSantri.filter((santri) => santri.isTasmi).length;
  const totalSiapCetak = filteredSantri.filter((santri) => santri.canPrintSyahadah).length;
  const selectedLabel = allOptions.find((o) => o.id === filterKelasId)?.label ?? "Semua Santri";
  const selectedCount = filteredSantri.length;

  return (
    <div className="space-y-6">
      {/* Filter + Summary Row */}
      <section className="overflow-hidden neu-card-white">
        <div className="flex flex-col gap-4 border-b border-[var(--color-surface-dark)] px-6 py-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            {/* Dropdown Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Filter Kelas / Ruangan
              </label>
              <select
                value={filterKelasId}
                onChange={(e) => setFilterKelasId(e.target.value)}
                className="rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              >
                {allOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.group ? `${opt.group} — ${opt.label}` : opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Stats */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-2xl bg-[var(--color-surface)] px-3 py-1.5 font-semibold text-[var(--color-text)]">
                {selectedCount} santri
              </span>
              <span className="rounded-2xl bg-[var(--color-primary-50)] px-3 py-1.5 font-semibold text-[var(--color-primary)]">
                {totalTasmi} Tasmi&apos;
              </span>
              <span className="rounded-2xl bg-[var(--color-warning-light)] px-3 py-1.5 font-semibold text-[var(--color-warning)]">
                {totalSiapCetak} Siap Cetak
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/input-nilai-kelas"
              className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] shadow-sm"
            >
              Input Nilai Masal
            </Link>
            <Link
              href="/admin/manajemen-kelas"
              className="rounded-full border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary-100)] hover:bg-white hover:text-[var(--color-primary)]"
            >
              Atur Penempatan Kelas
            </Link>
            <Link
              href="/admin/master-data"
              className="rounded-full border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary-100)] hover:bg-white hover:text-[var(--color-primary)]"
            >
              Atur KKM &amp; Template
            </Link>
            <Link
              href="/layout-editor"
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-[var(--color-info)] transition hover:border-blue-300 hover:bg-blue-100"
            >
              🎨 Atur Layout Syahadah
            </Link>
            {filterKelasId !== "ALL" && filterKelasId !== "UNASSIGNED" && !filterKelasId.startsWith("PROGRAM_") && (
              <a
                href={`/cetak-bulk/${filterKelasId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[var(--color-warning)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warning)] shadow-sm"
              >
                Cetak Syahadah (Ruangan)
              </a>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-surface-dark)] text-left">
            <thead className="bg-[var(--color-secondary)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-4 text-center">#</th>
                <th className="px-6 py-4">Santri</th>
                <th className="px-6 py-4">Lokasi</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Tasmi&apos;</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
              {filteredSantri.map((santri, index) => (
                <tr key={santri.id} className="align-top hover:bg-[var(--color-secondary)]/80">
                  {/* No urut */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-muted)]">
                      {index + 1}
                    </span>
                  </td>
                  {/* Nama */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-[var(--color-text)]">{santri.nama}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">{santri.gender}</p>
                  </td>
                  {/* Lokasi */}
                  <td className="px-6 py-4 text-[var(--color-text-muted)]">{santri.lokasi}</td>
                  {/* Kelas */}
                  <td className="px-6 py-4">
                    {santri.kelasId ? (
                      <div>
                        <span className="inline-flex rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold text-[var(--color-text)]">
                          {santri.kelasNama}
                        </span>
                        {santri.programId && (
                          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{santri.programNama}</p>
                        )}
                      </div>
                    ) : santri.programId !== null ? (
                      <span className="inline-flex rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold text-[var(--color-text)]">
                        {santri.programNama}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[var(--color-danger-light)] px-3 py-1 text-xs font-bold text-[var(--color-danger)]">
                        Tanpa Kelas
                      </span>
                    )}
                  </td>
                  {/* Tasmi */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${santri.isTasmi ? "bg-[var(--color-primary-100)] text-[var(--color-primary)]" : "bg-[var(--color-danger-light)] text-[var(--color-danger)]"}`}>
                      {santri.isTasmi ? "Sudah" : "Belum"}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(santri.statusKelulusan)}`}>
                      {santri.statusKelulusan}
                    </span>
                  </td>
                  {/* Aksi */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/input-nilai/${santri.id}`}
                        className="rounded-full border border-[var(--color-surface-dark)] px-4 py-2 text-xs font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary-100)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary)]"
                      >
                        Input Nilai
                      </Link>
                      {santri.canViewIjazah ? (
                        <>
                          <Link
                            href={`/admin/syahadah/${santri.id}/transkrip`}
                            className="rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-[var(--color-info)] transition hover:bg-blue-200"
                          >
                            Transkrip Detail
                          </Link>
                          <Link
                            href={`/ijazah/${santri.id}`}
                            className="rounded-full bg-[var(--color-text)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--color-text)]"
                          >
                            Ijazah Online
                          </Link>
                        </>
                      ) : (
                        <span className="rounded-full bg-[var(--color-surface-dark)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)]">
                          Ijazah Terkunci
                        </span>
                      )}
                      {santri.canPrintSyahadah ? (
                        <Link
                          href={`/cetak/${santri.id}`}
                          className="rounded-full bg-[var(--color-warning)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--color-warning)]"
                        >
                          Cetak Syahadah
                        </Link>
                      ) : (
                        <span className="rounded-full bg-[var(--color-surface-dark)] px-4 py-2 text-xs font-bold text-[var(--color-text-muted)]">
                          Cetak Terkunci
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSantri.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                    Tidak ada santri di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
