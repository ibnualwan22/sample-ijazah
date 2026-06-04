import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getActiveDufahName } from "@/lib/absensi";
import { getMasterSantriList } from "@/lib/santri-api";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Get active dufah and usbu flags
    const activeDufahName = await getActiveDufahName();
    if (!activeDufahName) {
      return NextResponse.json({ error: "Tidak ada Duf'ah aktif" }, { status: 404 });
    }

    const dufah = await prisma.dufah.findUnique({ where: { nama: activeDufahName } });
    if (!dufah) {
      return NextResponse.json({ error: "Duf'ah tidak ditemukan" }, { status: 404 });
    }

    const activeFlags = {
      u1: dufah.usbu1Active,
      u2: dufah.usbu2Active,
      u3: dufah.usbu3Active,
    };

    // Determine which columns to check for emptiness
    const columnsToCheck: string[] = [];
    if (activeFlags.u1) columnsToCheck.push("u1");
    if (activeFlags.u2) columnsToCheck.push("u2");
    if (activeFlags.u3) columnsToCheck.push("u3");

    if (columnsToCheck.length === 0) {
      return NextResponse.json({
        activeDufah: activeDufahName,
        activeFlags,
        kelasGroups: [],
      });
    }

    // 2. Get master santri list for active students
    const masterSantriList = await getMasterSantriList();
    const activeSantriMap = new Map<string, typeof masterSantriList[0]>();
    for (const ms of masterSantriList) {
      if (ms.isAktif) {
        activeSantriMap.set(ms.id, ms);
      }
    }

    // 3. Get all active RiwayatSantri with program, kelas, and nilai
    const isAdmin = session.role === "ADMIN";
    const allowedKelasId = session.kelasId ?? null;

    const whereClause: any = {
      kelasId: { not: null },
      programId: { not: null },
    };

    // For wali kelas, restrict to their class only
    if (!isAdmin && allowedKelasId) {
      whereClause.kelasId = allowedKelasId;
    } else if (!isAdmin && !allowedKelasId) {
      // Non-admin without kelas assignment sees nothing
      return NextResponse.json({
        activeDufah: activeDufahName,
        activeFlags,
        kelasGroups: [],
      });
    }

    const riwayatList = await prisma.riwayatSantri.findMany({
      where: whereClause,
      include: {
        program: {
          include: {
            programMapels: {
              include: { mapel: true },
              orderBy: { urutan: "asc" },
            },
          },
        },
        kelas: true,
        nilaiList: true,
      },
    });

    // Filter active riwayat using same logic as getActiveRiwayatListForAbsen:
    // Match by master santri's dufahNama (not system activeDufahName)
    // This ensures Akbarnas students with values in previous dufah are resolved correctly
    const activeRiwayat = riwayatList.filter((r) => {
      const ms = activeSantriMap.get(r.santriId);
      if (!ms) return false;
      return ms.dufahNama === r.dufahNama;
    });

    // For Akbarnas, we need to know is_akbarnas_b2 per kelas
    const kelasB2Map = new Map<string, boolean>();
    for (const r of activeRiwayat) {
      if (r.kelas && !kelasB2Map.has(r.kelas.id)) {
        kelasB2Map.set(r.kelas.id, (r.kelas as any).is_akbarnas_b2 ?? false);
      }
    }

    // 4. For each santri, find missing grades
    type MissingMapelInfo = {
      mapelId: string;
      mapelNama: string;
      missingColumns: string[]; // ["u1", "u2", "u3"]
      currentValues: {
        u1: number | null;
        u2: number | null;
        n: number | null;
        a: number | null;
      };
      jumlahTes: number;
    };

    type SantriMissingInfo = {
      riwayatId: string;
      santriId: string;
      nama: string;
      missingMapels: MissingMapelInfo[];
    };

    type KelasGroup = {
      kelasId: string;
      kelasNama: string;
      programId: string;
      programNama: string;
      mapelList: {
        id: string;
        nama_indo: string;
        jumlah_tes: number;
        bobot_usbu: number;
        bobot: number;
        bulan_aktif: number;
        jumlah_tes_b2: number | null;
      }[];
      santriList: SantriMissingInfo[];
    };

    const kelasGroupMap = new Map<string, KelasGroup>();

    for (const r of activeRiwayat) {
      if (!r.program || !r.kelas) continue;

      const ms = activeSantriMap.get(r.santriId);
      if (!ms) continue;

      const programMapels = r.program.programMapels;
      const nilaiMap = new Map(r.nilaiList.map((n) => [n.mapelId, n]));
      const isAkbarnas = r.program.nama_indo.toLowerCase().includes("akbarnas");
      const isBulan2 = isAkbarnas && (kelasB2Map.get(r.kelas.id) ?? false);

      const missingMapels: MissingMapelInfo[] = [];

      for (const pm of programMapels) {
        const mapel = pm.mapel;

        // Skip mapels with 0 bobot_usbu (not tested in usbu')
        if (mapel.bobot_usbu === 0) continue;

        // Akbarnas: filter mapels by bulan_aktif
        if (isAkbarnas) {
          if (isBulan2 && mapel.bulan_aktif === 1) continue; // Skip Bulan-1-only mapels in Bulan 2
          if (!isBulan2 && mapel.bulan_aktif === 2) continue; // Skip Bulan-2-only mapels in Bulan 1
        }

        // Determine effective jumlah_tes (Akbarnas Bulan 2 may override)
        let effectiveJumlahTes = mapel.jumlah_tes;
        if (isAkbarnas && isBulan2 && mapel.jumlah_tes_b2 !== null && mapel.jumlah_tes_b2 !== undefined) {
          effectiveJumlahTes = mapel.jumlah_tes_b2;
        }

        const nilai = nilaiMap.get(mapel.id);
        const missingCols: string[] = [];

        if (effectiveJumlahTes === 3 || effectiveJumlahTes >= 3) {
          if (activeFlags.u1 && (nilai?.nilaiUsbu1 === null || nilai?.nilaiUsbu1 === undefined || !nilai)) {
            missingCols.push("u1");
          }
          if (activeFlags.u2 && (nilai?.nilaiUsbu2 === null || nilai?.nilaiUsbu2 === undefined || !nilai)) {
            missingCols.push("u2");
          }
          if (activeFlags.u3 && (nilai?.nilaiNihai === null || nilai?.nilaiNihai === undefined || !nilai)) {
            missingCols.push("u3");
          }
        } else if (effectiveJumlahTes === 1) {
          if (nilai?.nilaiAkhir === null || nilai?.nilaiAkhir === undefined || !nilai) {
            missingCols.push("akhir");
          }
        }

        if (missingCols.length > 0) {
          missingMapels.push({
            mapelId: mapel.id,
            mapelNama: mapel.nama_indo,
            missingColumns: missingCols,
            currentValues: {
              u1: nilai?.nilaiUsbu1 ?? null,
              u2: nilai?.nilaiUsbu2 ?? null,
              n: nilai?.nilaiNihai ?? null,
              a: nilai?.nilaiAkhir ?? null,
            },
            jumlahTes: effectiveJumlahTes,
          });
        }
      }

      if (missingMapels.length === 0) continue; // Skip fully complete students

      const kelasKey = r.kelas.id;
      if (!kelasGroupMap.has(kelasKey)) {
        kelasGroupMap.set(kelasKey, {
          kelasId: r.kelas.id,
          kelasNama: r.kelas.nama,
          programId: r.program.id,
          programNama: r.program.nama_indo,
          mapelList: programMapels
            .filter((pm) => pm.mapel.bobot_usbu > 0)
            .map((pm) => ({
              id: pm.mapel.id,
              nama_indo: pm.mapel.nama_indo,
              jumlah_tes: pm.mapel.jumlah_tes,
              bobot_usbu: pm.mapel.bobot_usbu,
              bobot: pm.mapel.bobot,
              bulan_aktif: pm.mapel.bulan_aktif,
              jumlah_tes_b2: pm.mapel.jumlah_tes_b2,
            })),
          santriList: [],
        });
      }

      kelasGroupMap.get(kelasKey)!.santriList.push({
        riwayatId: r.id,
        santriId: r.santriId,
        nama: ms.nama,
        missingMapels,
      });
    }

    // Sort santri in each group by name
    const kelasGroups = Array.from(kelasGroupMap.values())
      .map((group) => ({
        ...group,
        santriList: group.santriList.sort((a, b) => a.nama.localeCompare(b.nama, "id")),
      }))
      .sort((a, b) => a.kelasNama.localeCompare(b.kelasNama, "id"));

    return NextResponse.json({
      activeDufah: activeDufahName,
      activeFlags,
      kelasGroups,
    });
  } catch (error) {
    console.error("Error fetching empty grades:", error);
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
        if (update.nilai && typeof update.nilai === "object") {
          for (const [mapelId, grades] of Object.entries<any>(update.nilai)) {
            if (
              grades.u1 !== undefined ||
              grades.u2 !== undefined ||
              grades.n !== undefined ||
              grades.a !== undefined
            ) {
              const dataToUpdate: any = {};
              if (grades.u1 !== undefined) dataToUpdate.nilaiUsbu1 = grades.u1;
              if (grades.u2 !== undefined) dataToUpdate.nilaiUsbu2 = grades.u2;
              if (grades.n !== undefined) dataToUpdate.nilaiNihai = grades.n;
              if (grades.a !== undefined) dataToUpdate.nilaiAkhir = grades.a;

              await tx.nilai.upsert({
                where: {
                  riwayatId_mapelId: {
                    riwayatId: update.riwayatId,
                    mapelId: mapelId,
                  },
                },
                update: dataToUpdate,
                create: {
                  riwayatId: update.riwayatId,
                  mapelId: mapelId,
                  ...dataToUpdate,
                },
              });

              // Auto-calculate nilaiAkhir if all 3 scores are present
              if (grades.a === undefined) {
                const mapel = await tx.mapel.findUnique({ where: { id: mapelId } });
                if (mapel && mapel.jumlah_tes === 3) {
                  const currentNilai = await tx.nilai.findUnique({
                    where: { riwayatId_mapelId: { riwayatId: update.riwayatId, mapelId } },
                  });

                  if (
                    currentNilai &&
                    currentNilai.nilaiUsbu1 !== null &&
                    currentNilai.nilaiUsbu2 !== null &&
                    currentNilai.nilaiNihai !== null
                  ) {
                    const riwayat = await tx.riwayatSantri.findUnique({
                      where: { id: update.riwayatId },
                      include: { program: true },
                    });
                    const isAkbarnas =
                      riwayat?.program?.nama_indo?.toLowerCase().includes("akbarnas") ?? false;

                    let nilaiAkhir: number;
                    if (isAkbarnas) {
                      nilaiAkhir = Number(
                        (
                          (currentNilai.nilaiUsbu1 + currentNilai.nilaiUsbu2 + currentNilai.nilaiNihai) /
                          3
                        ).toFixed(2)
                      );
                    } else {
                      nilaiAkhir = Number(
                        (
                          currentNilai.nilaiUsbu1 * 0.3 +
                          currentNilai.nilaiUsbu2 * 0.3 +
                          currentNilai.nilaiNihai * 0.4
                        ).toFixed(2)
                      );
                    }

                    await tx.nilai.update({
                      where: { riwayatId_mapelId: { riwayatId: update.riwayatId, mapelId } },
                      data: { nilaiAkhir },
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
    console.error("Error saving inline grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
