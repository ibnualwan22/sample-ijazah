import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const mapels = await prisma.mapel.findMany();
  let totalBobotAkhir = 0;
  let totalBobotUsbu = 0;
  console.log("=== PENGATURAN MAPEL (Di Database) ===");
  for (const m of mapels) {
    if (m.masuk_akumulasi) {
      console.log(`- ${m.nama_indo.padEnd(25)} | Bobot Akhir: ${m.bobot} | Bobot Usbu: ${m.bobot_usbu}`);
      totalBobotAkhir += m.bobot ?? 0;
      totalBobotUsbu += m.bobot_usbu ?? 0;
    } else {
      console.log(`- ${m.nama_indo.padEnd(25)} | (Tidak Masuk Akumulasi)`);
    }
  }
  console.log("------------------------");
  console.log(`Total Bobot Akhir (Syahadah) : ${totalBobotAkhir}`);
  console.log(`Total Bobot Usbu (Pekanan)   : ${totalBobotUsbu}`);
}
main().catch(console.error);
