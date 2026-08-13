import { Component } from 'react'
import { ServerErrorPage } from './ErrorPages'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    handleReset = () => {
        this.setState({ hasError: false })
    }

    render() {
        return this.state.hasError ? <ServerErrorPage onReset={this.handleReset} /> : this.props.children
    }
}

export default ErrorBoundary
