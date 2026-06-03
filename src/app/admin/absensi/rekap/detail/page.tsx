import { Suspense } from "react";
import { AbsensiRekapDetailClient } from "@/components/admin/absensi-rekap-detail-client";

export default function RekapDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-surface-dark)]">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            Rincian Kehadiran
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
            Detail data absen dan statistik per kelompok
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse p-10 text-center text-[var(--color-text-subtle)] font-medium">Memuat Rincian...</div>}>
        <AbsensiRekapDetailClient />
      </Suspense>
    </div>
  );
}
