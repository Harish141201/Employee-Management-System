import { createContext } from 'react'

// Split into its own file so AuthContext.jsx can export only the
// AuthProvider component and useAuth.js can export only the hook —
// keeps each file's exports Fast-Refresh-friendly (react-refresh/only-export-components).
const AuthContext = createContext(null)

export default AuthContext
