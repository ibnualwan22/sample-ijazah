import { getDashboardSantriRows } from "./src/lib/app-data";

async function main() {
  const allRows = await getDashboardSantriRows();
  const akbarnas = allRows.filter((s: any) => s.programNama.toLowerCase().includes("akbarnas"));
  console.log(akbarnas.map((s: any) => ({
    nama: s.nama,
    average: s.average,
    riwayatId: s.riwayatId,
    dufahNama: s.dufahNama,
    programId: s.programId,
    isAktif: s.isAktif,
    canViewIjazah: s.canViewIjazah,
    status: s.statusKelulusan
  })));
}
main().catch(console.error);
