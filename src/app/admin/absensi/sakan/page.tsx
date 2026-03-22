import { Metadata } from "next";
import { getMasterSantriList } from "@/lib/santri-api";
import { AbsensiSakanClient } from "@/components/admin/absensi-sakan-client";

export const metadata: Metadata = {
  title: "Absen Sakan - Admin Panel",
};

export default async function AbsensiSakanPage() {
  const masterSantri = await getMasterSantriList();
  const sakanSet = new Set<string>();
  masterSantri.forEach(s => {
    if (s.sakan && s.sakan !== "-") sakanSet.add(s.sakan);
  });
  const sakanList = Array.from(sakanSet).sort();

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 md:text-4xl">
          Absen Sakan
        </h1>
        <p className="text-base text-slate-500 max-w-2xl">
          Pendataan kehadiran santri di asrama (1x sehari).
        </p>
      </div>
      <AbsensiSakanClient sakanList={sakanList} />
    </div>
  );
}
