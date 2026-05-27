import { getActiveDufahName } from "./src/lib/absensi";
import { getMasterSantriList } from "./src/lib/santri-api";

async function main() {
  const activeDufah = await getActiveDufahName();
  console.log("Active Dufah from getActiveDufahName():", activeDufah);

  const masterList = await getMasterSantriList();
  
  const santri90 = masterList.filter(s => s.isAktif && s.dufahNama?.includes("90"));
  console.log(`\nFound ${santri90.length} active santri in Dufah 90`);
  
  if (santri90.length > 0) {
    console.log("Sample santri in 90:", santri90.slice(0, 3).map(s => ({ nama: s.nama, dufah: s.dufahNama, tglMulai: s.tanggalMulaiDufah })));
  }

  const santri89 = masterList.filter(s => s.isAktif && s.dufahNama?.includes("89"));
  console.log(`\nFound ${santri89.length} active santri in Dufah 89`);
}

main().catch(console.error);
