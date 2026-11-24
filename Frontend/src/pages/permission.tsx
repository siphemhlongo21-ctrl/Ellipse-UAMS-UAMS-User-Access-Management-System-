import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import type { PermissionDetails } from "../types/Permission";
import {
  getPermissions,
  addPermission,
  updatePermission,
} from "../api/permissionApi";

const PERMISSIONS_PER_PAGE = 10;
export default function Permissions() {
  const [permissions, setPermissions] = useState<PermissionDetails[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionDetails | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
  });

  // Custom Deactivation Modal State
  const [deactivatingPermission, setDeactivatingPermission] = useState<PermissionDetails | null>(null);
  const totalPages = Math.ceil(permissions.length / PERMISSIONS_PER_PAGE);
  const displayedPage = Math.min(currentPage, Math.max(totalPages, 1));
  const firstPermissionIndex = (displayedPage - 1) * PERMISSIONS_PER_PAGE;
  const paginatedPermissions = permissions.slice(
  firstPermissionIndex,
  firstPermissionIndex + PERMISSIONS_PER_PAGE
);
  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await getPermissions()) as unknown as PermissionDetails[];

      const sortedData = [...(data || [])].sort((a, b) => {
        const aActive = Boolean(a?.active);
        const bActive = Boolean(b?.active);
        if (aActive === bActive) {
          return (a?.name || "").localeCompare(b?.name || "");
        }
        return aActive ? -1 : 1;
      });

      setPermissions(sortedData);
      setCurrentPage((page) =>
      Math.min(page, Math.max(1, Math.ceil(sortedData.length / PERMISSIONS_PER_PAGE)))
     );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPermissions();
  }, []);

  const handleAdd = () => {
    setEditingPermission(null);
    setFormData({ code: "", name: "", description: "", active: true });
    setIsModalOpen(true);
  };

  const handleEdit = (permission: PermissionDetails) => {
    setEditingPermission(permission);
    setFormData({
      code: permission.code,
      name: permission.name,
      description: permission.description,
      active: permission.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert("Please fill in both the Code and Name fields.");
      return;
    }

    try {
      setSaving(true);
      if (editingPermission) {
        await updatePermission(editingPermission.id, {
          ...editingPermission,
          ...formData,
        });
        notifySuccess("Permission updated successfully!");
      } else {
        await addPermission(formData);
        notifySuccess("Permission created successfully!");
      }
      setIsModalOpen(false);
      await loadPermissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save permission");
    } finally {
      setSaving(false);
    }
  };

  // Perform soft deletion by updating active flag to false
  const confirmDeactivate = async () => {
    if (!deactivatingPermission) return;
    try {
      setDeactivating(true);
      await updatePermission(deactivatingPermission.id, {
        ...deactivatingPermission,
        active: false,
      });
      setDeactivatingPermission(null);
      await loadPermissions();
      notifySuccess("Permission marked as inactive!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate permission");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="relative min-h-full bg-[#f4f6fb] p-6 text-[#13264d]">
      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#008c86] px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-2 rounded p-0.5 hover:bg-black/10">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Permissions Management</h2>
          <p className="mt-1 text-sm text-[#637596]">
            Create, view, edit, and manage system permissions.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-md bg-[#12356b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2853]"
        >
          <Plus size={16} />
          Add Permission
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#dce2ee] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#dce2ee] bg-[#f8faff] text-xs font-semibold uppercase tracking-wider text-[#637596]">
            <tr>
              <th scope="col" className="px-6 py-3">Permission Name</th>
              <th scope="col" className="px-6 py-3">Permission Code</th>
              <th scope="col" className="px-6 py-3">Permission Description</th>
              <th scope="col" className="px-6 py-3">Active</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce2ee]">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-[#637596]">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin text-[#12356b]" />
                    <span>Loading permissions...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-red-600">
                  {error}
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-[#637596]">
                  No permissions found.
                </td>
              </tr>
            ) : (
              paginatedPermissions.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[#f8faff]">
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#13264d]">
                    {p.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded bg-[#eef2f8] px-2 py-1 font-mono text-xs text-[#637596]">
                      {p.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#637596]">
                    {p.description || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {p.active ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-[#24416f] hover:bg-[#eef2f8]"
                      >
                        <Edit2 size={14} /> Edit
                      </button>

                      {/* Enabled when Active to deactivate; Disabled when Inactive */}
                      <button
                        onClick={() => setDeactivatingPermission(p)}
                        disabled={!p.active}
                        title={p.active ? "Deactivate this permission" : "Permission is already inactive"}
                        className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-[#b42335] hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
              {!loading && !error && permissions.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-[#637596]">
            Showing {firstPermissionIndex + 1} to{" "}
            {Math.min(firstPermissionIndex + PERMISSIONS_PER_PAGE, permissions.length)} of{" "}
            {permissions.length} entries
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(displayedPage - 1, 1))}
              disabled={displayedPage === 1}
              className="rounded border border-[#dce2ee] bg-white px-3 py-1.5 text-sm text-[#24416f] hover:bg-[#eef2f8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-current={displayedPage === page ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
                className={`rounded border px-3 py-1.5 text-sm ${
                  displayedPage === page
                    ? "border-[#12356b] bg-[#12356b] font-semibold text-white"
                    : "border-[#dce2ee] bg-white text-[#24416f] hover:bg-[#eef2f8]"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(displayedPage + 1, totalPages))}
              disabled={displayedPage === totalPages}
              className="rounded border border-[#dce2ee] bg-white px-3 py-1.5 text-sm text-[#24416f] hover:bg-[#eef2f8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>


      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10234b]/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#dce2ee] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#dce2ee] px-5 py-4">
              <h3 className="text-lg font-bold text-[#13264d]">
                {editingPermission ? "Edit Permission" : "Add Permission"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="rounded p-1 text-[#637596] hover:bg-[#eef2f8] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 px-5 py-5">
              <div>
                <label className="text-xs font-semibold text-[#13264d]">Permission Code</label>
                <input
                  type="text"
                  required
                  disabled={saving}
                  className="mt-1 w-full rounded-md border border-[#cbd6e8] px-3 py-2 text-sm outline-none focus:border-[#70d9d0] disabled:bg-[#f4f6fb]"
                  placeholder="e.g. USER_VIEW"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#13264d]">Permission Name</label>
                <input
                  type="text"
                  required
                  disabled={saving}
                  className="mt-1 w-full rounded-md border border-[#cbd6e8] px-3 py-2 text-sm outline-none focus:border-[#70d9d0] disabled:bg-[#f4f6fb]"
                  placeholder="e.g. View Users"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#13264d]">Description</label>
                <textarea
                  rows={3}
                  disabled={saving}
                  className="mt-1 w-full rounded-md border border-[#cbd6e8] px-3 py-2 text-sm outline-none focus:border-[#70d9d0] disabled:bg-[#f4f6fb]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active"
                  disabled={saving}
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-[#cbd6e8] text-[#12356b] focus:ring-[#70d9d0]"
                />
                <label htmlFor="active" className="cursor-pointer text-sm font-medium text-[#13264d] select-none">
                  Is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#dce2ee] pt-4">
                <button
                  type="button"
                  disabled={saving}
                  className="rounded-md bg-[#eef2f8] px-4 py-2 text-sm font-semibold text-[#24416f] disabled:opacity-50"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-[#12356b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d2853] disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingPermission ? "Update Permission" : "Save Permission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Deactivation Confirmation Modal */}
      {deactivatingPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10234b]/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#dce2ee] bg-white p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-50 p-2 text-[#b42335]">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#13264d]">Deactivate Permission</h3>
                <p className="mt-1 text-sm text-[#637596]">
                  Are you sure you want to deactivate <span className="font-semibold text-[#13264d]">{deactivatingPermission.name}</span>?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deactivating}
                onClick={() => setDeactivatingPermission(null)}
                className="rounded-md bg-[#eef2f8] px-4 py-2 text-sm font-semibold text-[#24416f] hover:bg-[#e2e8f4] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deactivating}
                onClick={confirmDeactivate}
                className="flex items-center gap-2 rounded-md bg-[#b42335] px-4 py-2 text-sm font-semibold text-white hover:bg-[#961c2b] disabled:opacity-50"
              >
                {deactivating && <Loader2 size={16} className="animate-spin" />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}