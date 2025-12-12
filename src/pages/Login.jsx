import { useState } from 'react';
import { signInWithGoogle } from '../services/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui';
import logo from '../assets/logo.png';
import { Loader2 } from 'lucide-react';

export function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            // App component handles the redirect via auth listener
        } catch (err) {
            console.error(err);
            setError('Failed to sign in via Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-md shadow-xl border-gray-100/50 bg-white/80 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="Precious" className="h-12 w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    <Button
                        variant="default"
                        size="lg"
                        className="w-full h-12 text-base font-medium transition-all"
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                        )}
                        Sign in with Google
                    </Button>
                </CardContent>
                <CardFooter className="text-center text-sm text-muted-foreground mt-4">
                    By clicking continue, you agree to our Terms of Service and Privacy Policy.
                </CardFooter>
            </Card>
        </div>
    );
}
