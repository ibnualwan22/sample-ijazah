"use client";

import { formatDateIndo, toDateInputValue, translateDateToArabic } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ProgramSetting = {
  id: string;
  nama_indo: string;
  nama_arab: string;
  kkm: number;
  mapelList: Array<{
    id: string;
  }>;
};

type TemplateSetting = {
  id: number;
  tgl_cetak_indo: string;
  tgl_cetak_arab: string;
  tgl_mulai_indo: string | null;
  tgl_mulai_arab: string | null;
  tgl_selesai_indo: string | null;
  tgl_selesai_arab: string | null;
  nama_mudir_indo: string;
  nama_mudir_arab: string;
  jabatan_mudir_indo: string;
  jabatan_mudir_arab: string;
  teks_dufah_akbarnas_arab: string | null;
  teks_dufah_arab: string | null;
};

export function MasterDataForm({
  programList,
  template,
}: {
  programList: ProgramSetting[];
  template: TemplateSetting;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tanggalCetak, setTanggalCetak] = useState(
    toDateInputValue(template.tgl_cetak_indo) || new Date().toISOString().slice(0, 10),
  );
  const [tanggalMulai, setTanggalMulai] = useState(
    template.tgl_mulai_indo ? toDateInputValue(template.tgl_mulai_indo) : ""
  );
  const [tanggalSelesai, setTanggalSelesai] = useState(
    template.tgl_selesai_indo ? toDateInputValue(template.tgl_selesai_indo) : ""
  );
  const [templateState, setTemplateState] = useState({
    nama_mudir_indo: template.nama_mudir_indo,
    nama_mudir_arab: template.nama_mudir_arab,
    jabatan_mudir_indo: template.jabatan_mudir_indo,
    jabatan_mudir_arab: template.jabatan_mudir_arab,
    teks_dufah_akbarnas_arab: template.teks_dufah_akbarnas_arab ?? "",
    teks_dufah_arab: template.teks_dufah_arab ?? "",
  });
  const [kkmByKelas, setKkmByKelas] = useState<Record<string, string>>(() => {
    return Object.fromEntries(programList.map((program) => [program.id, String(program.kkm)]));
  });

  const previewDate = {
    indo: tanggalCetak ? formatDateIndo(tanggalCetak) : "",
    arab: tanggalCetak ? translateDateToArabic(tanggalCetak) : "",
  };

  const handleSubmit = () => {
    setMessage("");
    setError("");

    if (!tanggalCetak) {
      setError("Tanggal cetak wajib diisi.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/master-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tanggalCetak,
          tanggalMulai,
          tanggalSelesai,
          kelas: programList.map((program) => ({
            id: program.id,
            kkm: Number(kkmByKelas[program.id]),
          })),
          template: templateState,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Gagal menyimpan master data.");
        return;
      }

      setMessage("Master data berhasil diperbarui.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="neu-card-white p-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">
              Master KKM
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--color-text)]">Pengaturan kelas dan ambang kelulusan</h2>
          </div>
          <p className="max-w-md text-right text-sm leading-6 text-[var(--color-text-muted)]">
            Perubahan KKM akan langsung memengaruhi penentuan status LULUS, MUSYAROKAH, atau TIDAK_LULUS.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programList.map((program) => (
            <label key={program.id} className="rounded-[1.75rem] border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-4">
              <span className="block text-base font-bold text-[var(--color-text)]">{program.nama_indo}</span>
              <span className="mt-1 block text-xs tracking-[0.2em] text-[var(--color-text-muted)]">{program.nama_arab}</span>
              <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {program.mapelList.length} mapel
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={kkmByKelas[program.id] ?? ""}
                onChange={(event) =>
                  setKkmByKelas((current) => ({
                    ...current,
                    [program.id]: event.target.value,
                  }))
                }
                className="mt-4 w-full rounded-2xl border border-[var(--color-surface-dark)] bg-white px-4 py-3 text-center text-2xl font-black text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-6 neu-card-white p-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">
              Template Syahadah
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--color-text)]">Tanggal cetak dan identitas mudir</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Tanggal Mulai Program</span>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(event) => setTanggalMulai(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Tanggal Selesai Program</span>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(event) => setTanggalSelesai(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Tanggal Cetak Syahadah</span>
              <input
                type="date"
                value={tanggalCetak}
                onChange={(event) => setTanggalCetak(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Nama Mudir (Indonesia)</span>
              <input
                value={templateState.nama_mudir_indo}
                onChange={(event) => setTemplateState((current) => ({ ...current, nama_mudir_indo: event.target.value }))}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Nama Mudir (Arab)</span>
              <input
                dir="rtl"
                value={templateState.nama_mudir_arab}
                onChange={(event) => setTemplateState((current) => ({ ...current, nama_mudir_arab: event.target.value }))}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Jabatan Mudir (Indonesia)</span>
              <input
                value={templateState.jabatan_mudir_indo}
                onChange={(event) => setTemplateState((current) => ({ ...current, jabatan_mudir_indo: event.target.value }))}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Jabatan Mudir (Arab)</span>
              <input
                dir="rtl"
                value={templateState.jabatan_mudir_arab}
                onChange={(event) => setTemplateState((current) => ({ ...current, jabatan_mudir_arab: event.target.value }))}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Teks Duf'ah Program Reguler (Arab)</span>
              <input
                dir="rtl"
                placeholder="Contoh: الدفعة التسعون"
                value={templateState.teks_dufah_arab ?? ""}
                onChange={(event) => setTemplateState((current) => ({ ...current, teks_dufah_arab: event.target.value }))}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white font-arabic"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-[var(--color-text)]">
              <span>Teks Duf'ah Akbarnas (Arab)</span>
              <input
                dir="rtl"
                placeholder="Contoh: الدفعة ٨٩ إلى ٩٠"
                value={templateState.teks_dufah_akbarnas_arab ?? ""}
                onChange={(event) => setTemplateState((current) => ({ ...current, teks_dufah_akbarnas_arab: event.target.value }))}
                className="w-full rounded-2xl border border-[var(--color-surface-dark)] bg-[var(--color-secondary)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white font-arabic"
              />
            </label>
          </div>
        </div>
        <div className="rounded-[1.75rem] bg-[var(--color-text)] p-5 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text-subtle)]">Preview Template</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="font-semibold text-white">Tanggal cetak (Indonesia)</p>
              <p>{previewDate.indo}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3" dir="rtl">
              <p className="font-semibold text-white">التاريخ بالعربية</p>
              <p>{previewDate.arab}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="font-semibold text-white">Penanda tangan</p>
              <p>{templateState.nama_mudir_indo}</p>
              <p className="text-[var(--color-text-subtle)]">{templateState.jabatan_mudir_indo}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3" dir="rtl">
              <p className="font-semibold text-white">الموقع</p>
              <p>{templateState.nama_mudir_arab}</p>
              <p className="text-[var(--color-text-subtle)]">{templateState.jabatan_mudir_arab}</p>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-3xl border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] px-4 py-3 text-sm font-medium text-[var(--color-primary)]">{message}</div> : null}
      {error ? <div className="rounded-3xl border border-[var(--color-danger)] bg-[var(--color-danger-light)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">{error}</div> : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-dark)]"
        >
          {isPending ? "Menyimpan..." : "Simpan Master Data"}
        </button>
      </div>
    </div>
  );
}
