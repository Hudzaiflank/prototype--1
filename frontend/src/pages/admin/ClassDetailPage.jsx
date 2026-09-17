import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { classApi } from "../../services/api/classApi";
import { teacherApi } from "../../services/api/teacherApi";

export function ClassDetailPage() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() =>
    Promise.all([classApi.detail(classId), classApi.students(classId), teacherApi.list()])
      .then(([classResponse, studentsResponse, teacherResponse]) => {
        const nextClass = classResponse.data.data;
        setClassData(nextClass);
        setStudents(studentsResponse.data.data ?? []);
        setForm({
          gradeLevel: nextClass.gradeLevel,
          major: nextClass.major,
          classNumber: nextClass.classNumber,
          status: nextClass.status,
        });
        const result = teacherResponse.data.data;
        setTeachers(Array.isArray(result) ? result : result?.rows ?? []);
      })
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ??
            "Detail kelas belum dapat dimuat.",
        ),
      ), [classId]);
  useEffect(() => {
    load();
  }, [load]);
  const update = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await classApi.update(classId, {
        ...form,
        classNumber: Number(form.classNumber),
      });
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Kelas belum dapat diubah.");
    }
  };
  const assign = async () => {
    if (!selectedTeacher) return;
    try {
      await classApi.assignTeacher(classId, Number(selectedTeacher));
      setSelectedTeacher("");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Guru belum dapat di-assign.");
    }
  };
  const remove = async (teacherId) => {
    try {
      await classApi.removeTeacher(classId, teacherId);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Assignment belum dapat dihapus.");
    }
  };
  const resetStudents = async () => {
    if (!window.confirm("Hapus semua siswa dari kelas ini?")) return;
    try {
      await classApi.resetStudents(classId);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Siswa belum dapat direset.");
    }
  };
  return (
    <section className="space-y-6" aria-labelledby="class-detail-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="class-detail-title">
          {classData?.name ?? "Detail kelas"}
        </h1>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {form ? (
        <form className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 md:grid-cols-4" onSubmit={update}>
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" value={form.gradeLevel} onChange={(event) => setForm({ ...form, gradeLevel: event.target.value })} required />
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} required />
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" type="number" min="1" value={form.classNumber} onChange={(event) => setForm({ ...form, classNumber: event.target.value })} required />
          <div className="flex gap-2">
            <select className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <button className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950" type="submit">Simpan</button>
          </div>
        </form>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Tingkat", classData?.gradeLevel],
          ["Jurusan", classData?.major],
          ["Nomor", classData?.classNumber],
          ["Tahun ajaran", classData?.academicYear],
          ["Total siswa", students.length],
          ["Status", classData?.status],
        ].map(([label, value]) => (
          <div
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            key={label}
          >
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 font-semibold">{value ?? "-"}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Siswa ({students.length})</h2>
          <button className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-300" type="button" onClick={resetStudents}>Reset siswa</button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => <div className="rounded-lg border border-slate-800 p-3 text-sm" key={student.id}>{student.fullName} <span className="text-slate-400">- {student.nisn}</span></div>)}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <h2 className="text-lg font-semibold">Guru terkait</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)}>
            <option value="">Pilih guru</option>
            {teachers.filter((teacher) => !classData?.assignedTeachers?.some((assigned) => assigned.id === teacher.id)).map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.fullName}</option>)}
          </select>
          <button className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950" type="button" onClick={assign}>Assign guru</button>
        </div>
        <div className="mt-4 space-y-2">
          {classData?.assignedTeachers?.length ? classData.assignedTeachers.map((teacher) => (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 p-3" key={teacher.id}>
              <span>{teacher.fullName} <span className="text-sm text-slate-400">({teacher.email})</span></span>
              <button className="text-sm text-rose-300" type="button" onClick={() => remove(teacher.id)}>Hapus assignment</button>
            </div>
          )) : <p className="text-sm text-slate-400">Belum ada guru terkait.</p>}
        </div>
      </div>
    </section>
  );
}
