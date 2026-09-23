import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthProvider";
import { RouterProvider } from "react-router-dom";
import router from "./router";

createRoot(document.getElementById("root")!).render(
  <div>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </div>,
);