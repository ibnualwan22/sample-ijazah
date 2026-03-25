import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const agendas = await prisma.agenda.findMany({
      orderBy: { waktuMulai: "desc" },
    });
    return NextResponse.json(agendas);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat agenda" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      judul,
      deskripsi,
      waktuMulai,
      waktuSelesai,
      isBerulang,
      tipePerulangan,
      batasPerulangan,
    } = body;

    if (!judul || !waktuMulai || !waktuSelesai) {
      return NextResponse.json({ error: "Judul dan Waktu harus diisi" }, { status: 400 });
    }

    const agenda = await prisma.agenda.create({
      data: {
        judul,
        deskripsi,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        isBerulang: isBerulang || false,
        tipePerulangan: isBerulang ? tipePerulangan : null,
        batasPerulangan: (isBerulang && batasPerulangan) ? new Date(batasPerulangan) : null,
      },
    });

    return NextResponse.json(agenda, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat agenda" }, { status: 500 });
  }
}
