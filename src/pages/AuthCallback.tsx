import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export const AuthCallback = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL (contains the tokens after OAuth or email confirmation)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const type = hashParams.get("type")

        if (type === "recovery") {
          // Handle password recovery
          setMessage("Please set your new password")
          setStatus("success")
          navigate("/reset-password")
          return
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            throw error
          }

          if (data.session) {
            setStatus("success")
            setMessage("Authentication successful! Redirecting...")

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate("/")
            }, 1500)
          }
        } else {
          // Check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession()

          if (session) {
            setStatus("success")
            setMessage("Already authenticated! Redirecting...")
            setTimeout(() => {
              navigate("/")
            }, 1500)
          } else {
            throw new Error("No authentication tokens found")
          }
        }
      } catch (error: unknown) {
        console.error("Auth callback error:", error)
        setStatus("error")
        setMessage(
          error instanceof Error
            ? error.message
            : "Authentication failed. Please try again."
        )

        // Redirect to login after error
        setTimeout(() => {
          navigate("/login")
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing authentication..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Verifying your credentials...
              </p>
            </div>
          )}

          {status === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
