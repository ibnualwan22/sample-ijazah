"use client";

import { useMemo } from "react";
import Link from "next/link";
import { convertToArabicNumerals } from "@/lib/formatters";

type MartabahUlaRow = {
  id: string; // santriId
  nama: string;
  programNama: string;
  programId: string;
  average: number;
  averagePredikat: { indo: string; arab: string };
  statusKelulusan: string;
  isAktif: boolean;
  canViewIjazah: boolean;
  riwayatId: string;
  lokasi: string;
};

export function MartabahUlaClient({
  santriRows,
}: {
  santriRows: MartabahUlaRow[];
}) {
  const martabahUlaList = useMemo(() => {
    // 1. Filter santri yang nilai akhirnya sudah lengkap (canViewIjazah)
    const completed = santriRows.filter((s) => s.canViewIjazah && s.statusKelulusan !== "TIDAK_LULUS");

    // 2. Group by program
    const byProgram = new Map<string, MartabahUlaRow[]>();
    for (const santri of completed) {
      if (!byProgram.has(santri.programId)) {
        byProgram.set(santri.programId, []);
      }
      byProgram.get(santri.programId)!.push(santri);
    }

    // 3. Find top student per program
    const topStudents: MartabahUlaRow[] = [];
    for (const [programId, students] of byProgram.entries()) {
      // Sort by average descending
      students.sort((a, b) => b.average - a.average);
      if (students.length > 0) {
        // Here we just pick the first one (the highest).
        // Tie break is naturally handled by the sort algorithm (first one wins, or we can add secondary criteria).
        topStudents.push(students[0]);
      }
    }

    // 4. Sort by program name
    return topStudents.sort((a, b) => a.programNama.localeCompare(b.programNama, "id"));
  }, [santriRows]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm mt-6">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Peraih Martabah Ula</h2>
        <p className="text-sm text-slate-500 max-w-2xl">
          Daftar santri dengan nilai tertinggi di setiap program. Data ini hanya akan muncul jika seluruh nilai santri di program tersebut telah lengkap (terisi sampai Nihai).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold rounded-tl-2xl">Program</th>
              <th className="px-6 py-4 font-semibold">Nama Santri</th>
              <th className="px-6 py-4 font-semibold text-center">Rata-rata</th>
              <th className="px-6 py-4 font-semibold text-center">Predikat</th>
              <th className="px-6 py-4 font-semibold text-right rounded-tr-2xl">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {martabahUlaList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <p>Belum ada santri peraih Martabah Ula.</p>
                    <p className="text-xs">Pastikan Usbu' Nihai sudah terisi untuk semua mapel.</p>
                  </div>
                </td>
              </tr>
            ) : (
              martabahUlaList.map((santri) => (
                <tr key={santri.programId} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs">
                      {santri.programNama}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{santri.nama}</div>
                    <div className="text-xs text-slate-500">{santri.lokasi}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-slate-900 text-lg">
                      {santri.average.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                        Martabah Ula
                      </span>
                      <span className="text-xs text-slate-500 font-arabic" dir="rtl">
                        الامتياز مع مرتبة الشرف الأولى
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/syahadah/${santri.id}/transkrip`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Lihat Syahadah
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
