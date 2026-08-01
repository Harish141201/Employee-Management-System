import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import '../style/employeeform.css'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const redirectTo = location.state?.from?.pathname || '/'

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await login(username, password)
            navigate(redirectTo, { replace: true })
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid username or password')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='st-ba'>
            <div className='container d-flex justify-content-center align-items-center'>
                <div className="text-center card card-top">
                    <div className='card-head'>
                      <>
    <h2 className="title">Welcome Back 👋</h2>
    <p className="text-light mb-4">
        Sign in to access the Employee Management System
    </p>
</>
                    </div>
                    <div className="card-body">
                        {error && (
                            <div className="alert alert-danger text-start" role="alert">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className='form-group mb-3'>
                                <input
                                    type="text"
                                    placeholder='Username'
                                    value={username}
                                    className='form-control'
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='form-group mb-3'>
                                <input
                                    type="password"
                                    placeholder='Password'
                                    value={password}
                                    className='form-control'
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className='btn btn-success' disabled={submitting}>
                                {submitting ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
