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

  // Find students CURRENTLY active in this class
  const currentClassRiwayats = await prisma.riwayatSantri.findMany({
    where: { kelasId },
    select: { santriId: true, dufahNama: true }
  });

  const activeStudentIdsInClass = currentClassRiwayats
    .filter(r => {
      const ms = masterMap.get(r.santriId);
      return ms?.isAktif && ms.dufahNama === r.dufahNama;
    })
    .map(r => r.santriId);

  const isAkbarnas = kelas.program.nama_indo.toLowerCase().includes("akbarnas");
  const isMonth2 = isAkbarnas && bulan === "2";

  let riwayatList: any[] = [];

  if (isAkbarnas) {
    const allAkbarnasRiwayats = await prisma.riwayatSantri.findMany({
      where: {
        santriId: { in: activeStudentIdsInClass },
        program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } }
      },
      orderBy: { id: "asc" },
      include: { santri: true, nilaiList: true }
    });

    const riwayatBulanMap = new Map<string, { bulan1: any, bulan2: any }>();
    for (const r of allAkbarnasRiwayats) {
      if (!riwayatBulanMap.has(r.santriId)) {
        riwayatBulanMap.set(r.santriId, { bulan1: r, bulan2: null });
      } else {
        riwayatBulanMap.get(r.santriId)!.bulan2 = r;
      }
    }

    activeStudentIdsInClass.forEach(santriId => {
      const map = riwayatBulanMap.get(santriId);
      if (map) {
        const targetR = isMonth2 ? map.bulan2 : map.bulan1;
        if (targetR) riwayatList.push(targetR);
      }
    });
  } else {
    // For non-Akbarnas, just get their latest/current riwayat
    riwayatList = await prisma.riwayatSantri.findMany({
      where: {
        santriId: { in: activeStudentIdsInClass },
      },
      include: { santri: true, nilaiList: true }
    });
    riwayatList = riwayatList.filter(r => masterMap.get(r.santriId)?.dufahNama === r.dufahNama);
  }

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
        if (targetUsbu === 1) score = match.nilaiUsbu1;
        if (targetUsbu === 2) score = match.nilaiUsbu2;
        if (targetUsbu === 3) score = match.nilaiNihai;
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
