import { Suspense } from "react";
import { AbsensiRekapDetailClient } from "@/components/admin/absensi-rekap-detail-client";

export default function RekapDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Rincian Kehadiran
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Detail data absen dan statistik per kelompok
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse p-10 text-center text-slate-400 font-medium">Memuat Rincian...</div>}>
        <AbsensiRekapDetailClient />
      </Suspense>
    </div>
  );
}
