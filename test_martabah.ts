import { getCertificateData } from "./src/lib/app-data";

async function main() {
  const cert = await getCertificateData("88030809058");
  console.log("Average:", cert?.average);
  console.log("Predikat:", cert?.averagePredikat);
}

main().catch(console.error);
