import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Route error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="card">
          <h2>Something went wrong</h2>
          <p className="error">This view crashed. Reload to retry.</p>
        </section>
      );
    }
    return this.props.children;
  }
}
