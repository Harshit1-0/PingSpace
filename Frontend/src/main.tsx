import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ChatLayout from "./pages/ChatLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Test from "./components/Test";
// Ensure theme is applied before first paint
const savedTheme =
  (typeof localStorage !== "undefined" && localStorage.getItem("theme")) ||
  "light";
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },
  { path: "/test", element: <Test /> },
  {
    path: "/chat",
    element: (
      <ProtectedRoute>
        <ChatLayout />
      </ProtectedRoute>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
