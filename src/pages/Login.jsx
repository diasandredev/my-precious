import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/auth';
import { Button, Card, CardContent, CardHeader, Input } from '@/components/ui';
import logo from '../assets/logo.png';
import { Loader2 } from 'lucide-react';

export function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error(err);
            setError('Failed to sign in via Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-md shadow-xl border-gray-100/50 bg-white/80 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="flex justify-center mb-4 mt-4">
                        <img src={logo} alt="Precious" className="h-24 w-auto animate-in zoom-in-50 duration-500" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isSignUp ? 'Enter your details to create your account' : 'Enter your credentials to access your account'}
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pb-8 px-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            size="lg"
                            className="w-full h-10 text-base font-medium transition-all shadow-md hover:shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                isSignUp ? 'Sign Up' : 'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-10 text-base font-medium transition-all"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Google
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        </span>
                        <button
                            type="button"
                            className="font-medium text-primary hover:underline underline-offset-4"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
