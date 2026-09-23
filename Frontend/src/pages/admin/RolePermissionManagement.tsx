import { useEffect, useState } from "react";
import { getRoles } from "../../api/rolesApi";
import type { RoleDetails } from "../../api/types";

import {
  addRolePermission,
  deleteRolePermission,
  getRolePermissions,
  type RolePermissionDetails,
} from "../../api/rolePermissionApi";

interface Permission {
  permissionId: number;
  permissionName: string;
}

export default function RolePermissionManagement() {
  const [roles, setRoles] = useState<RoleDetails[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [rolePermissions, setRolePermissions] = useState<
    Record<string, RolePermissionDetails[]>
  >({});

  const [selectedRole, setSelectedRole] =
    useState<RoleDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingChanges, setSavingChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRolePermissions, setDraftRolePermissions] = useState<
    Record<string, RolePermissionDetails[]>
  >({});

  /*
   * Load roles, permissions and existing role permissions
   */
  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [
        rolesResponse,
        rolePermissionsResponse,
      ] = await Promise.all([
        getRoles(),
        getRolePermissions(),
      ]);

      const permissionsResponse = Object.values(rolePermissionsResponse)
        .flat()
        .filter((permission, index, all) =>
          all.findIndex((item) => item.permissionId === permission.permissionId) === index,
        )
        .map(({ permissionId, permissionName }) => ({ permissionId, permissionName }));

      /*
       * apiRequest() returns the response body directly.
       * Therefore there is NO .data here.
       */
      setRoles(rolesResponse);
      setPermissions(permissionsResponse);
      setRolePermissions(rolePermissionsResponse);
      setDraftRolePermissions(rolePermissionsResponse);

      /*
       * Select the first role automatically.
       */
      if (rolesResponse.length > 0) {
        setSelectedRole((current) => current ?? rolesResponse[0]);
      }
    } catch (err) {
      console.error(
        "Failed to load roles and permissions:",
        err
      );

      setError(
        "Failed to load roles and permissions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Add or remove a permission from the selected role.
   */
  function handleToggle(
    permission: Permission,
    assigned: boolean
  ) {
    if (!selectedRole) {
      return;
    }

    const roleKey = selectedRole.name ?? selectedRole.code ?? "";
    setDraftRolePermissions((current) => {
      const assignedPermissions = current[roleKey] ?? [];
      const updatedPermissions = assigned
        ? assignedPermissions.filter((item) => item.permissionId !== permission.permissionId)
        : [...assignedPermissions, {
          roleId: selectedRole.id,
          permissionId: permission.permissionId,
          roleName: roleKey,
          permissionName: permission.permissionName,
        }];
      return { ...current, [roleKey]: updatedPermissions };
    });
  }

  async function handleSaveChanges() {
    if (!selectedRole) return;

    const roleKey = selectedRole.name ?? selectedRole.code ?? "";
    const saved = rolePermissions[roleKey] ?? [];
    const draft = draftRolePermissions[roleKey] ?? [];
    const savedIds = new Set(saved.map((item) => item.permissionId));
    const draftIds = new Set(draft.map((item) => item.permissionId));
    const additions = draft.filter((item) => !savedIds.has(item.permissionId));
    const removals = saved.filter((item) => !draftIds.has(item.permissionId));

    try {
      setSavingChanges(true);
      setError(null);
      await Promise.all([
        ...additions.map((item) => addRolePermission({ roleId: selectedRole.id, permissionId: item.permissionId })),
        ...removals.map((item) => deleteRolePermission(selectedRole.id, item.permissionId)),
      ]);
      const updatedRolePermissions = await getRolePermissions();
      setRolePermissions(updatedRolePermissions);
      setDraftRolePermissions(updatedRolePermissions);
    } catch (err) {
      console.error("Failed to save role permissions:", err);
      setError("Failed to save the permission changes. Please try again.");
    } finally {
      setSavingChanges(false);
    }
  }

  /*
   * Check whether the selected role currently
   * has a particular permission.
   */
  function isPermissionAssigned(
    permissionId: number
  ): boolean {
    if (!selectedRole) {
      return false;
    }

    const roleKey = selectedRole.name ?? selectedRole.code ?? "";
    const assignedPermissions = draftRolePermissions[roleKey] ?? [];

    return assignedPermissions.some(
      (rolePermission) =>
        rolePermission.permissionId === permissionId
    );
  }

  function hasUnsavedChanges(): boolean {
    if (!selectedRole) return false;

    const roleKey = selectedRole.name ?? selectedRole.code ?? "";
    const savedIds = new Set((rolePermissions[roleKey] ?? []).map((item) => item.permissionId));
    const draftIds = new Set((draftRolePermissions[roleKey] ?? []).map((item) => item.permissionId));
    return savedIds.size !== draftIds.size || [...savedIds].some((permissionId) => !draftIds.has(permissionId));
  }

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          Loading roles and permissions...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* =========================
          PAGE HEADER
      ========================== */}
      <div className="px-6 py-5 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">
          Role Permission Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage the permissions assigned to each system role.
        </p>
      </div>

      {/* =========================
          ERROR MESSAGE
      ========================== */}
      {error && (
        <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <div className="flex flex-1 min-h-0 m-6 bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* =========================
            LEFT: ROLES
        ========================== */}
        <div className="w-64 shrink-0 border-r border-gray-200">

          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">
              Roles
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Select a role to manage its permissions.
            </p>
          </div>

          <div className="p-2">
            {roles.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">
                No roles found.
              </p>
            ) : (
              roles.map((role) => {
                const isSelected =
                  selectedRole?.id === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition ${
                      isSelected
                        ? "bg-blue-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {role.name ?? role.code ?? "Unnamed Role"}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =========================
            RIGHT: PERMISSIONS
        ========================== */}
        <div className="flex-1 min-w-0 overflow-y-auto">

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedRole
                    ? `${selectedRole.name ?? selectedRole.code ?? "Role"} Permissions`
                    : "Permissions"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select the permissions that this role should have.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveChanges()}
                disabled={!hasUnsavedChanges() || savingChanges}
                className="shrink-0 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {savingChanges ? "Saving..." : hasUnsavedChanges() ? "Save Changes" : "Saved"}
              </button>
            </div>
          </div>

          {/* No role selected */}
          {!selectedRole ? (
            <div className="p-6 text-sm text-gray-500">
              Select a role to view its permissions.
            </div>

          /* No permissions */
          ) : permissions.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No permissions found.
            </div>

          /* Permission list */
          ) : (
            <div className="divide-y divide-gray-100">

              {permissions.map((permission) => {
                const assigned =
                  isPermissionAssigned(
                    permission.permissionId
                  );

                return (
                  <label
                    key={permission.permissionId}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  >

                    {/* Permission information */}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {permission.permissionName}
                      </p>

                      <p className={`mt-0.5 text-xs font-medium ${assigned ? "text-green-600" : "text-gray-500"}`}>
                        {assigned ? "Granted" : "Denied"}
                        <span className="ml-2 font-normal text-gray-400">
                          Permission ID: {permission.permissionId}
                        </span>
                      </p>
                    </div>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={assigned}
                      disabled={savingChanges}
                      onChange={() =>
                        void handleToggle(
                          permission,
                          assigned
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                    />

                  </label>
                );
              })}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}