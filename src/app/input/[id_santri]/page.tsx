"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Calculator } from "lucide-react";
import { format } from "date-fns";

export default function InputPage({ params }: { params: Promise<{ id_santri: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const santriId = resolvedParams.id_santri;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [santriName, setSantriName] = useState("");

  const [formData, setFormData] = useState({
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    programPeminatan: "Nahwu Shorof",
    tanggalMulai: "",
    tanggalSampai: "",
    presensi: "",
    qawaid: "",
    qiraah: "",
    tasmi: "",
  });

  const [calc, setCalc] = useState({ nilai: 0, predikat: "-" });

  useEffect(() => {
    async function fetchData() {
      try {
        const [santriRes, localRes] = await Promise.all([
          fetch("https://ppdb-markaz.vercel.app/api/santri"),
          fetch(`/api/ijazah?santriId=${santriId}`),
        ]);

        const santriList = await santriRes.json();
        const currentSantri = santriList.find((s: any) => s.id === santriId);
        
        if (currentSantri) setSantriName(currentSantri.nama);

        const localData = await localRes.json();
        if (localData && !localData.error) {
          setFormData({
            tempatLahir: localData.tempatLahir || "",
            tanggalLahir: localData.tanggalLahir ? format(new Date(localData.tanggalLahir), "yyyy-MM-dd") : "",
            alamat: localData.alamat || "",
            programPeminatan: localData.programPeminatan || "Nahwu Shorof",
            tanggalMulai: localData.tanggalMulai ? format(new Date(localData.tanggalMulai), "yyyy-MM-dd") : "",
            tanggalSampai: localData.tanggalSampai ? format(new Date(localData.tanggalSampai), "yyyy-MM-dd") : "",
            presensi: localData.presensi?.toString() || "",
            qawaid: localData.qawaid?.toString() || "",
            qiraah: localData.qiraah?.toString() || "",
            tasmi: localData.tasmi?.toString() || "",
          });
          setCalc({
            nilai: localData.nilaiAkumulatif || 0,
            predikat: localData.predikat || "-",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [santriId]);

  // Recalculate whenever grades change
  useEffect(() => {
    const p = parseFloat(formData.presensi) || 0;
    const q = parseFloat(formData.qawaid) || 0;
    const r = parseFloat(formData.qiraah) || 0;
    const t = parseFloat(formData.tasmi) || 0;

    const avg = (p + q + r + t) / 4;
    let pred = "Maqbul";
    if (avg >= 90) pred = "Mumtaz";
    else if (avg >= 80) pred = "Jayyid Jiddan";
    else if (avg >= 70) pred = "Jayyid";
    else if (avg >= 60) pred = "Maqbul";
    else pred = "Rasib";

    setCalc({ nilai: avg, predikat: pred });
  }, [formData.presensi, formData.qawaid, formData.qiraah, formData.tasmi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ijazah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santriId,
          ...formData,
        }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        alert("Gagal menyimpan data!");
      }
    } catch (err) {
      alert("Error connection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Input Data Ijazah - {santriName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Diri */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-teal-800 mb-4 border-b border-teal-100 pb-2">Informasi Data Diri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
                <input required name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                <input type="date" required name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea required name="alamat" value={formData.alamat} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
              </div>
            </div>
          </div>

          {/* Akademik */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-teal-800 mb-4 border-b border-teal-100 pb-2">Informasi Akademik</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Program Peminatan</label>
                <select name="programPeminatan" value={formData.programPeminatan} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white">
                  <option value="Takhossus Nahwu">Takhossus Nahwu</option>
                  <option value="Nahwu Shorof">Nahwu Shorof</option>
                  <option value="Muhadatsah">Muhadatsah</option>
                  <option value="Persiapan Timur Tengah">Persiapan Timur Tengah</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                <input type="date" required name="tanggalMulai" value={formData.tanggalMulai} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Sampai</label>
                <input type="date" required name="tanggalSampai" value={formData.tanggalSampai} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition" />
              </div>
            </div>
          </div>

          {/* Nilai */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-teal-800 mb-4 border-b border-teal-100 pb-2">Input Nilai Evaluasi (0-100)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Presensi</label>
                <input type="number" min="0" max="100" required name="presensi" value={formData.presensi} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-center font-bold text-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qawaid</label>
                <input type="number" min="0" max="100" required name="qawaid" value={formData.qawaid} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-center font-bold text-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qira'ah</label>
                <input type="number" min="0" max="100" required name="qiraah" value={formData.qiraah} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-center font-bold text-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tasmi'</label>
                <input type="number" min="0" max="100" required name="tasmi" value={formData.tasmi} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-center font-bold text-lg" />
              </div>
            </div>

            {/* Auto Calculate Display */}
            <div className="mt-8 bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3 text-slate-700">
                <Calculator className="w-6 h-6 text-teal-600" />
                <span className="font-semibold">Perhitungan Otomatis</span>
              </div>
              <div className="flex gap-6 mt-4 md:mt-0 text-center">
                <div>
                  <div className="text-sm text-slate-500 font-medium">Nilai Akumulatif</div>
                  <div className="text-2xl font-black text-slate-800">{calc.nilai.toFixed(1)}</div>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Predikat</div>
                  <div className={`text-xl font-black py-1 px-3 rounded-lg ${calc.predikat === 'Mumtaz' ? 'text-emerald-700 bg-emerald-100' : 'text-blue-700 bg-blue-100'}`}>{calc.predikat}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 shadow-slate-100 pt-2">
            <Link href="/" className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition">
              Batal
            </Link>
            <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-xl font-medium transition shadow-lg shadow-teal-200 disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
