import { Metadata } from "next";
import { RekapAbsenClient } from "@/components/admin/absensi-rekap-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rekapitulasi Absen - Admin Panel",
};


export default function RekapAbsenPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black md:text-4xl ">
          Rekapitulasi Absen
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Laporan global rekap kehadiran santri dikelompokkan per jenis absensi dalam rentang tanggal tertentu.
        </p>
      </div>
      <RekapAbsenClient />
    </div>
  );
}
