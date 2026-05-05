import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data?.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: "Login failed" }
        } catch (err) {
            console.error("Login failed:", err)
            return { success: false, message: err?.response?.data?.message || "Login failed" }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if (data?.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: "Registration failed" }
        } catch (err) {
            console.error("Register failed:", err)
            return { success: false, message: err?.response?.data?.message || "Registration failed" }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
        } catch (err) {
            console.error("Logout error:", err)
        } finally {
            localStorage.removeItem('token')
            setUser(null)
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                setLoading(false)
                return
            }
            setLoading(true)  // only show loading when we have a token to validate
            try {
                const data = await getMe()
                if (data?.user) {
                    setUser(data.user)
                }
            } catch (err) {
                console.error("GetMe failed:", err)
                localStorage.removeItem('token')
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}