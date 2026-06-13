import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-6">
              An unexpected error occurred. Your data is safe — this is just a UI issue.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 text-left text-[10px] bg-slate-50 p-3 rounded-lg text-red-600 overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
