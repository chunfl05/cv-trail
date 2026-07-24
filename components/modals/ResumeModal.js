"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const EMPTY = {
  label: "",
  is_base: false,
  target: "",
  notes: "",
  link: "",
};

export default function ResumeModal({ open, editing, onClose, onSave, uploadResumeFile }) {
  const [form, setForm] = useState(EMPTY);
  const [newFile, setNewFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNewFile(null);
    if (editing) {
      setForm({
        label: editing.label || "",
        is_base: !!editing.is_base,
        target: editing.content?.target || "",
        notes: editing.content?.notes || "",
        link: /^https?:\/\//i.test(editing.file_url || "") ? editing.file_url : "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: value });
  };

  const save = async () => {
    if (!form.label.trim()) {
      alert("Version name is required.");
      return;
    }
    setSaving(true);
    try {
      let fileUrl = form.link.trim() || null;
      if (newFile) {
        fileUrl = await uploadResumeFile(newFile);
      } else if (!fileUrl && editing && !/^https?:\/\//i.test(editing.file_url || "")) {
        // Keep an existing uploaded file's storage path if the user didn't change anything.
        fileUrl = editing.file_url || null;
      }
      const payload = {
        label: form.label.trim(),
        is_base: form.is_base,
        file_url: fileUrl,
        content: {
          target: form.target.trim() || null,
          notes: form.notes.trim() || null,
        },
      };
      await onSave(payload);
      onClose();
    } catch (e) {
      alert(e.message || "Failed to save resume.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit version" : "New resume version"}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="full">
          <label>Version name</label>
          <input
            type="text"
            value={form.label}
            onChange={set("label")}
            placeholder="e.g. Senior PM — Fintech"
          />
        </div>
        <div className="full">
          <label style={{ display: "flex", alignItems: "center", gap: 8, textTransform: "none" }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.is_base} onChange={set("is_base")} />
            Base resume (starting point for tailoring)
          </label>
        </div>
        <div className="full">
          <label>Target role / industry</label>
          <input
            type="text"
            value={form.target}
            onChange={set("target")}
            placeholder="e.g. PM roles in fintech, B2B"
          />
        </div>
        <div className="full">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={set("notes")}
            placeholder="What's different about this version?"
          />
        </div>
        <div className="full">
          <label>Link (used only if no file is uploaded)</label>
          <input
            type="url"
            value={form.link}
            onChange={set("link")}
            placeholder="Drive / Notion / Dropbox URL"
          />
        </div>
        <div className="full">
          <label>Upload file</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setNewFile(e.target.files?.[0] || null)}
          />
          {newFile && <p className="page-sub" style={{ marginTop: 8 }}>{newFile.name}</p>}
        </div>
      </div>
    </Modal>
  );
}
