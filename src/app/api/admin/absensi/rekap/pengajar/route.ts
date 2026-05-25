import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  if (!dari || !sampai) {
    return NextResponse.json({ error: "Parameter rentang tanggal tidak lengkap" }, { status: 400 });
  }

  try {
    const records = await prisma.absenPengajar.findMany({
      where: {
        tanggal: {
          gte: new Date(`${dari}T00:00:00Z`),
          lte: new Date(`${sampai}T23:59:59Z`),
        }
      },
      include: {
        user: { select: { id: true, nama: true } },
        kelas: { select: { id: true, nama: true } },
      }
    });

    const formatted = records.map(r => ({
      id: r.id,
      pengajar: r.user.nama,
      kelas: r.kelas.nama,
      tanggal: r.tanggal.toISOString().split("T")[0],
      sesi: r.sesi,
      materi: r.materi || "-",
      waktuMulai: r.waktuMulai,
      waktuSelesai: r.waktuSelesai,
      status: "HADIR",
      atribut: {
        nametag: r.atributNametag,
        kopiah: r.atributKopiah,
        bros: r.atributBros,
      }
    }));

    const absenKelas = await prisma.absenKelas.findMany({
      where: {
        tanggal: {
          gte: new Date(`${dari}T00:00:00Z`),
          lte: new Date(`${sampai}T23:59:59Z`),
        }
      },
      select: {
        tanggal: true,
        sesi: true,
        riwayat: {
          select: { kelasId: true, kelas: { select: { nama: true } } }
        }
      }
    });

    const activeDates = new Set<string>();
    for (const ak of absenKelas) {
      if (ak.tanggal) {
        activeDates.add(ak.tanggal.toISOString().split("T")[0]);
      }
    }

    const pengajarSesi = await prisma.pengajarSesi.findMany({
      include: { 
        user: { select: { id: true, nama: true } },
        kelas: { select: { nama: true } }
      }
    });

    for (const tgl of activeDates) {
      for (const teacher of pengajarSesi) {
        const hasHadir = records.some(r => r.userId === teacher.userId && r.kelasId === teacher.kelasId && r.sesi === teacher.sesi && r.tanggal.toISOString().split("T")[0] === tgl);
        if (!hasHadir) {
          formatted.push({
            id: `alpha_${teacher.userId}_${teacher.kelasId}_${teacher.sesi}_${tgl}`,
            pengajar: teacher.user.nama,
            kelas: teacher.kelas.nama,
            tanggal: tgl,
            sesi: teacher.sesi,
            materi: "ALPHA (Belum Absen)",
            waktuMulai: "-",
            waktuSelesai: "-",
            status: "ALPHA",
            atribut: { nametag: false, kopiah: false, bros: false }
          });
        }
      }
    }

    formatted.sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      if (a.sesi !== b.sesi) return a.sesi.localeCompare(b.sesi);
      return a.pengajar.localeCompare(b.pengajar);
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching rekap pengajar:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
