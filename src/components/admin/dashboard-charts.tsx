"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type DashboardSantri = {
  id: string;
  programNama: string;
  programId: string | null;
  kelasNama: string;
  kelasId: string | null;
  gender: string;
};

type ProgramItem = {
  id: string;
  nama_indo: string;
  kelasList: Array<{
    id: string;
    nama: string;
  }>;
};

const COLORS = [
  "#059669", "#10b981", "#34d399", "#6ee7b7", "#0ea5e9", 
  "#38bdf8", "#7dd3fc", "#8b5cf6", "#a78bfa", "#f59e0b",
  "#fbbf24", "#fcd34d", "#ef4444", "#f87171"
];

export function DashboardCharts({
  santriRows,
  programList,
}: {
  santriRows: DashboardSantri[];
  programList: ProgramItem[];
}) {
  const [isCopied, setIsCopied] = useState(false);

  const chartDataParent = useMemo(() => {
    const parentMap = new Map<string, number>();
    
    // Initialize all parent classes with 0
    programList.forEach((k) => {
      parentMap.set(k.nama_indo, 0);
    });
    
    // Add "Belum Ditempatkan"
    parentMap.set("Belum Ditempatkan", 0);

    santriRows.forEach((santri) => {
      const parentName = santri.programId === null ? "Belum Ditempatkan" : santri.programNama;
      const count = parentMap.get(parentName) || 0;
      parentMap.set(parentName, count + 1);
    });

    return Array.from(parentMap.entries()).map(([name, count]) => ({
      name,
      Jumlah: count,
    })).filter(item => item.Jumlah > 0 || item.name !== "Belum Ditempatkan"); // Only hide UNASSIGNED if 0
  }, [santriRows, programList]);

  const chartDataRuangan = useMemo(() => {
    const ruanganMap = new Map<string, number>();
    
    programList.forEach((k) => {
      if (k.kelasList.length === 0) {
        // If no ruangan, map it to parent
        ruanganMap.set(k.nama_indo, 0);
      } else {
        k.kelasList.forEach((nk) => {
          ruanganMap.set(nk.nama, 0);
        });
      }
    });
    
    ruanganMap.set("Belum Ditempatkan", 0);

    santriRows.forEach((santri) => {
      const roomName = santri.kelasId !== null 
        ? santri.kelasNama 
        : (santri.programId !== null ? santri.programNama : "Belum Ditempatkan");
      const count = ruanganMap.get(roomName) || 0;
      ruanganMap.set(roomName, count + 1);
    });

    return Array.from(ruanganMap.entries()).map(([name, count]) => ({
      name,
      value: count,
    })).filter((item) => item.value > 0);
  }, [santriRows, programList]);

  const classStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; banin: number; banat: number }>();
    
    // Initialize empty stats for all valid classes
    programList.forEach((prog) => {
      prog.kelasList.forEach((k) => {
        statsMap.set(k.nama, { total: 0, banin: 0, banat: 0 });
      });
    });

    santriRows.forEach((s) => {
      if (s.kelasId && s.kelasNama) {
        let stats = statsMap.get(s.kelasNama);
        if (!stats) {
          stats = { total: 0, banin: 0, banat: 0 };
          statsMap.set(s.kelasNama, stats);
        }
        stats.total++;
        if (s.gender === "BANIN") stats.banin++;
        else if (s.gender === "BANAT") stats.banat++;
      }
    });

    return Array.from(statsMap.entries()).map(([kelasNama, stats]) => ({
      kelasNama,
      ...stats
    })).sort((a, b) => a.kelasNama.localeCompare(b.kelasNama));
  }, [santriRows, programList]);

  const handleCopyWA = () => {
    let text = "*Rekap Data Kelas Markaz Arabiyah*\n\n";
    classStats.forEach((c) => {
      if (c.total > 0) {
        text += `- ${c.kelasNama} ${c.total} : ${c.banin} Banin`;
        if (c.banat > 0) text += ` ${c.banat} Banat`;
        text += "\n";
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast.success("Berhasil disalin ke clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      toast.error("Gagal menyalin teks");
    });
  };

  const totalSantri = santriRows.length;
  const totalAssigned = santriRows.filter(s => s.programId !== null).length;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Total Santri</p>
            <h3 className="mt-2 text-4xl font-black text-slate-900">{totalSantri}</h3>
         </div>
         <div className="rounded-[2rem] border border-slate-200 bg-emerald-600 p-6 shadow-sm flex flex-col justify-center text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200">Sudah Ditempatkan</p>
            <h3 className="mt-2 text-4xl font-black text-white">{totalAssigned}</h3>
         </div>
         <div className="rounded-[2rem] border border-slate-200 bg-rose-50 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-700">Belum Ditempatkan</p>
            <h3 className="mt-2 text-4xl font-black text-rose-900">{totalSantri - totalAssigned}</h3>
         </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Distribusi per Program</h3>
            <p className="text-sm text-slate-500">Jumlah santri di masing-masing program/master kelas.</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataParent} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#64748b" }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#64748b" }} 
                />
                <Tooltip 
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="Jumlah" 
                  fill="#059669" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Distribusi per Ruangan</h3>
            <p className="text-sm text-slate-500">Sebaran jumlah santri di masing-masing rombongan belajar.</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataRuangan}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => percent !== undefined ? `${name} (${(percent * 100).toFixed(0)}%)` : name}
                  labelLine={false}
                >
                  {chartDataRuangan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Rincian Data Kelas</h3>
            <p className="text-sm text-slate-500">Tabel jumlah santri beserta sebaran Banin dan Banat.</p>
          </div>
          <button 
            onClick={handleCopyWA}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            {isCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {isCopied ? "Tersalin!" : "Salin Format WA"}
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Kelas</th>
                <th className="px-6 py-4 text-center">Total Santri</th>
                <th className="px-6 py-4 text-center text-emerald-700 bg-emerald-50">Banin</th>
                <th className="px-6 py-4 text-center text-rose-700 bg-rose-50">Banat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStats.map((c) => (
                <tr key={c.kelasNama} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{c.kelasNama}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">{c.total}</td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-700 bg-emerald-50/30">{c.banin}</td>
                  <td className="px-6 py-4 text-center font-bold text-rose-700 bg-rose-50/30">{c.banat}</td>
                </tr>
              ))}
              {classStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Belum ada data kelas yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
