import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./app/routes";
import { RestaurantProvider } from "./app/context/RestaurantContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RestaurantProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </RestaurantProvider>
  </React.StrictMode>
);
