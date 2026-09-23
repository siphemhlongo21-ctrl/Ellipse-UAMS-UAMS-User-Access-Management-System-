import { useEffect, useState } from "react";
import { Plus, Search, Shield, Trash2, UserCog, UserPlus, Users, X } from "lucide-react";
import { lookupUSTEmployeeApi } from "../api";
import {
  assignRole,
  createRole,
  deleteRole,
  getRoles,
  getUsers,
  revokeRole,
  updateRole,
} from "../api/rolesApi";
import type { AppUserSummary, RoleDetails, USTEmployeeDetails } from "../api/types";

type RoleDef = {
  id: number;
  code: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  assignedUserCount: number;
};

const COLOR_OPTIONS = [
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-gray-100 text-gray-600 border-gray-200",
  "bg-orange-100 text-orange-600 border-orange-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

const SYSTEM_ROLE_CODES = ["SYSTEM_ADMIN", "EMPLOYEE"];

function colorFor(code: string) {
  const sum = [...code].reduce((total, char) => total + char.charCodeAt(0), 0);
  return COLOR_OPTIONS[Math.abs(sum) % COLOR_OPTIONS.length];
}

function toRoleDef(role: RoleDetails): RoleDef {
  const code = role.code ?? "";
  return {
    id: role.id ?? 0,
    code,
    name: role.name ?? "",
    description: role.description ?? "",
    color: colorFor(code),
    isSystem: SYSTEM_ROLE_CODES.some(c => c.toLowerCase() === code.toLowerCase()),
    assignedUserCount: role.assignedUserCount ?? 0,
  };
}

function userRoles(user: AppUserSummary): string[] {
  return (user.roles ?? []).filter(Boolean);
}

function userHasRole(user: AppUserSummary, roleCode: string) {
  return userRoles(user).some(code => code.toLowerCase() === roleCode.toLowerCase());
}

function userLabel(user: AppUserSummary) {
  return user.displayName || user.serviceNumber || user.email || user.activeDirectoryUsername || "User";
}

function userInitials(user: AppUserSummary) {
  const parts = userLabel(user).split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return userLabel(user).slice(0, 2).toUpperCase() || "U";
}

function userDetailLine(user: AppUserSummary) {
  const email = (user.email || user.employeeEmail || "").trim();
  const service = (user.serviceNumber || "").trim();
  const serviceIsEmail = service.includes("@") || service.toLowerCase() === email.toLowerCase();
  if (!service || serviceIsEmail) {
    return email;
  }
  return [email, service].filter(Boolean).join(" · ");
}

function userServiceNumber(user: AppUserSummary) {
  return user.serviceNumber ?? "";
}

function employeeLabel(employee: USTEmployeeDetails) {
  const preferred = [employee.prefName, employee.firstName].find(value => value?.trim());
  return [preferred, employee.surname].filter(Boolean).join(" ").trim() || employee.email || employee.serviceNo || "Employee";
}

function employeeMatchesUser(employee: USTEmployeeDetails, user: AppUserSummary) {
  const email = (employee.email ?? "").trim().toLowerCase();
  const serviceNo = (employee.serviceNo ?? "").trim().toLowerCase();
  return Boolean(
    (email && (user.email?.toLowerCase() === email || user.employeeEmail?.toLowerCase() === email)) ||
    (serviceNo && user.serviceNumber?.toLowerCase() === serviceNo),
  );
}

function employeeAlreadyHasRole(employee: USTEmployeeDetails, users: AppUserSummary[], roleCode: string) {
  return users.some(user => employeeMatchesUser(employee, user) && userHasRole(user, roleCode));
}

function employeeRowKey(employee: USTEmployeeDetails, index: number) {
  return employee.serviceNo || employee.email || employee.userId || `employee-${index}`;
}

function roleById(roles: RoleDef[], roleId: number) {
  return roles.find(role => role.id === roleId) ?? null;
}

export function RoleManagementView() {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [users, setUsers] = useState<AppUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isNew, setIsNew] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleDef | null>(null);
  const [assignTarget, setAssignTarget] = useState<RoleDef | null>(null);
  const [viewTarget, setViewTarget] = useState<RoleDef | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDef | null>(null);

  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundEmployees, setFoundEmployees] = useState<USTEmployeeDetails[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const roleData = await getRoles();
      setRoles((roleData ?? []).map(toRoleDef));
      try {
        const userData = await getUsers();
        setUsers(userData ?? []);
      } catch (e) {
        setUsers([]);
        setError(e instanceof Error ? e.message : "Failed to load users.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const usersForRole = (roleCode: string) => users.filter(user => userHasRole(user, roleCode));
  const assignedUsers = assignTarget ? usersForRole(assignTarget.code) : [];
  const viewUsers = viewTarget ? usersForRole(viewTarget.code) : [];

  const resetAssignState = () => {
    setSearchInput("");
    setSearching(false);
    setSearchError(null);
    setFoundEmployees([]);
  };

  const closeAssign = () => {
    if (saving || searching) return;
    setAssignTarget(null);
    resetAssignState();
  };

  const openAssignFor = (role: RoleDef) => {
    resetAssignState();
    setError(null);
    setAssignTarget(role);
  };

  const refreshUsersAndRoles = async () => {
    const [roleData, userData] = await Promise.all([
      getRoles(),
      getUsers().catch(() => [] as AppUserSummary[]),
    ]);
    const nextRoles = (roleData ?? []).map(toRoleDef);
    const nextUsers = userData ?? [];
    setRoles(nextRoles);
    setUsers(nextUsers);
    setAssignTarget(current => (current ? roleById(nextRoles, current.id) ?? current : null));
    setViewTarget(current => (current ? roleById(nextRoles, current.id) ?? current : null));
    setDeleteTarget(current => (current ? roleById(nextRoles, current.id) ?? current : null));
  };

  const closeForm = () => {
    if (saving) return;
    setIsNew(false);
    setEditTarget(null);
  };

  const saveRole = async () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const description = form.description.trim();

    if (!code || !name) {
      setError("Role code and role name are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        await createRole({ code, name, description: description || null });
        setSuccessMessage(`Role "${name}" was created successfully.`);
      } else if (editTarget) {
        await updateRole(editTarget.id, {
          name,
          description: description || null,
          isActive: true,
        });
        setSuccessMessage(`Role "${name}" was updated successfully.`);
      }
      closeForm();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save role.");
    } finally {
      setSaving(false);
    }
  };

  const searchEmployee = async () => {
    const identifier = searchInput.trim();
    if (!identifier || searching) return;

    if (identifier.length < 2) {
      setSearchError("Enter at least 2 characters.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setFoundEmployees([]);
    try {
      const employees = await lookupUSTEmployeeApi.getEmployees(identifier);
      if (!employees?.length) {
        setSearchError("No employees matched that search.");
        return;
      }
      setFoundEmployees(employees);
    } catch (e) {
      setFoundEmployees([]);
      const message = e instanceof Error ? e.message : "Could not look up employees.";
      setSearchError(
        /failed to fetch|networkerror|load failed|could not reach the api/i.test(message)
          ? "Could not reach the employee directory. Check that the API can access UST, then try again."
          : message,
      );
    } finally {
      setSearching(false);
    }
  };

  const confirmAssign = async (employee: USTEmployeeDetails) => {
    if (!assignTarget || !employee.serviceNo) return;

    setSaving(true);
    setSearchError(null);
    try {
      await assignRole({
        serviceNumber: employee.serviceNo,
        roleCode: assignTarget.code,
      });
      setSuccessMessage(`Assigned "${assignTarget.name}" to ${employeeLabel(employee)}.`);
      await refreshUsersAndRoles();
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Could not assign this role.");
    } finally {
      setSaving(false);
    }
  };

  const confirmRevoke = async (user: AppUserSummary, role: RoleDef | null = viewTarget) => {
    if (!role || user.id == null) return;
    setSaving(true);
    setError(null);
    setSearchError(null);
    try {
      await revokeRole({ serviceNumber: user.serviceNumber, roleCode: role.code });
      setSuccessMessage(`Removed "${role.name}" from ${userLabel(user)}.`);
      await refreshUsersAndRoles();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not remove this role from the user.";
      if (assignTarget) {
        setSearchError(message);
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (usersForRole(deleteTarget.code).length > 0) {
      setError("This role cannot be deleted because it is assigned to one or more users.");
      setDeleteTarget(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await deleteRole(deleteTarget.id);
      setSuccessMessage(`Role "${deleteTarget.name}" was removed successfully.`);
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this role.");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
              Role Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add, edit, and delete system roles
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsNew(true);
            setEditTarget(null);
            setForm({ code: "", name: "", description: "" });
            setError(null);
            setSuccessMessage(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
        >
          <Plus size={15} /> Add Role
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              {["Role Label", "Description", "Actions"].map(heading => (
                <th key={heading} className="text-left px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading roles…
                </td>
              </tr>
            ) : (
              roles.map(role => {
                const count = usersForRole(role.code).length;
                const deleteDisabled = count > 0 || saving;
                return (
                  <tr key={role.id} className="hover:bg-secondary/10">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${role.color}`}>
                        {role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                      {role.description || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNew(false);
                            setEditTarget(role);
                            setForm({ code: role.code, name: role.name, description: role.description });
                            setError(null);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary border border-border rounded text-[10px] font-bold"
                        >
                          <UserCog size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setViewTarget(null);
                            openAssignFor(role);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary border border-border rounded text-[10px] font-bold"
                        >
                          <UserPlus size={11} /> Assign User
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewTarget(role)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary border border-border rounded text-[10px] font-bold"
                        >
                          <Users size={11} /> View Users
                          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {count}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={deleteDisabled}
                          title={
                            count > 0
                              ? "This role cannot be deleted while users are assigned. Remove them first."
                              : "Delete this role"
                          }
                          onClick={() => {
                            if (deleteDisabled) return;
                            setDeleteTarget(role);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold ${deleteDisabled
                            ? "bg-red-50/50 border border-red-100 text-red-300 cursor-not-allowed"
                            : "bg-red-50 border border-red-200 text-red-700"
                            }`}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {(isNew || editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">{isNew ? "Add New Role" : `Edit — ${editTarget?.name}`}</h3>
              <button type="button" onClick={closeForm}><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <input
                value={form.code}
                disabled={!isNew}
                placeholder="Code"
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-mono disabled:opacity-50"
              />
              <input
                value={form.name}
                placeholder="Role name"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
              />
              <textarea
                rows={3}
                value={form.description}
                placeholder="Description"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button type="button" onClick={closeForm} className="px-4 py-2 border border-border rounded-lg text-xs">Cancel</button>
              <button type="button" onClick={() => void saveRole()} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">
                {saving ? "Saving…" : isNew ? "Create Role" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl">
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-foreground" />
                  <h3 className="text-base font-bold text-foreground">Assign User to Role</h3>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Role:</span>
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    {assignTarget.name}
                  </span>
                </div>
              </div>
              <button type="button" onClick={closeAssign} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-5 space-y-4">
              <label className="block text-sm text-muted-foreground">
                Search by name, email, or service number
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={searchInput}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="e.g. Fatima, fatima.moosa@ethekwini.gov.za, or EM001003"
                    onChange={e => {
                      setSearchInput(e.target.value);
                      setSearchError(null);
                      setFoundEmployees([]);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void searchEmployee();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-primary rounded-lg text-sm outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={!searchInput.trim() || searching}
                  onClick={() => void searchEmployee()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold disabled:bg-primary/40"
                >
                  <Search size={15} />
                  {searching ? "Searching…" : "Search"}
                </button>
              </div>
            </div>

            <div className="mx-6 border-t border-border" />

            <div className="px-6 py-5 min-h-[120px]">
              {searching ? (
                <p className="text-sm text-muted-foreground text-center py-6">Searching…</p>
              ) : foundEmployees.length > 0 ? (
                <div className="w-full space-y-3">
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {foundEmployees.map((employee, index) => {
                      const alreadyAssigned = employeeAlreadyHasRole(employee, users, assignTarget.code);
                      return (
                        <div
                          key={employeeRowKey(employee, index)}
                          className="w-full rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{employeeLabel(employee)}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {[employee.email, employee.serviceNo].filter(Boolean).join(" · ")}
                            </div>
                            {alreadyAssigned && (
                              <div className="mt-1 text-[11px] font-semibold text-amber-700">Already assigned to this role</div>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={saving || !employee.serviceNo || alreadyAssigned}
                            onClick={() => void confirmAssign(employee)}
                            className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-40 shrink-0"
                          >
                            {saving ? "Assigning…" : "Assign"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {searchError && (
                    <p className="text-sm text-red-600 text-center">{searchError}</p>
                  )}
                </div>
              ) : searchError ? (
                <p className="text-sm text-red-600 text-center py-6">{searchError}</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Type a name, email, or service number and press Search
                </p>
              )}
            </div>

            <div className="mx-6 border-t border-border" />

            <div className="px-6 py-4">
              <div className="text-xs font-bold text-muted-foreground tracking-wide">
                CURRENTLY ASSIGNED ({assignedUsers.length})
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {assignedUsers.map(user => (
                  <span
                    key={userServiceNumber(user) ?? user.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-medium text-sky-900"
                  >
                    {userLabel(user)}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void confirmRevoke(user, assignTarget)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${userLabel(user)}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="px-6 pb-5 flex justify-end">
              <button
                type="button"
                onClick={closeAssign}
                className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-foreground" />
                  <h3 className="text-base font-bold text-foreground">Users in Role</h3>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    {viewTarget.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {viewUsers.length} {viewUsers.length === 1 ? "user" : "users"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mx-6 border-t border-border" />

            <div className="px-6 py-4 space-y-3 max-h-80 overflow-auto">
              {viewUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No users currently have this role.</p>
              ) : (
                viewUsers.map(user => (
                  <div
                    key={user.id ?? userServiceNumber(user)}
                    className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {userInitials(user)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">{userLabel(user)}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{userDetailLine(user)}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${user.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-muted-foreground"
                        }`}
                    >
                      {user.isActive ? "active" : "inactive"}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void confirmRevoke(user, viewTarget)}
                      className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={12} /> {saving ? "Remoing" : "Remove"}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mx-6 border-t border-border" />

            <div className="px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="px-5 py-2 bg-secondary text-foreground rounded-lg text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h3 className="text-sm font-bold text-red-700">Delete Role</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm">Delete <strong>"{deleteTarget.name}"</strong>? This cannot be undone.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-border rounded-lg text-xs">Cancel</button>
                <button
                  type="button"
                  disabled={saving || usersForRole(deleteTarget.code).length > 0}
                  onClick={() => void confirmDelete()}
                  className="flex-1 py-2 bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-40"
                >
                  {saving ? "Deleting…" : "Delete Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






