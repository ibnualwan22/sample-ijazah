import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveRiwayatListForAbsen } from "@/lib/absensi";
import { getMasterSantriList } from "@/lib/santri-api";
import { PROGRAM_SEED_DATA } from "@/lib/academic-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get("kelasId");
    const month = searchParams.get("month");

    if (!kelasId) {
      return NextResponse.json({ error: "Missing kelasId" }, { status: 400 });
    }

    const kelasInfo = await prisma.kelas.findUnique({
      where: { id: kelasId }
    });
    const isBulan2 = kelasInfo?.is_akbarnas_b2 || false;

    let targetRiwayatList: any[] = [];

    // ===== GABUNGAN MODE (Akbarnas): merge B1+B2 untuk nilai tambahan =====
    if (month === "gabungan") {
      const activeRiwayatList = await getActiveRiwayatListForAbsen(kelasId);
      const santriIds = activeRiwayatList.map((r) => r.santriId);

      // Get ALL Akbarnas riwayat for these students
      const allAkbarnasRiwayat = await prisma.riwayatSantri.findMany({
        where: {
          santriId: { in: santriIds },
          program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } },
        },
        include: { santri: true, nilaiList: { include: { mapel: true } } },
      });

      // Get program mapels for the class
      const kelasWithProgram = await prisma.kelas.findUnique({
        where: { id: kelasId },
        include: { program: { include: { programMapels: { include: { mapel: true }, orderBy: { urutan: 'asc' } } } } }
      });
      const allMapels = kelasWithProgram?.program.programMapels || [];

      // Group by santriId
      const riwayatBySantri = new Map<string, typeof allAkbarnasRiwayat>();
      for (const r of allAkbarnasRiwayat) {
        if (!riwayatBySantri.has(r.santriId)) riwayatBySantri.set(r.santriId, []);
        riwayatBySantri.get(r.santriId)!.push(r);
      }

      const responseData = activeRiwayatList.map(santri => {
        const allRiwayats = riwayatBySantri.get(santri.santriId) || [];
        if (allRiwayats.length === 0) return null;

        const nilaiMap: any = {};
        for (const pm of allMapels) {
          const m = pm.mapel;
          // Collect all scores from all riwayat for this mapel
          const allScores: number[] = [];
          let tambahan = 0;
          for (const riwayat of allRiwayats) {
            const match = riwayat.nilaiList.find(n => n.mapelId === m.id);
            if (match) {
              // Collect weekly scores
              if (match.nilaiUsbu1 !== null) allScores.push(match.nilaiUsbu1);
              if (match.nilaiUsbu2 !== null) allScores.push(match.nilaiUsbu2);
              if (match.nilaiNihai !== null) allScores.push(match.nilaiNihai);
              // Direct scores (jumlah_tes === 1)
              if (match.nilaiUsbu1 === null && match.nilaiUsbu2 === null && match.nilaiNihai === null && match.nilaiAkhir !== null) {
                allScores.push(match.nilaiAkhir);
              }
              // Take tambahan from the latest riwayat that has it
              if (match.nilaiTambahan > 0) tambahan = match.nilaiTambahan;
            }
          }

          const avg = allScores.length > 0 ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)) : null;
          nilaiMap[m.id] = {
            u1: null, u2: null, n: null,
            a: avg,
            tambahan,
          };
        }

        return {
          riwayatId: santri.riwayatId, // Use active riwayat for saving
          santriId: santri.santriId,
          nama: santri.nama,
          is_tasmi: false,
          nilai: nilaiMap,
        };
      }).filter(Boolean);

      return NextResponse.json(responseData);
    }

    if (month === "1" || month === "2") {
      const activeRiwayatList = await getActiveRiwayatListForAbsen(kelasId);
      
      if (month === "2" && !isBulan2) {
        // Masih di Bulan 1, belum ada Bulan 2
        targetRiwayatList = [];
      } else if (month === "2" && isBulan2) {
        // Sedang di Bulan 2, minta Bulan 2 (Active)
        targetRiwayatList = activeRiwayatList;
      } else if (month === "1" && !isBulan2) {
        // Sedang di Bulan 1, minta Bulan 1 (Active)
        targetRiwayatList = activeRiwayatList;
      } else if (month === "1" && isBulan2) {
        // Sedang di Bulan 2, minta Bulan 1 (Historical)
        const santriIds = activeRiwayatList.map((r) => r.santriId);
        
        const previousRiwayats = await prisma.riwayatSantri.findMany({
          where: {
            santriId: { in: santriIds },
            program: { nama_indo: { contains: "akbarnas", mode: "insensitive" } },
            id: { notIn: activeRiwayatList.map((r) => r.riwayatId) }
          },
          orderBy: { id: 'desc' }
        });

        const santriToHistorical = new Map();
        for (const r of previousRiwayats) {
          if (!santriToHistorical.has(r.santriId)) {
            santriToHistorical.set(r.santriId, r);
          }
        }

        targetRiwayatList = activeRiwayatList.map(active => {
          const hist = santriToHistorical.get(active.santriId);
          if (hist) {
            return { ...active, riwayatId: hist.id };
          }
          return null;
        }).filter(Boolean);
      }
    } else {
      targetRiwayatList = await getActiveRiwayatListForAbsen(kelasId);
    }

    const riwayatIds = targetRiwayatList.map((r) => r.riwayatId);

    // Ambil data nilai dan status tasmi' untuk riwayat tersebut
    const dbRiwayat = await prisma.riwayatSantri.findMany({
      where: { id: { in: riwayatIds } },
      select: {
        id: true,
        is_tasmi: true,
        nilaiList: true // Ambil semua nilai
      }
    });

    const riwayatMap = new Map(dbRiwayat.map(r => [r.id, r]));

    const responseData = targetRiwayatList.map(santri => {
      const dbData = riwayatMap.get(santri.riwayatId);
      const nilaiMap: any = {};
      
      if (dbData?.nilaiList) {
        for (const nilai of dbData.nilaiList) {
          nilaiMap[nilai.mapelId] = {
            u1: nilai.nilaiUsbu1 ?? null,
            u2: nilai.nilaiUsbu2 ?? null,
            n: nilai.nilaiNihai ?? null,
            a: nilai.nilaiAkhir ?? null,
            tambahan: nilai.nilaiTambahan ?? 0,
          };
        }
      }

      return {
        riwayatId: santri.riwayatId,
        santriId: santri.santriId,
        nama: santri.nama,
        is_tasmi: dbData?.is_tasmi ?? false,
        nilai: nilaiMap,
      };
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching class grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        // Update is_tasmi di tabel RiwayatSantri
        if (update.is_tasmi !== undefined) {
          await tx.riwayatSantri.update({
            where: { id: update.riwayatId },
            data: { is_tasmi: update.is_tasmi }
          });
        }

        // Upsert nilai untuk setiap mapel
        if (update.nilai && typeof update.nilai === 'object') {
          for (const [mapelId, grades] of Object.entries<any>(update.nilai)) {
            if (grades.u1 !== undefined || grades.u2 !== undefined || grades.n !== undefined || grades.a !== undefined || grades.tambahan !== undefined) {
              const dataToUpdate: any = {};
              if (grades.u1 !== undefined) dataToUpdate.nilaiUsbu1 = grades.u1;
              if (grades.u2 !== undefined) dataToUpdate.nilaiUsbu2 = grades.u2;
              if (grades.n !== undefined) dataToUpdate.nilaiNihai = grades.n;
              if (grades.a !== undefined) dataToUpdate.nilaiAkhir = grades.a;
              if (grades.tambahan !== undefined) {
                // Validasi: max total (nilaiAkhir + tambahan) <= 100, min 0
                const tambahan = Math.max(0, Number(grades.tambahan) || 0);
                dataToUpdate.nilaiTambahan = tambahan;
              }

              await tx.nilai.upsert({
                where: {
                  riwayatId_mapelId: {
                    riwayatId: update.riwayatId,
                    mapelId: mapelId,
                  }
                },
                update: dataToUpdate,
                create: {
                  riwayatId: update.riwayatId,
                  mapelId: mapelId,
                  ...dataToUpdate
                }
              });

              // Auto-calculate nilaiAkhir jika U1, U2, dan Nihai sudah lengkap
              // Hanya untuk mapel dengan jumlah_tes === 3 (bukan mapel input langsung)
              if (grades.a === undefined) {
                const mapel = await tx.mapel.findUnique({ where: { id: mapelId } });
                if (mapel && mapel.jumlah_tes === 3) {
                  const currentNilai = await tx.nilai.findUnique({
                    where: { riwayatId_mapelId: { riwayatId: update.riwayatId, mapelId } }
                  });

                  if (currentNilai && 
                      currentNilai.nilaiUsbu1 !== null && 
                      currentNilai.nilaiUsbu2 !== null && 
                      currentNilai.nilaiNihai !== null) {
                    
                    // Cek apakah program ini Akbarnas
                    const riwayat = await tx.riwayatSantri.findUnique({
                      where: { id: update.riwayatId },
                      include: { program: true }
                    });
                    const isAkbarnas = riwayat?.program?.nama_indo?.toLowerCase().includes("akbarnas") ?? false;

                    let nilaiAkhir: number;
                    if (isAkbarnas) {
                      // Akbarnas: rata-rata sederhana (U1 + U2 + Nihai) / 3
                      nilaiAkhir = Number(((currentNilai.nilaiUsbu1 + currentNilai.nilaiUsbu2 + currentNilai.nilaiNihai) / 3).toFixed(2));
                    } else {
                      // Non-Akbarnas: U1(30%) + U2(30%) + Nihai(40%)
                      nilaiAkhir = Number((currentNilai.nilaiUsbu1 * 0.3 + currentNilai.nilaiUsbu2 * 0.3 + currentNilai.nilaiNihai * 0.4).toFixed(2));
                    }

                    await tx.nilai.update({
                      where: { riwayatId_mapelId: { riwayatId: update.riwayatId, mapelId } },
                      data: { nilaiAkhir }
                    });
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving bulk grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
