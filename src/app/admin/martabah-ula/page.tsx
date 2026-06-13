import { getDashboardSantriRows } from "@/lib/app-data";
import { MartabahUlaClient } from "@/components/admin/martabah-ula-client";
import { Metadata } from "next";
import { requirePermission } from "@/lib/permission";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Martabah Ula - Admin Panel",
};

export default async function MartabahUlaPage() {
  await requirePermission("martabah_ula");
  const allRows = await getDashboardSantriRows();
  const santriRows = allRows.filter((santri: any) => santri.isAktif);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black md:text-4xl ">
          Martabah Ula
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Pusat informasi kelulusan dengan predikat penghargaan Lulusan Terbaik (Martabah Ula) untuk setiap program pada Duf'ah berjalan.
        </p>
      </div>

      <MartabahUlaClient santriRows={santriRows as any} />
    </div>
  );
}
