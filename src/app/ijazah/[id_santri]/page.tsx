"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { QRCodeCanvas } from "qrcode.react";

export default function IjazahPage({ params }: { params: Promise<{ id_santri: string }> }) {
  const resolvedParams = use(params);
  const santriId = resolvedParams.id_santri;

  const [santriData, setSantriData] = useState<any>(null);
  const [localData, setLocalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
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

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );

  if (!santriData || !localData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Data Belum Lengkap</h1>
        <p className="text-slate-600 mb-6">
          Silakan pastikan data Input Nilai telah diisi sebelumnya.
        </p>
        <Link href="/" className="bg-teal-600 hover:bg-teal-700 font-medium text-white px-6 py-2 rounded-lg">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const handlePrint = () => window.print();
  const printDate = format(new Date(), "dd MMMM yyyy", { locale: id });

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${santriData?.nama?.replace(/\\s+/g, '_') || "Ijazah"}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const dataRows = [
    { label: "Nama Lengkap", value: santriData.nama, bold: true },
    {
      label: "Tempat, Tanggal Lahir",
      value: `${localData.tempatLahir}, ${format(new Date(localData.tanggalLahir), "dd MMMM yyyy", { locale: id })}`,
    },
    { label: "Alamat", value: localData.alamat },
    { label: "Program Peminatan", value: localData.programPeminatan },
    { label: "Mulai", value: format(new Date(localData.tanggalMulai), "dd MMMM yyyy", { locale: id }) },
    { label: "Sampai", value: format(new Date(localData.tanggalSampai), "dd MMMM yyyy", { locale: id }) },
  ];

  const gradeRows = [
    { label: "Presensi", value: localData.presensi.toFixed(0) },
    { label: "Qawaid", value: localData.qawaid.toFixed(0) },
    { label: "Qiraah", value: localData.qiraah.toFixed(0) },
    { label: "Tasmi'", value: localData.tasmi.toFixed(0) },
    { label: "Nilai Akumulatif", value: localData.nilaiAkumulatif.toFixed(1), bold: true },
    { label: "Predikat", value: localData.predikat, bold: true },
  ];

  const tdLabel: React.CSSProperties = {
    width: "44mm",
    padding: "1mm 2mm",
    verticalAlign: "top",
    fontSize: "10pt",
    color: "#111",
    borderRight: "1px solid #bbb",
  };
  const tdColon: React.CSSProperties = {
    width: "5mm",
    padding: "1mm 0",
    verticalAlign: "top",
    fontSize: "10pt",
    color: "#111",
    borderRight: "1px solid #bbb",
  };
  const tdValue: React.CSSProperties = {
    padding: "1mm 2mm",
    verticalAlign: "top",
    fontSize: "10pt",
    color: "#111",
  };

  return (
    <div
      className="min-h-screen bg-slate-300 py-10 px-4 print:p-0 print:bg-white flex flex-col items-center"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Action Bar */}
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-sans font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition font-sans font-medium text-sm"
          >
            <Download className="w-4 h-4" /> Download QR
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg shadow-sm transition font-sans font-medium text-sm"
          >
            <Printer className="w-4 h-4" /> Cetak Ijazah (A4)
          </button>
        </div>
      </div>

      {/* Hidden QR Code Canvas (500px resolution with logo) */}
      <div style={{ display: "none" }}>
        <QRCodeCanvas
          id="qr-canvas"
          value={url}
          size={500}
          level="H"
          imageSettings={{
            src: "/images/logo.png",
            height: 120,
            width: 120,
            excavate: true,
          }}
        />
      </div>

      {/* A4 Page */}
      <div
        ref={printRef}
        className="relative bg-white shadow-2xl overflow-hidden print:shadow-none"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        {/* ── LAYER 0: Background border ornamen ── */}
        {/* Rename: doc_image1.png → public/images/bg-border.png */}
        <img
          src="/images/bg-border.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* ── LAYER 1: Watermark tengah ── */}
        {/* Rename: doc_image6.png → public/images/watermark.png */}
        <img
          src="/images/watermark.png"
          alt=""
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "120mm",
            height: "120mm",
            objectFit: "contain",
            opacity: 0.06,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* ── LAYER 3: Logo pojok kanan atas ── */}
        {/* Rename: doc_image5.png → public/images/logo-corner.png */}


        {/* ── KONTEN UTAMA ── */}
        <div
          className="relative flex flex-col"
          style={{ padding: "14mm 20mm 12mm 20mm", zIndex: 2, minHeight: "297mm" }}
        >

          {/* ── HEADER ── */}
          <div className="flex flex-col items-center text-center" style={{ marginBottom: "3mm" }}>

            {/* Logo utama — Rename: doc_image2.png → public/images/logo.png */}
            <img
              src="/images/logo.png"
              alt="Logo Markaz Arabiyah"
              style={{ width: "25mm", height: "25mm", objectFit: "contain", marginBottom: "2mm" }}
            />

            <p style={{ fontSize: "12.5pt", fontWeight: "bold", letterSpacing: "0.04em", textTransform: "uppercase", color: "#111", marginBottom: "0.5mm" }}>
              DATA PESERTA KURSUS BAHASA ARAB
            </p>
            <p style={{ fontSize: "18pt", fontWeight: "900", color: "#7B5300", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5mm" }}>
              &ldquo;MARKAZ ARABIYAH&rdquo;
            </p>
            <p style={{ fontSize: "10pt", fontStyle: "italic", color: "#333", marginBottom: "1mm" }}>
              (Berbasis Multiple Intelligences)
            </p>
            <p style={{ fontSize: "9.5pt", textDecoration: "underline", fontWeight: "bold", color: "#111", marginBottom: "1mm" }}>
              SK. Diknas No: 421.9/4357/418.20/2022
            </p>
            <p style={{ fontSize: "9pt", color: "#222", lineHeight: 1.5, textAlign: "center" }}>
              <strong>Kantor Pusat:</strong> Jl. Cempaka, No. 32, Tegalsari, Tulungrejo, Kec. Pare,<br />
              Kab. Kediri, Jawa Timur Kode Pos 64212.
            </p>

            {/* Garis pemisah emas */}
            <div style={{ width: "100%", borderBottom: "2px solid #C9A84C", marginTop: "3mm", marginBottom: "3mm" }} />
          </div>

          {/* ── PARAGRAF PEMBUKA ── */}
          <p style={{ fontSize: "10.5pt", textAlign: "justify", lineHeight: 1.7, color: "#111", marginBottom: "3mm" }}>
            Menyatakan bahwa nama di bawah ini benar-benar telah mengikuti proses pembelajaran
            bahasa Arab di Markaz Arabiyah pada duf&apos;ah 85 yang berlaku sebagaimana terlampir.
          </p>

          {/* ── TABEL DATA PESERTA ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #bbb" }}>
            <tbody>
              {dataRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={tdLabel}>{row.label}</td>
                  <td style={tdColon}>:</td>
                  <td style={{ ...tdValue, fontWeight: row.bold ? "bold" : "normal" }}>
                    {row.value}
                  </td>
                </tr>
              ))}

              {/* Sub-header rincian nilai */}
              <tr style={{ background: "#f5f0e6", borderTop: "1px solid #bbb", borderBottom: "1px solid #bbb" }}>
                <td colSpan={3} style={{ padding: "1.5mm 2mm", fontWeight: "bold", fontSize: "10pt", color: "#111" }}>
                  Dengan rincian nilai sebagai berikut:
                </td>
              </tr>

              {gradeRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={tdLabel}>{row.label}</td>
                  <td style={tdColon}>:</td>
                  <td style={{ ...tdValue, fontWeight: row.bold ? "bold" : "normal" }}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── PARAGRAF PENUTUP ── */}
          <p style={{ fontSize: "10.5pt", textAlign: "justify", lineHeight: 1.7, color: "#111", marginTop: "4mm" }}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya
            dan sebagai bukti keikutsertaan peserta dalam proses pembelajaran bahasa Arab di
            lembaga kursus <strong>Markaz Arabiyah.</strong>
          </p>

          {/* ── FOOTER: Tanda Tangan ── */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "5mm",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
            }}
          >
            {/* Blok tanda tangan */}
            <div style={{ textAlign: "center", minWidth: "90mm", position: "relative" }}>
              <p style={{ fontSize: "10.5pt", color: "#111", marginBottom: "1mm" }}>
                Pare, {printDate}
              </p>
              <p style={{ fontSize: "10.5pt", color: "#111", marginBottom: "2mm" }}>
                Mengetahui,
              </p>
              <p style={{ fontSize: "10.5pt", color: "#111", marginBottom: "2mm" }}>
                General Manager Markaz Arabiyah
              </p>

              {/* Tanda tangan + stempel bertumpuk */}
              {/* Rename: doc_image3.png → public/images/signature.png */}
              {/* Rename: doc_image4.png → public/images/stamp.png     */}
              <div style={{ position: "relative", height: "35mm", marginBottom: "2mm", display: "flex", justifyContent: "center" }}>
                <img
                  src="/images/stamp.png"
                  alt="Stempel"
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-75%)",
                    bottom: "-2mm",
                    height: "36mm",
                    objectFit: "contain",
                    opacity: 0.88,
                    zIndex: 0,
                  }}
                />
                <img
                  src="/images/signature.png"
                  alt="Tanda Tangan"
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-20%)",
                    bottom: "-2mm",
                    height: "28mm",
                    objectFit: "contain",
                    zIndex: 1,
                  }}
                />
              </div>

              <p style={{
                fontSize: "10.5pt",
                fontWeight: "bold",
                color: "#111",
              }}>
                Badrul Islam, M.Pd.
              </p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}