import { Metadata } from "next";
import { getProgramCatalog } from "@/lib/app-data";
import { AbsensiKelasClient } from "@/components/admin/absensi-kelas-client";

import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permission";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Absen Kelas - Admin Panel",
};

export default async function AbsensiKelasPage() {
  await requirePermission("absen_kelas");
  
  // Optimasi: Jalankan fetch session dan programList secara paralel (mempercepat ~30-50%)
  const [session, programList] = await Promise.all([
    getSession(),
    getProgramCatalog()
  ]);
  
  let allowedClassIds: string[] | null = null; // null = all classes allowed
  let teacherSessions: { sesi: string, kelasId: string }[] = [];
  let allPengajarSesi: any[] = []; // Untuk Admin Backup Mode
  
  if (session) {
    if (session.role !== "ADMIN") {
      const ps = await prisma.pengajarSesi.findMany({
        where: { userId: session.userId },
        select: { kelasId: true, sesi: true }
      });
      
      // Jika user punya jadwal ngajar ATAU punya kelasId (Wali Kelas), batasi aksesnya
      if (ps.length > 0 || session.kelasId) {
        allowedClassIds = Array.from(new Set(ps.map(p => p.kelasId)));
        
        if (session.kelasId && !allowedClassIds.includes(session.kelasId)) {
          allowedClassIds.push(session.kelasId);
        }
        
        teacherSessions = ps.map(p => ({ sesi: p.sesi, kelasId: p.kelasId }));
      } else {
        // Jika tidak punya jadwal dan bukan admin, apapun rolenya
        // Set ke array kosong (akses ke 0 kelas), BUKAN null (akses ke semua kelas)
        allowedClassIds = [];
      }
    } else {
      // Jika ADMIN, ambil seluruh data penugasan pengajar untuk fitur Backup
      allPengajarSesi = await prisma.pengajarSesi.findMany({
        select: {
          sesi: true,
          kelasId: true,
          user: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      });
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black md:text-4xl ">
          Absen Kelas
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Pendataan kehadiran santri di kelas berdasarkan hissoh (sesi).
        </p>
      </div>
      <AbsensiKelasClient 
        programList={programList} 
        allowedClassIds={allowedClassIds} 
        userRole={session?.role}
        teacherSessions={teacherSessions}
        allPengajarSesi={allPengajarSesi}
      />
    </div>
  );
}
