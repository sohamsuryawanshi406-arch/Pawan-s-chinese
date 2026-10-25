import { createBrowserRouter } from "react-router";
import { TableVerification } from "./components/TableVerification";
import { UserPanel } from "./components/UserPanel";

export const router = createBrowserRouter([
  { path: "/",                  Component: TableVerification },
  { path: "/user-access",       Component: TableVerification },
  { path: "/user/:tableNumber", Component: UserPanel },
]);
