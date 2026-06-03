import { requirePermission } from "@/lib/permission";
import prisma from "@/lib/prisma";
import { AgendaClient } from "@/components/admin/agenda-client";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  await requirePermission("manajemen_konten");
  const agendas = await prisma.agenda.findMany({
    orderBy: { waktuMulai: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Agenda Rutinan</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Kelola jadwal kegiatan dan agenda berulang.</p>
      </div>

      <AgendaClient initialData={agendas} />
    </div>
  );
}
