import { requirePermission } from "@/lib/permission";
import prisma from "@/lib/prisma";
import { getMasterSantriList } from "@/lib/santri-api";
import { redirect } from "next/navigation";
import { CetakUsbuDocument } from "@/components/admin/cetak-usbu-document";
import { getActiveDufahName } from "@/lib/absensi";

export default async function CetakUsbuPrintPage(props: { params: Promise<{ kelasId: string, usbu: string }>, searchParams: Promise<{ bulan?: string }> }) {
  await requirePermission("cetak_nilai_pekanan");
  const { kelasId, usbu } = await props.params;
  const { bulan } = await props.searchParams;
  const targetUsbu = parseInt(usbu);

  if (targetUsbu < 1 || targetUsbu > 4) redirect("/admin/cetak-usbu");

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      waliKelas: true,
      program: {
        include: {
          programMapels: {
            include: { mapel: true },
            orderBy: { urutan: "asc" }
          }
        }
      }
    }
  });

  if (!kelas) redirect("/admin/cetak-usbu");

  const masterList = await getMasterSantriList();
  const masterMap = new Map(masterList.map(m => [m.id, m]));

  const activeRiwayatList = await prisma.riwayatSantri.findMany({
    where: { kelasId },
    select: { id: true, santriId: true, dufahNama: true }
  });

  const validActiveRiwayats = activeRiwayatList.filter(r => {
    const ms = masterMap.get(r.santriId);
    return ms?.isAktif && ms.dufahNama === r.dufahNama;
  });

  const isAkbarnas = kelas.program.nama_indo.toLowerCase().includes("akbarnas");
  const isMonth2 = isAkbarnas && bulan === "2";
  
  let targetRiwayatIds: string[] = [];

  if (isAkbarnas) {
    const reqMonth = bulan === "2" ? "2" : "1";
    if (reqMonth === "2" && !kelas.is_akbarnas_b2) {
      targetRiwayatIds = [];
    } else if (reqMonth === "2" && kelas.is_akbarnas_b2) {
      targetRiwayatIds = validActiveRiwayats.map(r => r.id);
    } else if (reqMonth === "1" && !kelas.is_akbarnas_b2) {
      targetRiwayatIds = validActiveRiwayats.map(r => r.id);
    } else if (reqMonth === "1" && kelas.is_akbarnas_b2) {
      const santriIds = validActiveRiwayats.map(r => r.santriId);
      const previousRiwayats = await prisma.riwayatSantri.findMany({
        where: {
          santriId: { in: santriIds },
          program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } },
          id: { notIn: validActiveRiwayats.map(r => r.id) }
        },
        orderBy: { id: 'desc' }
      });
      const santriToHistorical = new Map();
      for (const r of previousRiwayats) {
        if (!santriToHistorical.has(r.santriId)) {
          santriToHistorical.set(r.santriId, r);
        }
      }
      targetRiwayatIds = validActiveRiwayats.map(active => {
        const hist = santriToHistorical.get(active.santriId);
        return hist ? hist.id : null;
      }).filter(Boolean) as string[];
    }
  } else {
    targetRiwayatIds = validActiveRiwayats.map(r => r.id);
  }

  const riwayatList = await prisma.riwayatSantri.findMany({
    where: { id: { in: targetRiwayatIds } },
    include: { santri: true, nilaiList: true }
  });

  const activeMapels = kelas.program.programMapels.filter(pm => {
    if (!isAkbarnas) return true;
    if (isMonth2) {
      return (pm.mapel as any).bulan_aktif !== 1;
    } else {
      return (pm.mapel as any).bulan_aktif !== 2;
    }
  });

  const rows = riwayatList.map(riwayat => {
    const ms = masterMap.get(riwayat.santriId);
    if (!ms && !riwayat.santri) return null;

    const nama = ms?.nama || riwayat.santri.nama || "Tanpa Nama";
    const gender = ms?.gender || "-";

    // Compute Nilai
    // Because mapels are dynamic, we need an array of values matching the program's sorted mapels
    const mapelScores: (number | "-")[] = [];
    let sum = 0;

    let totalSkorBobot = 0;
    let totalBobotCalculated = 0;

    for (const pm of activeMapels) {
      const match = riwayat.nilaiList.find((n: any) => n.mapelId === pm.mapelId);

      let score: number | null = null;
      if (match) {
        if (targetUsbu === 1) score = match.nilaiUsbu1 ?? match.nilaiAkhir;
        if (targetUsbu === 2) score = match.nilaiUsbu2 ?? match.nilaiAkhir;
        if (targetUsbu === 3) score = match.nilaiNihai ?? match.nilaiAkhir;
        if (targetUsbu === 4) {
          if (match.nilaiAkhir !== null && match.nilaiAkhir !== undefined) {
            score = match.nilaiAkhir;
          } else {
            const parts = [];
            if (match.nilaiUsbu1 !== null && match.nilaiUsbu1 !== undefined) parts.push(match.nilaiUsbu1);
            if (match.nilaiUsbu2 !== null && match.nilaiUsbu2 !== undefined) parts.push(match.nilaiUsbu2);
            if (match.nilaiNihai !== null && match.nilaiNihai !== undefined) parts.push(match.nilaiNihai);
            if (parts.length > 0) {
              score = Number((parts.reduce((a, b) => a + b, 0) / parts.length).toFixed(2));
            }
          }
        }
      }

      if (score !== null && score !== undefined) {
        mapelScores.push(score);
        if (pm.mapel.masuk_akumulasi !== false) {
          const currentWeight = targetUsbu === 4 ? (pm.mapel.bobot ?? 1) : ((pm.mapel as any).bobot_usbu ?? 1);
          totalSkorBobot += score * currentWeight;
          totalBobotCalculated += currentWeight;
        }
      } else {
        mapelScores.push("-");
      }
    }

    const nilaiAkumulatif = totalBobotCalculated > 0 ? Number((totalSkorBobot / totalBobotCalculated).toFixed(2)) : 0;

    return {
      nama,
      gender,
      mapelScores,
      nilaiAkumulatif
    };
  }).filter(Boolean) as any[];

  // Sort by akumulatif descending to get ranking
  rows.sort((a, b) => b.nilaiAkumulatif - a.nilaiAkumulatif);

  // Assign ranking
  rows.forEach((r, idx) => {
    r.peringkat = idx + 1;
  });

  // Then sort back by name alphabetically
  rows.sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-8">
      <CetakUsbuDocument
        kelasNama={kelas.nama + (isMonth2 ? " (Bulan 2)" : "")}
        waliKelas={kelas.waliKelas?.nama || "Belum dihubungkan"}
        usbuLabel={targetUsbu === 3 ? "Nihai" : targetUsbu === 4 ? "Akumulatif" : targetUsbu.toString()}
        mapelHeaders={activeMapels.map(pm => pm.mapel.nama_indo.toUpperCase() as string)}
        rows={rows}
      />
    </div>
  );
}
