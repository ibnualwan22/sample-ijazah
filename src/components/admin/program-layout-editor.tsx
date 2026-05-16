"use client";

import { SyahadahEditor } from "@/components/syahadah-editor";
import { LayoutData } from "@/lib/syahadah-layout";

type ProgramLayoutEditorClientProps = {
  initialLayout: LayoutData;
  sampleData: any;
  sampleQrUrl: string;
  programId: string | null;
  programName: string;
};

export function ProgramLayoutEditorClient({
  initialLayout,
  sampleData,
  sampleQrUrl,
  programId,
  programName,
}: ProgramLayoutEditorClientProps) {
  return (
    <SyahadahEditor
      qrUrl={sampleQrUrl}
      data={sampleData}
      initialLayout={initialLayout}
      riwayatId={null}
      programId={programId}
      mode={programId ? "per-program" : "global"}
      backHref="/layout-editor"
      backLabel="← Kembali ke Pilihan Program"
      titleLabel={`Layout Editor — ${programName}`}
    />
  );
}
