import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permission";

export async function GET() {
  const session = await getSession();
  const hasPermission = await checkPermission("agenda_rutinan");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await getSession();
  const hasPermission = await checkPermission("agenda_rutinan_edit");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
