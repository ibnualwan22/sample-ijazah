import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveDufahName } from "@/lib/absensi";

export async function GET() {
  try {
    const activeDufahName = await getActiveDufahName();

    if (!activeDufahName) {
      return NextResponse.json({ activeDufah: null, activeUsbu: null, usbuLabel: "Tidak Ada Aktif" });
    }

    const dufah = await prisma.dufah.findUnique({ where: { nama: activeDufahName } });

    if (!dufah) {
      return NextResponse.json({ activeDufah: activeDufahName, activeUsbu: 1, usbuLabel: "Usbu' 1" });
    }

    let activeUsbu = dufah.currentUsbu || 1;
    let usbuLabel = "Usbu' 1";

    if (activeUsbu === 1) usbuLabel = "Usbu' 1";
    else if (activeUsbu === 2) usbuLabel = "Usbu' 2";
    else if (activeUsbu === 3) usbuLabel = "Nihai";
    else if (activeUsbu >= 4) {
      activeUsbu = 4;
      usbuLabel = "Selesai";
    }

    return NextResponse.json({
      activeDufah: activeDufahName,
      activeUsbu,
      usbuLabel,
    });
  } catch (error) {
    console.error("Error active context:", error);
    return NextResponse.json({ error: "Gagal mengambil konteks aktif" }, { status: 500 });
  }
}
