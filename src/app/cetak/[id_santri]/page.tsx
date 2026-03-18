"use client";

import { use, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function CetakPage({
  params,
}: {
  params: Promise<{ id_santri: string }>;
}) {
  const resolvedParams = use(params);
  const santriId = resolvedParams.id_santri;

  const [santriData, setSantriData] = useState<any>(null);
  const [localData, setLocalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(`${window.location.origin}/ijazah/${santriId}`);
    async function fetchData() {
      try {
        const [santriRes, localRes] = await Promise.all([
          fetch("https://ppdb-markaz.vercel.app/api/santri"),
          fetch(`/api/ijazah?santriId=${santriId}`),
        ]);
        const santriList = await santriRes.json();
        const currentSantri = santriList.find((s: any) => s.id === santriId);
        setSantriData(currentSantri);
        const localDataJson = await localRes.json();
        if (localDataJson && !localDataJson.error) setLocalData(localDataJson);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [santriId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-200">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!santriData || !localData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <p className="text-2xl font-bold text-red-600 mb-2">البيانات غير مكتملة</p>
        <a href="/" className="bg-amber-700 text-white px-5 py-2 rounded-lg mt-4">Dashboard</a>
      </div>
    );
  }

  const printDate = format(new Date(), "d MMMM yyyy", { locale: ar });
  const tanggalMulai = localData.tanggalMulai
    ? format(new Date(localData.tanggalMulai), "d MMMM yyyy", { locale: ar })
    : "—";
  const tanggalSampai = localData.tanggalSampai
    ? format(new Date(localData.tanggalSampai), "d MMMM yyyy", { locale: ar })
    : "—";

  const nilaiMapel = [
    { label: "مفردات", nilai: localData.presensi?.toFixed(0) ?? "—" },
    { label: "تعبيرات", nilai: localData.qawaid?.toFixed(0) ?? "—" },
    { label: "تراكيب", nilai: localData.qiraah?.toFixed(0) ?? "—" },
    { label: "كلام", nilai: localData.tasmi?.toFixed(0) ?? "—" },
    { label: "فلوغ", nilai: "—" },
    { label: "حضور", nilai: localData.presensi?.toFixed(0) ?? "—" },
  ];

  // تحويل الأرقام الغربية إلى أرقام عربية
  const toArabic = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined || value === "—") return "—";
    return String(value).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
  };

  // Format tanggal arab (tanggal cetak)
  const cetakDate = format(new Date(), "d MMMM yyyy", { locale: ar });
  const cetakDateAr = toArabic(cetakDate);

  // Font family Arab
  const arabicFont = "'Scheherazade New', 'Amiri', serif";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;600;700&display=swap');
        html, body { margin: 0; padding: 0; background: #94a3b8; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: 330mm 215mm landscape; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print bg-slate-800 py-3 px-6 flex justify-between items-center print:hidden">
        <a href={`/ijazah/${santriId}`} className="text-teal-400 hover:underline text-sm font-medium">
          ← Kembali ke Ijazah Online
        </a>
        <button
          onClick={() => window.print()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
        >
          🖨 Cetak Syahadah (F4 Landscape)
        </button>
        <a href="/" className="text-slate-400 hover:underline text-sm">Dashboard</a>
      </div>

      {/* Centering wrapper */}
      <div className="flex items-center justify-center py-8 min-h-[calc(100vh-58px)] print:min-h-0 print:p-0">

        <div
          style={{
            width: "330mm",
            height: "215mm",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 12px 48px rgba(0,0,0,0.35)",
            fontFamily: arabicFont,
            flexShrink: 0,
            background: "white",
          }}
        >
          {/* LAYER 0 — Background */}
          <img
            src="/images/syahadah-bg.png"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              zIndex: 0,
              pointerEvents: "none",
              display: "block",
            }}
          />

          {/* ─── QR CODE (kanan atas, sejajar kolom kanan) ─── */}
          <div
            style={{
              position: "absolute",
              top: "70mm",
              right: "8mm",
              width: "88mm",
              zIndex: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p style={{
              fontSize: "11pt",
              color: "#000",
              textAlign: "center",
              marginBottom: "5mm",
              marginTop: 0,
              fontFamily: arabicFont,
              direction: "rtl",
            }}>
              امسح الكود للتحقق من الأصالة
            </p>
            {baseUrl && (
              <QRCodeSVG
                value={baseUrl}
                size={100}
                level="H"
                imageSettings={{ src: "/images/logo.png", height: 35, width: 35, excavate: true }}
              />
            )}
          </div>

          {/* ─── TABEL NILAI (kanan bawah) ─── */}
          <div
            style={{
              position: "absolute",
              top: "130mm",
              right: "0mm",
              width: "90mm",
              zIndex: 3,
              fontFamily: arabicFont,
            }}
          >
            <table
              style={{
                width: "80%",
                borderCollapse: "collapse",
                fontSize: "13pt",
                direction: "rtl",
                border: "1px solid #000",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={2}
                    style={{
                      padding: "1.5mm 3mm",
                      textAlign: "center",
                      fontWeight: "500",
                      color: "#000",
                      border: "1px solid #000",
                      fontSize: "15pt",
                    }}
                  >
                    حصيلة نتائج الطالب/الطالبة
                  </th>
                </tr>
                <tr>
                  <th style={{
                    padding: "1mm 3mm",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1a0e00",
                    border: "1.2px solid #000",
                    fontSize: "13pt",
                  }}>
                    المادة
                  </th>
                  <th style={{
                    padding: "1mm 2mm",
                    textAlign: "center",
                    fontWeight: "700",
                    color: "#1a0e00",
                    border: "1.2px solid #000",
                    width: "35mm", //tandai
                    fontSize: "13pt",
                  }}>
                    الدرجة
                  </th>
                </tr>
              </thead>
              <tbody>
                {nilaiMapel.map((m, i) => (
                  <tr key={i}>
                    <td style={{
                      padding: "1mm 3mm",
                      textAlign: "center",
                      color: "#1a0e00",
                      border: "1px solid #000",
                      fontSize: "13pt",
                    }}>
                      {m.label}
                    </td>
                    <td style={{
                      padding: "1mm 2mm",
                      textAlign: "center",
                      fontWeight: "700",
                      color: "#1a0e00",
                      border: "1px solid #000",
                      fontSize: "13pt",
                    }}>
                      {toArabic(m.nilai)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── KONTEN UTAMA SYAHADAH ─── */}
          <div
            dir="rtl"
            style={{
              position: "absolute",
              top: "72mm",
              left: "55%",
              transform: "translateX(-62%)",
              width: "175mm",
              bottom: "10mm",
              zIndex: 3,
              display: "flex",
              flexDirection: "column",
              overflow: "visible",
            }}
          >
            {/* Paragraf pembuka */}
            <p style={{
              fontSize: "15pt",
              lineHeight: 2,
              color: "#1a0e00",
              textAlign: "justify",
              marginBottom: "4mm",
              marginTop: 0,
              fontFamily: arabicFont,
            }}><p
              dir="rtl"
              style={{
                textAlign: 'center',
                marginLeft: '10px',
                marginRight: '40px',
                marginTop: '27px',
                fontFamily: arabicFont,
              }}
            >
                بعد الوصية بتقوى الله واتباع سنة رسول الله، قرر مركز العربية بباري كديري إندونيسيا،
                منح شهادة الاستكمال للطالب/الطالبة :
              </p>
            </p>

            {/* Nama santri — hijau besar */}
            <div style={{ textAlign: "center", marginBottom: "2mm", marginLeft: "50px" }}>
              <span style={{
                fontSize: "32pt",
                fontWeight: "900",
                color: "#1a6b1a",
                fontFamily: "Georgia, 'Times New Roman', serif",
                letterSpacing: "0.01em",
                lineHeight: 1,
                display: "inline-block",
              }}>
                {santriData.nama}
              </span>
            </div>

            {/* Dafaa */}
            <p style={{ fontSize: "13pt", lineHeight: 2, color: "#1a0e00", textAlign: "justify", margin: 0, marginRight: "70px", fontFamily: arabicFont }}>
              وذلك لإكماله/لإكمالها الدراسات والامتحانات التي أقيمت في الدفعة{" "}
              <strong style={{ color: "#8B1A1A" }}>السابعة والثمانين</strong>
            </p>

            {/* Program — 18pt */}
            <p style={{
              fontSize: "13pt",
              lineHeight: 2,
              color: "#1a0e00",
              textAlign: "center",
              margin: 0,
              fontFamily: arabicFont,
            }}>
              برنامج <strong style={{ color: "#8B1A1A", textDecoration: "underline" }}>الإعداد الأول</strong>
            </p>

            {/* Periode — 18pt */}
            <p
              style={{
                fontSize: "13pt",
                lineHeight: 2,
                fontWeight: "700",
                textAlign: "center",
                margin: 0,
                fontFamily: arabicFont,
              }}
            >
              <span style={{ color: "#1a0e00" }}>
                التي تقام خلال فترات{" "}
              </span>

              <strong style={{ color: "#8B1A1A" }}>
                {tanggalMulai}
              </strong>

              <span style={{ color: "#8B1A1A" }}>
                {" "}إلى{" "}
              </span>

              <strong style={{ color: "#8B1A1A" }}>
                {tanggalSampai}
              </strong>
            </p>

            {/* Nilai & Predikat & Doa */}
            <p style={{ fontSize: "15pt", lineHeight: 2., color: "#1a0e00", textAlign: "center", margin: 0, fontFamily: arabicFont }}>
              بمعدل تراكمي عام (<strong>{toArabic(localData.nilaiAkumulatif?.toFixed(0))}</strong>)
            </p>
            <p style={{ fontSize: "15pt", lineHeight: 2, color: "#1a0e00", textAlign: "center", margin: 0, fontFamily: arabicFont }}>
              وبتقدير <strong style={{ color: "#8B1A1A", textDecoration: "underline" }}>{localData.predikat}</strong>
            </p>
            <p style={{ fontSize: "15pt", lineHeight: 2, color: "#1a0e00", textAlign: "center", fontStyle: "italic", margin: 0, fontFamily: arabicFont }}>
              نسأل الله أن يوفقه/يوفقها لخدمة الإسلام والعلم
            </p>

            {/* Tanda tangan */}
            <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "center", minWidth: "55mm", position: "relative" }}>
                <p style={{ fontSize: "15pt", color: "#1a0e00", marginBottom: "2mm", marginTop: -50, marginLeft: "-39mm", fontFamily: arabicFont }}>
                  الرئيس العام بمركز العربية
                </p>
                <div style={{ position: "relative", height: "19mm", marginBottom: "1mm" }}>
                  <img
                    src="/images/stamp.png"
                    alt="Stempel"
                    style={{
                      position: "absolute",
                      left: "-29mm",
                      bottom: "-13mm",
                      height: "40mm",
                      objectFit: "contain",
                      opacity: 0.88,
                      zIndex: 3,
                    }}
                  />
                  <img
                    src="/images/signature.png"
                    alt="Tanda Tangan"
                    style={{
                      position: "absolute",
                      left: "-29mm",
                      bottom: "-2mm",
                      height: "25mm",
                      objectFit: "contain",
                      zIndex: 1,
                    }}
                  />
                </div>
                <p style={{ fontSize: "15pt", fontWeight: "400", color: "#1a0e00", paddingTop: "1mm", margin: 0, marginLeft: "-50mm", fontFamily: arabicFont }}>
                  ريكو أندريان، البكالوريوس
                </p>
              </div>
            </div>
          </div>

          {/* ─── TANGGAL CENTER-BOTTOM (menimpa teks صدرت في باري بتاريخ di bg) ─── */}
          <div
            style={{
              position: "absolute",
              bottom: "8mm",
              left: "45%",
              transform: "translateX(-50%)",
              zIndex: 4,
              direction: "rtl",
              fontFamily: arabicFont,
            }}
          >
            <p style={{ fontSize: "13pt", color: "#1a0e00", margin: 0, whiteSpace: "nowrap" }}>
              {cetakDateAr} م
            </p>
          </div>

        </div>
      </div>
    </>
  );
}