import { useCallback, useEffect, useState } from "react";
import { topicApi } from "../../services/api/topicApi";

export function TopicListPage() {
  const [topics, setTopics] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() =>
    topicApi
      .list()
      .then(({ data }) => setTopics(data.data ?? []))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ?? "Topik belum dapat dimuat.",
        ),
      ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await topicApi.create({
        title: title.trim(),
        description: description.trim(),
        visibility: "SCHOOL",
      });
      setTitle("");
      setDescription("");
      load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Topik belum dapat dibuat.",
      );
    }
  };
  const remove = async (id) => {
    try {
      await topicApi.remove(id);
      load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Topik belum dapat dihapus.",
      );
    }
  };
  const edit = async (topic) => {
    setError("");
    try {
      await topicApi.update(topic.id, {
        title: topic.title,
        description: topic.description ?? "",
        visibility: topic.visibility,
      });
      setEditingId(null);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Topik belum dapat diubah.");
    }
  };
  return (
    <section className="space-y-6" aria-labelledby="topics-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="topics-title">
          Topik permainan
        </h1>
      </div>
      <form
        className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={create}
      >
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          placeholder="Judul topik"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          placeholder="Deskripsi"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button
          className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950"
          type="submit"
        >
          Tambah topik
        </button>
      </form>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="space-y-3">
        {topics.map((topic) => (
          <div
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            key={topic.id}
          >
            {editingId === topic.id ? (
              <div className="grid w-full gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" value={topic.title} onChange={(event) => setTopics((items) => items.map((item) => item.id === topic.id ? { ...item, title: event.target.value } : item))} />
                <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" value={topic.description ?? ""} onChange={(event) => setTopics((items) => items.map((item) => item.id === topic.id ? { ...item, description: event.target.value } : item))} />
                <button className="text-sm text-amber-200" type="button" onClick={() => edit(topic)}>Simpan</button>
                <button className="text-sm text-slate-400" type="button" onClick={() => setEditingId(null)}>Batal</button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-semibold">{topic.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{topic.description ?? "Tanpa deskripsi"}</p>
                </div>
                <div className="flex gap-3">
                  <button className="text-sm text-amber-200" type="button" onClick={() => setEditingId(topic.id)}>Ubah</button>
                  <button className="text-sm text-rose-300" type="button" onClick={() => remove(topic.id)}>Hapus</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {!topics.length && !error ? (
        <p className="text-sm text-slate-400">Belum ada topik.</p>
      ) : null}
    </section>
  );
}
