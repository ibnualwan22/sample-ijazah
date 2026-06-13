import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permission";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const hasPermission = await checkPermission("konten_instagram_edit");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const {
      judul,
      url,
      isActive,
    } = body;

    const post = await prisma.instagramPost.update({
      where: { id },
      data: {
        judul,
        url,
        isActive,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Gagal update post instagram" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const hasPermission = await checkPermission("konten_instagram_edit");
  if (!session || !hasPermission) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.instagramPost.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus post instagram" }, { status: 500 });
  }
}
