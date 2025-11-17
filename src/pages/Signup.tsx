import { SignupForm } from "@/components/signup-form"
import { useNavigate } from "react-router-dom"

export const Signup = () => {
  const navigate = useNavigate()

  const handleSuccess = () => {
    // Redirect to login page or dashboard after successful signup
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <SignupForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
