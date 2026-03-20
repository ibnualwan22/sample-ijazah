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

type DashboardSantri = {
  id: string;
  programNama: string;
  programId: string | null;
  kelasNama: string;
  kelasId: string | null;
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
    </div>
  );
}
