import prisma from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Search } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSantriData() {
  try {
    const res = await fetch("https://ppdb-markaz.vercel.app/api/santri", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json();
  } catch (error) {
    console.error("Error fetching santri API", error);
    return [];
  }
}

async function getLocalIjazahMap() {
  try {
    const ijazahs = await prisma.ijazah.findMany({
      select: { santriId: true },
    });
    return new Set(ijazahs.map((i: any) => i.santriId));
  } catch (error) {
    console.error("Database connection failed", error);
    return new Set();
  }
}

export default async function AdminDashboard() {
  const [santriData, ijazahMap] = await Promise.all([
    getSantriData(),
    getLocalIjazahMap(),
  ]);

  // Transform data
  const transformedSantri = santriData.map((s: any) => {
    const assignedRiwayat = s.riwayat?.find(
      (r: any) => r.status === "ASSIGNED"
    );
    const sakan = assignedRiwayat?.lemari?.kamar?.sakan?.nama || "-";
    const kamar = assignedRiwayat?.lemari?.kamar?.nama || "-";
    const lemari = assignedRiwayat?.lemari?.nomor || "-";
    const hasIjazah = ijazahMap.has(s.id);

    return {
      id: s.id,
      nama: s.nama,
      gender: s.gender,
      lokasi: `${sakan} / ${kamar} / ${lemari}`,
      hasIjazah,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 pb-32 pt-10 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Sistem Ijazah Online
          </h1>
          <p className="text-teal-100 mt-2 text-lg font-medium">
            Markaz Arabiyah - Manajemen Sertifikat & Nilai
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 -mt-24">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              Data Master Santri
              <span className="bg-teal-100 text-teal-800 text-sm py-1 px-3 rounded-full font-semibold">
                {transformedSantri.length} Total
              </span>
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-sm">
                  <th className="py-4 px-6">Nama Lengkap</th>
                  <th className="py-4 px-6 text-center">Gender</th>
                  <th className="py-4 px-6"><div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> Lokasi (Sakan/Kmr/Lmr)</div></th>
                  <th className="py-4 px-6 text-center">Status Ijazah</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transformedSantri.map((santri: any) => (
                  <tr
                    key={santri.id}
                    className="hover:bg-slate-50/80 transition duration-150 ease-in-out group"
                  >
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {santri.nama}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${santri.gender === 'BANIN' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                        {santri.gender}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">{santri.lokasi}</td>
                    <td className="py-4 px-6 text-center">
                      {santri.hasIjazah ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selesai</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          <span>Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {santri.hasIjazah ? (
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/input/${santri.id}`}
                            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/ijazah/${santri.id}`}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-sm shadow-teal-200"
                          >
                            Ijazah
                          </Link>
                          <Link
                            href={`/cetak/${santri.id}`}
                            className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-sm shadow-amber-200"
                          >
                            🖨 Syahadah
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/input/${santri.id}`}
                          className="inline-block bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                        >
                          Input Nilai
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {transformedSantri.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Tidak ada data santri ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
