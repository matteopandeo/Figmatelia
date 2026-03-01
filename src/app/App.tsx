import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/AuthContext";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            backgroundColor: "#1B1D1C",
            color: "#F1F1EE",
            border: "none",
            borderRadius: "12px",
          },
        }}
      />
    </AuthProvider>
  );
}
