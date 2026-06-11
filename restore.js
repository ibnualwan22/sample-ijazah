const fs = require('fs');
const { execSync } = require('child_process');
const original = execSync('git show HEAD:src/components/admin/absensi-kelas-client.tsx').toString();
fs.writeFileSync('src/components/admin/absensi-kelas-client.tsx', original);
