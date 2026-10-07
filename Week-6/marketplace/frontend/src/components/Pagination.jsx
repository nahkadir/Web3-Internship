import Button from "./Button";

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!pagination.hasPrev}
        onClick={() => onPage(pagination.page - 1)}
      >
        Previous
      </Button>
      <span className="text-[13px] text-slate-gray">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!pagination.hasNext}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
