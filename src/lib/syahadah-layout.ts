import prisma from "@/lib/prisma";

// All positionable elements in the syahadah document
export const LAYOUT_ELEMENT_KEYS = [
  "qrCode",
  "tabelNilai",
  "paragrafPembuka",
  "namaSantri",
  "teksDufah",
  "teksProgram",
  "teksPeriode",
  "rataRata",
  "predikat",
  "doaPenutup",
  "jabatanMudir",
  "stempel",
  "tandaTangan",
  "namaMudir",
  "tanggalCetak",
] as const;

export type LayoutElementKey = (typeof LAYOUT_ELEMENT_KEYS)[number];

export type ElementOffset = {
  offsetX: number; // mm
  offsetY: number; // mm
  fontSize?: number; // pt, only for namaSantri
  columns?: number; // only for tabelNilai
  colWidthDarajah?: number; // mm, only for tabelNilai
  tableWidth?: number; // %, only for tabelNilai
};

export type LayoutData = Record<LayoutElementKey, ElementOffset>;

export const ELEMENT_LABELS: Record<LayoutElementKey, string> = {
  qrCode: "QR Code",
  tabelNilai: "Tabel Nilai",
  paragrafPembuka: "Paragraf Pembuka",
  namaSantri: "Nama Santri",
  teksDufah: "Teks Duf'ah",
  teksProgram: "Teks Program",
  teksPeriode: "Teks Periode",
  rataRata: "Rata-rata",
  predikat: "Predikat",
  doaPenutup: "Doa Penutup",
  jabatanMudir: "Jabatan Mudir",
  stempel: "Stempel",
  tandaTangan: "Tanda Tangan",
  namaMudir: "Nama Mudir",
  tanggalCetak: "Tanggal Cetak",
};

export function getDefaultLayout(): LayoutData {
  const layout: Partial<LayoutData> = {};
  for (const key of LAYOUT_ELEMENT_KEYS) {
    layout[key] = { offsetX: 0, offsetY: 0 };
  }
  // Default font size for nama santri
  layout.namaSantri = { offsetX: 0, offsetY: 0, fontSize: 32 };
  // Default columns for tabelNilai
  layout.tabelNilai = { offsetX: 0, offsetY: 0, columns: 1, colWidthDarajah: 35, tableWidth: 80 };
  return layout as LayoutData;
}

/** Merge saved offsets on top of defaults (handles partial saves gracefully) */
export function mergeLayout(saved: Partial<LayoutData> | null): LayoutData {
  const base = getDefaultLayout();
  if (!saved) return base;

  for (const key of LAYOUT_ELEMENT_KEYS) {
    if (saved[key]) {
      base[key] = { ...base[key], ...saved[key] };
    }
  }
  return base;
}

/** Fetch layout for a specific riwayat, falling back to per-program, then global template */
export async function getLayoutForRiwayat(riwayatId: string, programId: string): Promise<LayoutData> {
  // 1. Try per-santri override
  const perSantri = await prisma.syahadahLayout.findUnique({
    where: { riwayatId },
  });
  if (perSantri) {
    return mergeLayout(perSantri.layoutData as Partial<LayoutData>);
  }

  // 2. Fallback to per-program template
  const perProgram = await prisma.syahadahLayout.findUnique({
    where: { programId },
  });
  if (perProgram) {
    return mergeLayout(perProgram.layoutData as Partial<LayoutData>);
  }

  // 3. Fallback to global template (riwayatId = null, programId = null)
  const global = await prisma.syahadahLayout.findFirst({
    where: { riwayatId: null, programId: null },
  });
  if (global) {
    return mergeLayout(global.layoutData as Partial<LayoutData>);
  }

  // 4. Hardcoded defaults
  return getDefaultLayout();
}

/** Fetch the global layout template (riwayatId=null, programId=null) */
export async function getGlobalLayout(): Promise<LayoutData> {
  const global = await prisma.syahadahLayout.findFirst({
    where: { riwayatId: null, programId: null },
  });
  return mergeLayout(global ? (global.layoutData as Partial<LayoutData>) : null);
}

/** Fetch layout for a specific program, falling back to global */
export async function getProgramLayout(programId: string): Promise<LayoutData> {
  const perProgram = await prisma.syahadahLayout.findUnique({
    where: { programId },
  });
  if (perProgram) {
    return mergeLayout(perProgram.layoutData as Partial<LayoutData>);
  }

  return getGlobalLayout();
}

/** Save layout (global, per-program, or per-santri) */
export async function saveLayout(
  params: { riwayatId?: string | null; programId?: string | null },
  layoutData: LayoutData
) {
  if (params.riwayatId) {
    // Per-santri: upsert by riwayatId
    await prisma.syahadahLayout.upsert({
      where: { riwayatId: params.riwayatId },
      update: { layoutData: layoutData as any },
      create: { riwayatId: params.riwayatId, programId: null, layoutData: layoutData as any },
    });
  } else if (params.programId) {
    // Per-program: upsert by programId
    await prisma.syahadahLayout.upsert({
      where: { programId: params.programId },
      update: { layoutData: layoutData as any },
      create: { riwayatId: null, programId: params.programId, layoutData: layoutData as any },
    });
  } else {
    // Global: upsert the single global record
    const existing = await prisma.syahadahLayout.findFirst({
      where: { riwayatId: null, programId: null },
    });
    if (existing) {
      await prisma.syahadahLayout.update({
        where: { id: existing.id },
        data: { layoutData: layoutData as any },
      });
    } else {
      await prisma.syahadahLayout.create({
        data: { riwayatId: null, programId: null, layoutData: layoutData as any },
      });
    }
  }
}

/** Delete override */
export async function deleteLayoutOverride(params: { riwayatId?: string | null; programId?: string | null }) {
  if (params.riwayatId) {
    await prisma.syahadahLayout.deleteMany({ where: { riwayatId: params.riwayatId } });
  } else if (params.programId) {
    await prisma.syahadahLayout.deleteMany({ where: { programId: params.programId } });
  }
}
