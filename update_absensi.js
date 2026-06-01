const fs = require('fs');
const file = 'src/components/admin/absensi-kelas-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  /import \{ Clock, Lock, CheckCircle2 \} from "lucide-react";/,
  'import { Clock, Lock, CheckCircle2, UserPlus, X } from "lucide-react";'
);

// 2. States
content = content.replace(
  /const \[atribut, setAtribut\] = useState[^;]+;/,
  `const [atribut, setAtribut] = useState({ kopiah: false, nametag: false, bros: false });
  const [isBadalMode, setIsBadalMode] = useState(false);
  const [showBadalModal, setShowBadalModal] = useState(false);
  const [badalTargetKelasId, setBadalTargetKelasId] = useState("");`
);

// 3. Auto-switch reset
content = content.replace(
  /setActiveSession\(currentActive\);\n\s+\/\/ Pergantian sesi terdeteksi!/,
  `setActiveSession(currentActive);
         // Pergantian sesi terdeteksi!
         setIsBadalMode(false);`
);

// 4. allClassesOptions
content = content.replace(
  /const allOptions = \(\(\) => \{/,
  `const allClassesOptions = useMemo(() => {
    const list: { id: string; label: string; group: string }[] = [];
    programList.forEach((program) => {
      if (program.kelasList.length > 0) {
        program.kelasList.forEach((k: any) => {
          list.push({ id: k.id, label: k.nama, group: program.nama_indo });
        });
      }
    });
    return list;
  }, [programList]);

  const allOptions = (() => {`
);

// 5. handleSave
content = content.replace(
  /atributBros: atribut.bros\n\s+\};/,
  `atributBros: atribut.bros,
          isBadal: isBadalMode
        };`
);

// 6. UI Active Session header updates for isTeacher
content = content.replace(
  /\{activeClassId && \(\n\s+<div className="flex items-center gap-2">\n\s+<span className="text-xs font-semibold uppercase tracking-\[0.2em\] text-slate-500 w-24">Kelas<\/span>\n\s+<span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">\n\s+\{allOptions.find\(o => o.id === activeClassId\)\?.label \|\| activeClassId\}\n\s+<\/span>\n\s+<\/div>\n\s+\)\}/,
  `{activeClassId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 w-24">Kelas</span>
                  <span className={\`text-sm font-bold px-3 py-1 rounded-lg border \${isBadalMode ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-indigo-700 bg-indigo-50 border-indigo-100'}\`}>
                    {allClassesOptions.find(o => o.id === activeClassId)?.label || activeClassId}
                    {isBadalMode && " (Badal)"}
                  </span>
                </div>
              )}
              {activeSession && (
                <div className="mt-2 flex">
                  {isBadalMode ? (
                     <button onClick={() => { setIsBadalMode(false); setActiveClassId(teacherSessions.find(ts => ts.sesi === activeSession)?.kelasId || null); setKelasId(teacherSessions.find(ts => ts.sesi === activeSession)?.kelasId || allowedClassIds?.[0] || ""); }} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">Batal Badal</button>
                  ) : (
                    <button onClick={() => setShowBadalModal(true)} className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-3 py-1.5 transition-colors">
                      <UserPlus className="w-4 h-4" />
                      Jadi Guru Badal
                    </button>
                  )}
                </div>
              )}`
);

// 7. Prevent lock screen if isBadalMode
content = content.replace(
  /isTeacher && activeSession && teacherSessions.some\(ts => ts.sesi === activeSession && ts.kelasId === kelasId\)/,
  `(isTeacher && activeSession && (teacherSessions.some(ts => ts.sesi === activeSession && ts.kelasId === kelasId) || isBadalMode))`
);

// 8. Add modal
content = content.replace(
  /<\/section>\n\s+<\/div>\n\s+\);\n\}/,
  `      </section>

      {/* Badal Modal */}
      {showBadalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mode Guru Badal</h3>
              <button onClick={() => setShowBadalModal(false)} className="text-slate-400 hover:text-rose-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">Pilih kelas yang akan Anda gantikan (Badal) untuk sesi <strong className="text-slate-800">{activeSession?.replace('_', ' ')}</strong> saat ini.</p>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Kelas Tujuan</label>
                <select
                  value={badalTargetKelasId}
                  onChange={(e) => setBadalTargetKelasId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 outline-none"
                >
                  <option value="" disabled>-- Pilih Kelas --</option>
                  {allClassesOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.group} — {opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowBadalModal(false)} className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">Batal</button>
              <button 
                onClick={() => {
                  if (badalTargetKelasId) {
                    setIsBadalMode(true);
                    setKelasId(badalTargetKelasId);
                    setActiveClassId(badalTargetKelasId);
                    setShowBadalModal(false);
                    toast.success("Mode Badal diaktifkan untuk sesi ini");
                  } else {
                    toast.error("Pilih kelas terlebih dahulu");
                  }
                }} 
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600"
              >
                Mulai Badal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync(file, content);
console.log('Update done!');
