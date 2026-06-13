import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permission";

export async function GET() {
  const session = await getSession();
  const hasPermission = await checkPermission("konten_instagram");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.instagramPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat instagram post" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  const hasPermission = await checkPermission("konten_instagram_edit");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      judul,
      url,
      isActive,
    } = body;

    if (!url) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 });
    }

    const post = await prisma.instagramPost.create({
      data: {
        judul,
        url,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan post instagram" }, { status: 500 });
  }
}
