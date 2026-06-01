import { getCertificateData } from "./src/lib/app-data";

async function main() {
  const cert = await getCertificateData("89131107066");
  console.log("Name:", cert?.masterSantri.nama);
  console.log("Average:", cert?.average);
  console.log("Predikat:", cert?.averagePredikat);
}
main().catch(console.error);
