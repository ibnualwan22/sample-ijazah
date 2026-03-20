type StatusSource = {
  is_tasmi: boolean;
};

type NilaiSource = {
  skor: number;
};

type ProgramSource = {
  kkm: number;
};

export type StatusKelulusan = "LULUS" | "MUSYAROKAH" | "TIDAK_LULUS";

export function calculateStatus(
  santri: StatusSource,
  nilaiList: NilaiSource[],
  program: ProgramSource | null,
): StatusKelulusan {
  if (!santri.is_tasmi || !program) {
    return "TIDAK_LULUS";
  }

  const hasNilaiDiBawahKkm = nilaiList.some((nilai) => nilai.skor < program.kkm);

  if (hasNilaiDiBawahKkm) {
    return "MUSYAROKAH";
  }

  return "LULUS";
}
