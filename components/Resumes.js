"use client";

import { useState } from "react";
import Icon from "./Icon";
import { useResumes } from "@/lib/resumes";
import ResumeModal from "./modals/ResumeModal";

export default function Resumes() {
  const { resumes, loading, error, addResume, updateResume, deleteResume, uploadResumeFile, getFileUrl } =
    useResumes();
  const [modal, setModal] = useState({ open: false, editing: null });

  const openNew = () => setModal({ open: true, editing: null });
  const openEdit = (r) => setModal({ open: true, editing: r });
  const close = () => setModal({ open: false, editing: null });

  const save = async (payload) => {
    if (modal.editing) {
      await updateResume(modal.editing.id, payload);
    } else {
      await addResume(payload);
    }
  };

  const remove = async (r) => {
    if (!confirm(`Delete "${r.label}"?`)) return;
    try {
      await deleteResume(r.id);
    } catch (e) {
      alert(e.message || "Failed to delete resume.");
    }
  };

  const open = async (r) => {
    try {
      const url = await getFileUrl(r.file_url);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else alert("No file or link attached to this version.");
    } catch (e) {
      alert(e.message || "Could not open that file.");
    }
  };

  return (
    <section className="view active">
      <div className="page-header">
        <div>
          <div className="page-title">Resume Vault</div>
          <div className="page-sub">
            Tailored versions for different roles and industries.
          </div>
        </div>
        <button className="btn" onClick={openNew}>
          <Icon name="plus" size={14} strokeWidth={2} />
          New version
        </button>
      </div>

      {error && (
        <div className="empty card">
          <p>{error}</p>
        </div>
      )}

      {!error && !loading && resumes.length === 0 && (
        <div className="empty card">
          <div className="empty-icon">
            <Icon name="resumes" size={22} strokeWidth={1.5} />
          </div>
          <h3>No resume versions</h3>
          <p>
            Create different versions tailored to specific roles, industries, or
            seniority levels — or generate one from the Experience Bank via a
            job application's "Tailor my resume".
          </p>
          <button className="btn" onClick={openNew}>
            Add version
          </button>
        </div>
      )}

      {!error && resumes.length > 0 && (
        <div className="resumes-grid">
          {resumes.map((r) => (
            <div className="resume-card" key={r.id}>
              <div className="resume-icon">
                <Icon name="resumes" size={19} strokeWidth={1.6} />
              </div>
              <div className="resume-name">
                {r.label}
                {r.is_base && <span className="tag" style={{ marginLeft: 8 }}>Base</span>}
              </div>
              <div className="resume-target">
                {r.content?.target || "No target set"}
              </div>
              {r.content?.notes && <div className="resume-notes">{r.content.notes}</div>}
              <div className="resume-foot" style={{ justifyContent: "flex-end" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {r.file_url && (
                    <button
                      className="btn outline sm"
                      onClick={() => open(r)}
                      style={{ padding: "5px 11px" }}
                    >
                      Open ↗
                    </button>
                  )}
                  <button className="icon-btn edit" title="Edit" onClick={() => openEdit(r)}>
                    <Icon name="edit" size={14} strokeWidth={1.5} />
                  </button>
                  <button className="icon-btn" title="Delete" onClick={() => remove(r)}>
                    <Icon name="trash" size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ResumeModal
        open={modal.open}
        editing={modal.editing}
        onClose={close}
        onSave={save}
        uploadResumeFile={uploadResumeFile}
      />
    </section>
  );
}
