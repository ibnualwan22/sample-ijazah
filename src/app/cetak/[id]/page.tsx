import { getCertificateData } from "@/lib/app-data";
import { getBaseUrl } from "@/lib/base-url";
import { notFound } from "next/navigation";
import { SyahadahDocument } from "@/components/syahadah-document";
import { PrintToolbar } from "@/components/print-toolbar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CetakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCertificateData(id);

  if (!data) {
    notFound();
  }

  if (data.status === "TIDAK_LULUS") {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-600">Syahadah Terkunci</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Cetak Syahadah belum tersedia</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Status santri masih TIDAK_LULUS karena Tasmi&apos;. Silakan lengkapi data di halaman input nilai terlebih dahulu.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Kembali ke Dashboard
            </Link>
            <Link
              href={`/admin/input-nilai/${id}`}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Lengkapi Nilai
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = await getBaseUrl();
  const qrUrl = `${baseUrl}/ijazah/${id}`;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #171717; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: 330mm 215mm; landscape; margin: 0; }
        }
      `}</style>

      <div className="min-h-screen bg-neutral-900 px-4 py-8 print:bg-white print:p-0">
        <PrintToolbar backHref="/admin/dashboard" backLabel="Kembali ke Dashboard" />
        <div className="flex flex-col items-center gap-10 print:gap-0">
          <SyahadahDocument qrUrl={qrUrl} data={data as any} />
        </div>
      </div>
    </>
  );
}
