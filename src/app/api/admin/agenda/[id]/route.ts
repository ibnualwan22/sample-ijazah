import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permission";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const hasPermission = await checkPermission("agenda_rutinan_edit");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
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

    const agenda = await prisma.agenda.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        waktuMulai: waktuMulai ? new Date(waktuMulai) : undefined,
        waktuSelesai: waktuSelesai ? new Date(waktuSelesai) : undefined,
        isBerulang: isBerulang,
        tipePerulangan: isBerulang ? tipePerulangan : null,
        batasPerulangan: (isBerulang && batasPerulangan) ? new Date(batasPerulangan) : null,
      },
    });

    return NextResponse.json(agenda);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update agenda" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const hasPermission = await checkPermission("agenda_rutinan_edit");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.agenda.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus agenda" }, { status: 500 });
  }
}
