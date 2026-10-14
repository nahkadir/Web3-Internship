import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-gray-600">
        You don't have permission to view this page.
      </p>
      <Link to="/dashboard" className="text-indigo-600">
        Go to my dashboard
      </Link>
    </div>
  );
}
