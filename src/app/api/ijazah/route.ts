import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      santriId,
      tempatLahir,
      tanggalLahir,
      alamat,
      programPeminatan,
      tanggalMulai,
      tanggalSampai,
      presensi,
      qawaid,
      qiraah,
      tasmi,
    } = body;

    // Validate
    if (!santriId) return NextResponse.json({ error: "Missing santriId" }, { status: 400 });

    const p = parseFloat(presensi);
    const q = parseFloat(qawaid);
    const r = parseFloat(qiraah);
    const t = parseFloat(tasmi);

    const nilaiAkumulatif = (p + q + r + t) / 4;
    
    let predikat = "Maqbul";
    if (nilaiAkumulatif >= 90) predikat = "Mumtaz";
    else if (nilaiAkumulatif >= 80) predikat = "Jayyid Jiddan";
    else if (nilaiAkumulatif >= 70) predikat = "Jayyid";
    else if (nilaiAkumulatif >= 60) predikat = "Maqbul";
    else predikat = "Rasib";

    const ijazah = await prisma.ijazah.upsert({
      where: { santriId },
      update: {
        tempatLahir,
        tanggalLahir: new Date(tanggalLahir),
        alamat,
        programPeminatan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSampai: new Date(tanggalSampai),
        presensi: p,
        qawaid: q,
        qiraah: r,
        tasmi: t,
        nilaiAkumulatif,
        predikat,
      },
      create: {
        santriId,
        tempatLahir,
        tanggalLahir: new Date(tanggalLahir),
        alamat,
        programPeminatan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSampai: new Date(tanggalSampai),
        presensi: p,
        qawaid: q,
        qiraah: r,
        tasmi: t,
        nilaiAkumulatif,
        predikat,
      },
    });

    return NextResponse.json({ success: true, data: ijazah });
  } catch (error: any) {
    console.error("Ijazah POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const santriId = searchParams.get('santriId');
  
  if (!santriId) return NextResponse.json({ error: "Missing santriId" }, { status: 400 });
  
  try {
    const data = await prisma.ijazah.findUnique({
      where: { santriId }
    });
    return NextResponse.json(data || null);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
