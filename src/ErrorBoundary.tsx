import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="empty" role="alert">
        <h1>The workspace hit a snag.</h1>
        <p>
          Your saved local data is still in this browser. Reload to reopen the
          workspace.
        </p>
        <p>{this.state.error}</p>
        <button onClick={() => location.reload()}>Reload workspace</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
