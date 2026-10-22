import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/unauthorized" element={<p>Forbidden page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Dashboard</p>} />
          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<p>Admin area</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("route guards", () => {
  beforeEach(() => vi.resetAllMocks());

  it("sends anonymous users to the login page", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt("/dashboard");
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("waits while the session is being restored", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    renderAt("/dashboard");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("lets logged-in users through", () => {
    useAuth.mockReturnValue({ user: { role: "CUSTOMER" }, loading: false });
    renderAt("/dashboard");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("blocks a customer from the admin area but admits an admin", () => {
    useAuth.mockReturnValue({ user: { role: "CUSTOMER" }, loading: false });
    const first = renderAt("/admin");
    expect(screen.getByText("Forbidden page")).toBeInTheDocument();
    first.unmount();

    useAuth.mockReturnValue({ user: { role: "ADMIN" }, loading: false });
    renderAt("/admin");
    expect(screen.getByText("Admin area")).toBeInTheDocument();
  });
});
