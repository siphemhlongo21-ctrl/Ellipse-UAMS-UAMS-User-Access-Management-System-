import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { ROLE_LABELS } from "../utilities/role_labels";
import { http } from "../api/client";

interface User {
  id: number;
  isActive: boolean;
  serviceNumber: string;
  email: string;
  activeDirectoryUsername: string;
  lastLoginAt: string | null;
  roles: string[];
}

const ROLE_COLOR: Record<string, string> = {
  EMPLOYEE: "bg-slate-100 text-slate-700 border-slate-200",
  LINE_MANAGER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  TRAINING_CENTRE: "bg-amber-100 text-amber-700 border-amber-200",
  ICT_MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  HC_SYSTEMS_OFFICER: "bg-sky-100 text-sky-700 border-sky-200",
  SYSTEM_ADMIN: "bg-red-100 text-red-700 border-red-200",
};

const AVATAR_COLORS = [
  "bg-indigo-900",
  "bg-blue-900",
  "bg-teal-800",
  "bg-purple-900",
  "bg-slate-800",
];

function getAvatarColor(key?: string): string {
  let hash = 0;

  for (let i = 0; i < (key?.length ?? 0); i++) {
    hash = key!.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function deriveDisplayName(email?: string): string {
  const local = email?.split("@")[0] ?? "";

  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);

  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1
      ? parts[parts.length - 1][0]
      : "";

  return (first + last).toUpperCase();
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selected user is for viewing details only.
  // There is intentionally NO role assignment functionality here.
  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const filtered = users.filter((user) => {
    const searchValue = search.toLowerCase();

    return (
      !searchValue ||
      user.serviceNumber
        .toLowerCase()
        .includes(searchValue) ||
      user.email
        .toLowerCase()
        .includes(searchValue) ||
      user.activeDirectoryUsername
        .toLowerCase()
        .includes(searchValue) ||
      user.roles.some((role) =>
        (
          ROLE_LABELS[role] ?? role
        )
          .toLowerCase()
          .includes(searchValue)
      )
    );
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await http.get<User[]>(
        "/Roles/GetUsers"
      );

      setUsers(data);
    } catch (error) {
      console.error(
        "Failed to load users",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold text-foreground"
          style={{
            fontFamily: "Barlow, sans-serif",
          }}
        >
          Users
        </h1>

        <p className="text-sm text-muted-foreground mt-0.5">
          Users with assigned management roles — read only
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, service number, or username..."
            className="
              w-full
              pl-9
              pr-3
              py-2.5
              bg-input-background
              border
              border-border
              rounded-lg
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-blue-200
              focus:border-blue-400
            "
          />
        </div>

        <span className="text-xs text-muted-foreground">
          {filtered.length} users
        </span>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/20">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                User
              </th>

              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                Service No.
              </th>

              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                Username
              </th>

              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                Role
              </th>

              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const displayName =
                  deriveDisplayName(user.email);

                const initials =
                  getInitials(displayName);

                const avatarColor =
                  getAvatarColor(
                    user.serviceNumber
                  );

                return (
                  <tr
                    key={user.id}
                    onClick={() =>
                      setSelectedUser(user)
                    }
                    className="
                      border-b
                      border-border
                      last:border-0
                      hover:bg-secondary/10
                      transition-colors
                      cursor-pointer
                    "
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                            w-8
                            h-8
                            rounded-full
                            ${avatarColor}
                            text-white
                            flex
                            items-center
                            justify-center
                            text-xs
                            font-semibold
                            shrink-0
                          `}
                        >
                          {initials}
                        </div>

                        <div>
                          <p className="font-semibold text-foreground">
                            {displayName}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Service number */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.serviceNumber}
                    </td>

                    {/* AD username */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.activeDirectoryUsername}
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">
                            No role assigned
                          </span>
                        ) : (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`
                                px-2.5
                                py-1
                                rounded-full
                                border
                                text-xs
                                font-medium
                                ${
                                  ROLE_COLOR[role] ??
                                  "bg-slate-100 text-slate-700 border-slate-200"
                                }
                              `}
                            >
                              {ROLE_LABELS[role] ??
                                role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`
                          px-2.5
                          py-1
                          rounded-full
                          text-xs
                          font-medium
                          ${
                            user.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User details modal */}
      {selectedUser && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
          "
          onClick={() =>
            setSelectedUser(null)
          }
        >
          <div
            className="
              w-full
              max-w-lg
              bg-card
              border
              border-border
              rounded-xl
              shadow-xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">
                  User Details
                </h2>

                <p className="text-xs text-muted-foreground mt-0.5">
                  View user information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(null)
                }
                className="
                  p-1.5
                  rounded-md
                  hover:bg-secondary
                  text-muted-foreground
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-12
                    h-12
                    rounded-full
                    ${getAvatarColor(
                      selectedUser.serviceNumber
                    )}
                    text-white
                    flex
                    items-center
                    justify-center
                    font-semibold
                  `}
                >
                  {getInitials(
                    deriveDisplayName(
                      selectedUser.email
                    )
                  )}
                </div>

                <div>
                  <p className="font-semibold text-foreground">
                    {deriveDisplayName(
                      selectedUser.email
                    )}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Service Number
                  </p>

                  <p className="text-sm font-medium mt-1">
                    {selectedUser.serviceNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Active Directory Username
                  </p>

                  <p className="text-sm font-medium mt-1">
                    {
                      selectedUser.activeDirectoryUsername
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Email
                  </p>

                  <p className="text-sm font-medium mt-1">
                    {selectedUser.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Status
                  </p>

                  <p className="text-sm font-medium mt-1">
                    {selectedUser.isActive
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>

              {/* Current roles — DISPLAY ONLY */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Assigned Roles
                </p>

                {selectedUser.roles.length ===
                0 ? (
                  <span className="text-sm text-muted-foreground italic">
                    No role assigned
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.map(
                      (role) => (
                        <span
                          key={role}
                          className={`
                            px-2.5
                            py-1
                            rounded-full
                            border
                            text-xs
                            font-medium
                            ${
                              ROLE_COLOR[role] ??
                              "bg-slate-100 text-slate-700 border-slate-200"
                            }
                          `}
                        >
                          {ROLE_LABELS[role] ??
                            role}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* IMPORTANT:
                  No Assign Role button.
                  No Revoke Role button.
                  No role dropdown.
                  This screen is read-only.
              */}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end px-5 py-4 border-t border-border">
              <button
                type="button"
                onClick={() =>
                  setSelectedUser(null)
                }
                className="
                  px-4
                  py-2
                  text-sm
                  rounded-lg
                  border
                  border-border
                  hover:bg-secondary
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}