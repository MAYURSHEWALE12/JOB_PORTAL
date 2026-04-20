import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="warm-card p-12 text-center my-8 max-w-2xl mx-auto">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-serif font-semibold text-[#2D1F14] mb-4">
                        Something went wrong
                    </h2>
                    <p className="text-[#8B7355] mb-8">
                        The application encountered an unexpected error. Don't worry, your progress is likely safe.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="warm-btn px-8"
                    >
                        Try Refreshing Page
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-8 p-4 bg-red-50 text-red-700 text-xs text-left overflow-auto rounded-xl">
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
