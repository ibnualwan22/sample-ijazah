import { requirePermission } from "@/lib/permission";
import prisma from "@/lib/prisma";
import { getMasterSantriList } from "@/lib/santri-api";
import { redirect } from "next/navigation";
import { CetakUsbuDocument } from "@/components/admin/cetak-usbu-document";
import { getActiveDufahName } from "@/lib/absensi";

export default async function CetakBulkUsbuPage({ params }: { params: Promise<{ usbu: string }> }) {
  await requirePermission("cetak_nilai_pekanan");
  const { usbu } = await params;
  const targetUsbu = parseInt(usbu);

  if (targetUsbu < 1 || targetUsbu > 4) redirect("/admin/cetak-usbu");

  const masterList = await getMasterSantriList();
  const masterMap = new Map(masterList.map(m => [m.id, m]));
  const activeStudentIds = Array.from(masterMap.values()).filter(m => m.isAktif).map(m => m.id);

  const kelasList = await prisma.kelas.findMany({
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
    },
    orderBy: { nama: "asc" }
  });

  const allClassData = [];

  for (const kelas of kelasList) {
    const riwayatListRaw = await prisma.riwayatSantri.findMany({
      where: {
        kelasId: kelas.id,
      },
      include: {
        santri: true,
        nilaiList: true,
      }
    });

    if (riwayatListRaw.length === 0) continue;

    const isAkbarnas = kelas.program.nama_indo.toLowerCase().includes("akbarnas");

    let riwayatList = riwayatListRaw.filter((r: any) => activeStudentIds.includes(r.santriId));
    let isMonth2 = false;

    if (isAkbarnas) {
      const allAkbarnasRiwayats = await prisma.riwayatSantri.findMany({
        where: {
          santriId: { in: activeStudentIds },
          program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } }
        },
        orderBy: { id: "asc" }
      });

      const riwayatBulanMap = new Map<string, { bulan1: string | null, bulan2: string | null }>();
      for (const r of allAkbarnasRiwayats) {
        if (!riwayatBulanMap.has(r.santriId)) {
          riwayatBulanMap.set(r.santriId, { bulan1: r.id, bulan2: null });
        } else {
          riwayatBulanMap.get(r.santriId)!.bulan2 = r.id;
        }
      }

      // In bulk mode, we just want their CURRENT riwayat in this class.
      // So if a student is active, we just check if this riwayat matches their masterSantri.dufahNama.
      // Wait, if they are active, their masterSantri.dufahNama IS their current riwayat!
      // This works for Bulan 2 (if they are in Bulan 2) and Bulan 1 (if they are in Bulan 1).
      // So we can just use the same logic as non-Akbarnas!
      riwayatList = riwayatList.filter((r: any) => masterMap.get(r.santriId)?.dufahNama === r.dufahNama);

      // Now, is this class Month 1 or Month 2?
      // Since all active students in an Akbarnas class should theoretically be in the same month...
      // We can check the riwayatBulanMap for the first student.
      if (riwayatList.length > 0) {
        const firstStudentMap = riwayatBulanMap.get(riwayatList[0].santriId);
        if (firstStudentMap && firstStudentMap.bulan2 === riwayatList[0].id) {
          isMonth2 = true;
        }
      }
    } else {
      riwayatList = riwayatList.filter((r: any) => masterMap.get(r.santriId)?.dufahNama === r.dufahNama);
    }

    const activeMapels = kelas.program.programMapels.filter(pm => {
      if (!isAkbarnas) return true;
      if (isMonth2) {
        return (pm.mapel as any).bulan_aktif !== 1;
      } else {
        return (pm.mapel as any).bulan_aktif !== 2;
      }
    });

    const rows = riwayatList.map((riwayat: any) => {
      const ms = masterMap.get(riwayat.santriId);
      if (!ms && !riwayat.santri) return null;

      const nama = ms?.nama || riwayat.santri.nama || "Tanpa Nama";
      const gender = ms?.gender || "-";

      const mapelScores: (number | "-")[] = [];
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
                score = Number((parts.reduce((a: number, b: number) => a + b, 0) / parts.length).toFixed(2));
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

    allClassData.push({
      kelas,
      activeMapels,
      rows,
      isMonth2
    });
  }

  if (allClassData.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-200">
        <p className="text-xl font-bold text-slate-700">Tidak ada data kelas yang dapat dicetak.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-8">
      <style>{`
        @media print {
          .bulk-container { padding: 0 !important; background: white !important; }
        }
      `}</style>
      <div className="bulk-container flex flex-col gap-8 md:gap-12">
        {allClassData.map(({ kelas, activeMapels, rows, isMonth2 }) => (
          <CetakUsbuDocument
            key={kelas.id}
            kelasNama={kelas.nama + (isMonth2 ? " (Bulan 2)" : "")}
            waliKelas={kelas.waliKelas?.nama || "Belum dihubungkan"}
            usbuLabel={targetUsbu === 3 ? "Nihai" : targetUsbu === 4 ? "Akumulatif" : targetUsbu.toString()}
            mapelHeaders={activeMapels.map((pm: any) => pm.mapel.nama_indo.toUpperCase() as string)}
            rows={rows}
          />
        ))}
      </div>
    </div>
  );
}
