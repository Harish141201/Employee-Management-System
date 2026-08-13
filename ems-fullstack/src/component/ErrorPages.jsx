import { useNavigate } from 'react-router-dom'

function ErrorPage({ code, title, message, action = 'Back to workspace' }) {
    const navigate = useNavigate()
    return <div className="error-page"><div className="error-page-mark">{code}</div><p className="page-kicker">PeopleHub</p><h1>{title}</h1><p>{message}</p><button className="ph-btn ph-btn-primary" onClick={() => navigate('/')}><i className="bi bi-arrow-left"></i> {action}</button></div>
}

export function ForbiddenPage() { return <ErrorPage code="403" title="Access restricted" message="You do not have permission to view this workspace. If you need access, contact your PeopleHub administrator." /> }
export function NotFoundPage() { return <ErrorPage code="404" title="Page not found" message="The page you’re looking for may have moved, or the link may be outdated." /> }
export function ServerErrorPage({ onReset }) { return <div className="error-page"><div className="error-page-mark">500</div><p className="page-kicker">PeopleHub</p><h1>Something went wrong</h1><p>PeopleHub hit an unexpected problem while rendering this page. Try again, or return to your workspace.</p><button className="ph-btn ph-btn-primary" onClick={onReset}><i className="bi bi-arrow-clockwise"></i> Try again</button></div> }
