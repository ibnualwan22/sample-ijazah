"use client";

import { SyahadahEditor } from "@/components/syahadah-editor";
import { LayoutData } from "@/lib/syahadah-layout";

type GlobalLayoutEditorClientProps = {
  initialLayout: LayoutData;
  sampleData: any;
  sampleQrUrl: string;
};

export function GlobalLayoutEditorClient({
  initialLayout,
  sampleData,
  sampleQrUrl,
}: GlobalLayoutEditorClientProps) {
  return (
    <SyahadahEditor
      qrUrl={sampleQrUrl}
      data={sampleData}
      initialLayout={initialLayout}
      riwayatId={null}
      programId={null}
      mode="global"
      backHref="/admin/syahadah"
      backLabel="← Kembali ke Data Syahadah"
    />
  );
}
