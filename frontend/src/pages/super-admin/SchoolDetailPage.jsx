import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { schoolApi } from "../../services/api/schoolApi";

export function SchoolDetailPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [message, setMessage] = useState("");
  const [resetCredential, setResetCredential] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const load = useCallback(() => {
    schoolApi
      .detail(schoolId)
      .then(({ data }) => setSchool(data.data))
      .catch((error) =>
        setMessage(
          error.response?.data?.message ?? "Sekolah belum dapat dimuat.",
        ),
      );
  }, [schoolId]);
  useEffect(() => {
    load();
  }, [load]);
  const toggleStatus = async () => {
    const next = school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await schoolApi.updateStatus(schoolId, next);
    setMessage(`Status sekolah diubah menjadi ${next}.`);
    load();
  };
  const resetAdminPassword = async () => {
    setIsResetting(true);
    setMessage("");
    setResetCredential(null);
    try {
      const { data } = await schoolApi.resetAdminPassword(schoolId);
      setResetCredential(data.data);
      setMessage("Password Admin berhasil di-reset. Simpan credential ini sekarang.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ??
          "Password Admin belum dapat di-reset.",
      );
    } finally {
      setIsResetting(false);
    }
  };
  const removeSchool = async () => {
    if (!school || !window.confirm(`Hapus permanen sekolah ${school.name} beserta data kelas, guru, topic, room, dan game?`)) return;
    setIsRemoving(true);
    setMessage("");
    try {
      await schoolApi.remove(schoolId);
      navigate("/schools");
    } catch (error) {
      setMessage(error.response?.data?.message ?? "Sekolah belum dapat dihapus.");
    } finally {
      setIsRemoving(false);
    }
  };
  return (
    <section className="space-y-6" aria-labelledby="school-detail-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Super Admin
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="school-detail-title">
          {school?.name ?? "Detail sekolah"}
        </h1>
      </div>
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Domain", school?.domain],
          ["Status", school?.status],
          ["Admin", school?.admin_name],
          ["Email Admin", school?.admin_email],
          ["Guru", school?.teacher_count],
          ["Kelas", school?.class_count],
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
      {school ? (
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-amber-300 px-4 py-3 text-sm font-bold text-amber-200"
            type="button"
            onClick={toggleStatus}
          >
            {school.status === "ACTIVE"
              ? "Nonaktifkan sekolah"
              : "Aktifkan sekolah"}
          </button>
          <button
            className="rounded-lg border border-rose-300 px-4 py-3 text-sm font-bold text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={removeSchool}
            disabled={isRemoving || school.status === "INACTIVE"}
          >
            {isRemoving ? "Menghapus..." : "Hapus permanen"}
          </button>
          <button
            className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={resetAdminPassword}
            disabled={isResetting}
          >
            {isResetting ? "Mereset password..." : "Reset password Admin"}
          </button>
        </div>
      ) : null}
      {resetCredential ? (
        <div className="rounded-2xl border border-emerald-400/50 bg-emerald-950/20 p-6 text-sm">
          <p className="font-semibold text-emerald-200">
            Credential Admin baru
          </p>
          <p className="mt-3">
            Email: <strong>{resetCredential.email}</strong>
          </p>
          <p className="mt-1">
            Password sementara: <strong>{resetCredential.password}</strong>
          </p>
          <p className="mt-3 text-xs text-emerald-100/80">
            Password ini hanya ditampilkan pada hasil reset. Simpan dan berikan
            kepada Admin sekolah.
          </p>
        </div>
      ) : null}
    </section>
  );
}
