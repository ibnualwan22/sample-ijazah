import { requirePermission } from "@/lib/permission";
import { NilaiKosongClient } from "@/components/admin/nilai-kosong-client";

export const dynamic = "force-dynamic";

export default async function NilaiKosongPage() {
  await requirePermission("monitor_nilai_kosong");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">
          Monitoring Penilaian
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[var(--color-text)]">Nilai Belum Diinput</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Menampilkan santri yang masih memiliki nilai kosong sesuai Usbu' yang sedang dibuka.
        </p>
      </div>

      <NilaiKosongClient />
    </div>
  );
}
