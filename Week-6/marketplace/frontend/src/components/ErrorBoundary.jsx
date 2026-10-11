import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-24 text-center">
        <h1 className="text-[30px] font-bold">Something went wrong</h1>
        <p className="mt-2 text-slate-gray">
          An unexpected error occurred. Please reload the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="mt-6 cursor-pointer rounded-[30px] bg-midcurrent-navy px-6 py-3 text-[15px] font-medium text-paper-white"
        >
          Back to the shop
        </button>
      </div>
    );
  }
}
