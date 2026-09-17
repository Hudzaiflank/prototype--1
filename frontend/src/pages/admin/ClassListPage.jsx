import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../../services/api/classApi";
import { useAuthContext } from "../../hooks/useAuthContext";

const nextAcademicYear = (academicYear) =>
  `${Number(academicYear.slice(0, 4)) + 1}/${Number(academicYear.slice(5)) + 1}`;

export function ClassListPage() {
  const { user } = useAuthContext();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gradeLevel, setGradeLevel] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  useEffect(() => {
    classApi
      .list()
      .then(({ data }) => {
        const nextClasses = data.data ?? [];
        setClasses(nextClasses);
        const latestActiveYear = nextClasses
          .filter((item) => item.status === "ACTIVE" && item.academicYear)
          .map((item) => item.academicYear)
          .sort()
          .pop();
        setAcademicYear(latestActiveYear ?? "2026/2027");
      })
      .catch(() => setError("Daftar kelas belum dapat dimuat."));
  }, []);
  const runPromotion = async () => {
    setBusy(true);
    try {
      await classApi.promote({ academicYear });
      const { data } = await classApi.list();
      setClasses(data.data ?? []);
      setAcademicYear(nextAcademicYear(academicYear));
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Kenaikan kelas gagal.");
    } finally {
      setBusy(false);
      setConfirmation(null);
    }
  };
  const runLevelReset = async () => {
    setBusy(true);
    try {
      await classApi.resetLevel({ academicYear, gradeLevel });
      const { data } = await classApi.list();
      setClasses(data.data ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Reset tingkat gagal.");
    } finally {
      setBusy(false);
      setConfirmation(null);
    }
  };
  const promote = () => {
    const targetAcademicYear = nextAcademicYear(academicYear);
    setConfirmation({
      title: "Naikkan seluruh kelas?",
      message: `Semua kelas akan diproses dari ${academicYear} ke ${targetAcademicYear}. Tingkat terakhir akan dinonaktifkan, sedangkan siswa dan guru dipindahkan ke tingkat berikutnya.`,
      confirmLabel: "Ya, naikkan kelas",
      action: runPromotion,
    });
  };
  const resetLevel = () => {
    setConfirmation({
      title: "Reset seluruh tingkat?",
      message: `Semua siswa di tingkat ${gradeLevel} pada tahun ajaran ${academicYear} akan dilepas dari kelasnya. Data siswa tetap tersimpan.`,
      confirmLabel: "Ya, reset siswa",
      action: runLevelReset,
    });
  };
  const gradeOptions = user?.school?.level === "SMP" ? ["7", "8", "9"] : ["10", "11", "12"];
  const visibleClasses = classes.filter(
    (item) =>
      item.academicYear === academicYear &&
      (gradeLevel === "ALL" || String(item.gradeLevel) === gradeLevel) &&
      (statusFilter === "ALL" || item.status === statusFilter),
  );
  return (
    <section className="space-y-6" aria-labelledby="classes-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            School management
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="classes-title">
            Kelas
          </h1>
        </div>
        <Link
          className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950"
          to="/admin/classes/new"
        >
          Tambah kelas
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/30 bg-slate-950/50 p-4">
        <label className="text-sm">Tahun ajaran aktif
          <input className="ml-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} pattern="[0-9]{4}/[0-9]{4}" />
        </label>
        <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60" type="button" onClick={promote} disabled={busy}>Naikkan seluruh kelas</button>
        <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)}><option value="ALL">Semua tingkat</option>{gradeOptions.map((level) => <option key={level} value={level}>Kelas {level}</option>)}</select>
        <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ACTIVE">Aktif saja</option><option value="ALL">Semua status</option><option value="INACTIVE">Nonaktif saja</option></select>
        <button className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-300 disabled:opacity-60" type="button" onClick={resetLevel} disabled={busy}>Reset seluruh tingkat</button>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleClasses.map((item) => (
          <Link
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-amber-300"
            to={`/admin/classes/${item.id}`}
            key={item.id}
          >
            <p className="text-lg font-semibold">{item.name}</p>
            <p className="mt-2 text-sm text-slate-400">
              {item.gradeLevel} · {item.major || "Umum"} · {item.academicYear}
            </p>
            <p className="mt-4 text-xs text-amber-300">{item.status}</p>
          </Link>
        ))}
      </div>
      {!visibleClasses.length && !error ? (
        <p className="text-sm text-slate-400">Tidak ada kelas yang sesuai filter.</p>
      ) : null}
      {confirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm" role="presentation">
          <div className="w-full max-w-lg rounded-2xl border border-amber-300/40 bg-slate-900 p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="class-confirmation-title">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300 text-lg font-black text-slate-950">!</div>
              <div>
                <h2 className="text-xl font-bold text-slate-100" id="class-confirmation-title">{confirmation.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{confirmation.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white" type="button" onClick={() => setConfirmation(null)} disabled={busy}>Batal</button>
              <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={confirmation.action} disabled={busy}>{busy ? "Memproses..." : confirmation.confirmLabel}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
