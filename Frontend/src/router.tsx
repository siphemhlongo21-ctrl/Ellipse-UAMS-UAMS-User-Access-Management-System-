import { createBrowserRouter } from "react-router-dom";

import Index from "./pages";
import RolePermissionManagement from "./pages/admin/RolePermissionManagement";
import Login from "./pages/auth/Login";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Reports } from "./pages/Reports";
import { ContractorForm } from "./pages/request/ContractorForm";
import { NewRequestForm } from "./pages/request/NewRequestForm";
import { RequestList } from "./pages/request/Requests";
import { ViewRequest } from "./pages/request/ViewRequest";
import { RoleManagementView } from "./pages/RoleManagement";
import IsAuthenticated from "./utilities/auth/IsAuthenticated";
import IsAuthorized from "./utilities/auth/IsAuthorized";
import Permissions from "./pages/permission";


import AdminUsersView from "./pages/admin/AdminUsersView";
const router = createBrowserRouter([

  {
    path: "/",
    element: <Index />,
    children: [
      {
        path: '/dashboard',
        element: (
          <IsAuthenticated >
            <Dashboard />
          </IsAuthenticated>
        )
      },
      {
        path: '/requests',
        element: (
          <IsAuthenticated>
            <RequestList />
          </IsAuthenticated>
        )
      },
      {
        path: '/requests/:requestId',
        element: (
          <IsAuthenticated>
            <ViewRequest />
          </IsAuthenticated>
        )
      },
      {
        path: '/requests/employee/new',
        element: (
          <IsAuthenticated >
            <IsAuthorized roles={["EMPLOYEE", "LINE_MANAGER"]}>
              <NewRequestForm />
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
      {
        path: '/requests/contractor/new',
        element: (
          <IsAuthenticated>
            <IsAuthorized roles={["LINE_MANAGER"]}>
              <ContractorForm />
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
      {
        path: '/reports',
        element: (
          <IsAuthenticated >
            <IsAuthorized roles={["HC_SYSTEMS_OFFICER"]}>
              <Reports />
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
      {
        path: '/admin/users',
        element: (
          <IsAuthenticated >
            <IsAuthorized roles={["SYSTEM_ADMIN"]}>
              <AdminUsersView /> {/* ✅ Replace placeholder with actual component */}
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
      {
        path: '/admin/roles',
        element: (
          <IsAuthenticated >
            <IsAuthorized roles={["SYSTEM_ADMIN"]}>
              <RoleManagementView />
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
      {
        path: '/admin/permissions',
        element: (
          <IsAuthenticated >
            <IsAuthorized roles={["SYSTEM_ADMIN"]}>
              <Permissions/>
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
      {
        path: '/admin/role-permissions',
        element: (
          <IsAuthenticated>
            <IsAuthorized roles={["SYSTEM_ADMIN"]}>
              <RolePermissionManagement />
            </IsAuthorized>
          </IsAuthenticated>
        )
      },
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: "*",
    element: <h1>404 page not found!!</h1>
  }
])
  

export default router;