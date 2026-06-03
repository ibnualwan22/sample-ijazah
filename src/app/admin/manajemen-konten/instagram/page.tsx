import { requirePermission } from "@/lib/permission";
import prisma from "@/lib/prisma";
import { InstagramClient } from "@/components/admin/instagram-client";

export const dynamic = "force-dynamic";

export default async function InstagramPage() {
  await requirePermission("manajemen_konten");
  const posts = await prisma.instagramPost.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Konten Instagram</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Kelola rujukan postingan Instagram untuk ditampilkan di aplikasi mobile.</p>
      </div>

      <InstagramClient initialData={posts} />
    </div>
  );
}
