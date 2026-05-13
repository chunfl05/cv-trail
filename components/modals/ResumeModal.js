"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useStore } from "@/lib/store";

const EMPTY = {
  name: "",
  target: "",
  notes: "",
  link: "",
  fileName: "",
  fileData: "",
};

export default function ResumeModal({ open, editing, onClose }) {
  const { addResume, updateResume } = useStore();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name || "",
        target: editing.target || "",
        notes: editing.notes || "",
        link: editing.link || "",
        fileName: editing.fileName || "",
        fileData: editing.fileData || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, fileName: file.name, fileData: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => setForm({ ...form, fileName: "", fileData: "" });

  const save = () => {
    if (!form.name.trim()) {
      alert("Version name is required.");
      return;
    }
    if (editing) {
      updateResume(editing.id, form);
    } else {
      addResume(form);
    }
    onClose();
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
          <button className="btn" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="full">
          <label>Version name</label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Senior PM — Fintech"
          />
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
          <label>Link</label>
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
            onChange={handleFileUpload}
          />
          {form.fileName ? (
            <div
              className="file-preview"
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {form.fileName}
              </span>
              <button
                type="button"
                className="btn ghost"
                onClick={clearFile}
                style={{ padding: "6px 10px" }}
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
