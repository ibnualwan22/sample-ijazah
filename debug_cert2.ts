import { getCertificateData } from "./src/lib/app-data";

async function main() {
  const data = await getCertificateData("88200526054");
  console.log("Nilai Rows:", JSON.stringify(data?.nilaiRows, null, 2));
  console.log("Average:", data?.average);
  console.log("Status:", data?.status);
}

main().catch(console.error);
