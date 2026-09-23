import { useMemo, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import styles from "./AppShell.module.css";
import type { UserSession } from "../types/UserSession";

export interface AppShellProps {
  children: ReactNode;
  breadcrumbs?: null;
  session?: UserSession
}

export function AppShell({ children, session }: AppShellProps) {
  const navigate = useNavigate();
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Main navigation">
        <div className={styles.brand}>
          <img src={logo} alt="" className={styles.brandLogo} width={40} height={40} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>eThekwini Electricity & Energy</span>
            <span className={styles.brandSubtitle}>ELLIPSE UAM SYSTEM</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <span className={styles.navIcon} aria-hidden>
              ▦
            </span>
            Dashboard
          </NavLink>
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <span className={styles.navIcon} aria-hidden>
              ▤
            </span>
            Requests
            {/* <span className={styles.badge} aria-label={`${pendingRequestCount} pending`}>
              {pendingRequestCount}
            </span> */}
          </NavLink>
        </nav>

        <div className={styles.userBlock}>
          <div className={styles.avatar} aria-hidden>
            {session?.displayName.substring(0,1)}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{session?.displayName}</span>
            <span className={styles.userRole}>{session?.roles?.find(x => x !== undefined)}</span>
          </div>
          <button type="button" className={styles.logout} aria-label="Log out" title="Log out" onClick={() => navigate("/login")}>
            ⎋
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          <p className={styles.breadcrumb}>Ellipse UAM · Phase 0 setup</p>
          <p className={styles.date}>{formattedDate}</p>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
