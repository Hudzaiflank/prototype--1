import { useEffect, useState } from "react";
import { studentApi } from "../../services/api/studentApi";
import { useAuthContext } from "../../hooks/useAuthContext";

export function StudentTrackingPage() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuthContext();
  const isTeacher = user?.role === "TEACHER";
  useEffect(() => {
    studentApi
      .list()
      .then(({ data: response }) => setStudents(response.data ?? []))
      .catch(() => setError("Daftar siswa belum dapat dimuat."));
  }, []);
  const selectStudent = async (id) => {
    setSelectedId(String(id));
    setData(null);
    if (!id) return;
    try {
      const { data: response } = await studentApi.history(id);
      setData(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "History siswa belum dapat dimuat.",
      );
    }
  };
  const filteredStudents = students
    .filter((student) =>
      `${student.fullName} ${student.nisn}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    )
    .slice(0, 20);
  return (
    <section className="space-y-6" aria-labelledby="student-tracking-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Student tracking
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="student-tracking-title">
          Riwayat siswa
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {isTeacher
            ? "Hanya siswa dari kelas yang Anda ampu yang dapat dilihat."
            : "Cari siswa berdasarkan nama dan NISN untuk melihat riwayat lintas kelas."}
        </p>
      </div>
      <div className="max-w-xl space-y-2">
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama lengkap atau NISN"
          autoComplete="off"
        />
        {search.trim() ? (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <button
                className={`block w-full rounded-lg border px-3 py-3 text-left text-sm transition ${String(student.id) === selectedId ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-slate-700 bg-slate-900 hover:border-amber-300"}`}
                type="button"
                key={student.id}
                onClick={() => selectStudent(student.id)}
              >
                {student.fullName} - {student.nisn}
                {student.className ? ` - ${student.className}` : ""}
              </button>
            ))}
            {!filteredStudents.length ? (
              <p className="rounded-lg border border-rose-400/40 px-3 py-3 text-sm text-rose-300">
                Siswa tersebut tidak berada dalam pengawasan Anda atau tidak
                ditemukan.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {data ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">
              {data.student.fullName} - {data.student.nisn}
            </h2>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-3">Sekolah</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Tahun ajaran</th>
                <th className="px-4 py-3">Masalah</th>
                <th className="px-4 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((row, index) => (
                <tr
                  className="border-b border-slate-900"
                  key={`${row.gameSessionId}-${index}`}
                >
                  <td className="px-4 py-3">{row.schoolName}</td>
                  <td className="px-4 py-3">{row.className}</td>
                  <td className="px-4 py-3">{row.academicYear}</td>
                  <td className="max-w-md px-4 py-3">{row.problemContent}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(row.playedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.history.length ? (
            <p className="p-5 text-sm text-slate-400">
              Belum ada history permainan.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
