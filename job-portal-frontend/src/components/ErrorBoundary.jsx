import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-orange-50 dark:bg-stone-950 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 p-10 shadow-[10px_10px_0_#1c1917] text-center">
                        <div className="text-6xl mb-6">⚠️</div>
                        <h1 className="text-2xl font-black uppercase text-stone-900 dark:text-white mb-4">Something Went Wrong</h1>
                        <p className="text-stone-500 dark:text-stone-400 font-bold mb-8 text-xs uppercase tracking-widest">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/';
                            }}
                            className="w-full bg-stone-900 text-white py-4 px-6 uppercase font-black text-xs tracking-widest border-[3px] border-stone-900 shadow-[4px_4px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
