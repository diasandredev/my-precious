import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/auth';
import { Button, Input } from '@/components/ui';
import logo from '../assets/logo.png';
import { Loader2, ArrowRight } from 'lucide-react';

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
            setError('Falha ao autenticar com Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError('Por favor insira email e senha');
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
            setError(err.message || `Falha ao ${isSignUp ? 'cadastrar' : 'entrar'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center bg-slate-50/70 p-4 selection:bg-slate-900 selection:text-white">
            <Helmet>
                <title>{isSignUp ? 'Criar Conta - Precious' : 'Entrar - Precious'}</title>
                <meta name="description" content="Acesse com segurança seu painel do Precious para gerenciar finanças e patrimônio." />
                <link rel="canonical" href="https://my-precious-app.com/login" />
            </Helmet>

            {/* Subtle background ambient glow */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-slate-900">
                    
                    {/* Header with Logo */}
                    <div className="text-center space-y-2 mb-8">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs mb-2">
                            <img src={logo} alt="Precious" className="h-10 w-auto object-contain" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            {isSignUp ? 'Criar sua conta' : 'Bem-vindo de volta'}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500">
                            {isSignUp 
                                ? 'Gerencie seu patrimônio e investimentos em um só lugar' 
                                : 'Acesse seu painel financeiro e acompanhe sua evolução'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="bg-slate-50/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900 h-11 rounded-xl text-xs"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="bg-slate-50/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900 h-11 rounded-xl text-xs"
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            size="lg"
                            className="w-full h-11 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all rounded-xl shadow-sm mt-2 cursor-pointer"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
                                    <ArrowRight size={15} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold">
                            <span className="bg-white px-3 text-slate-400 tracking-wider">
                                Ou continue com
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-11 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all rounded-xl shadow-xs cursor-pointer"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <svg className="mr-2.5 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Conta Google
                    </Button>

                    <div className="text-center text-xs mt-6">
                        <span className="text-slate-500">
                            {isSignUp ? "Já possui uma conta? " : "Não tem uma conta? "}
                        </span>
                        <button
                            type="button"
                            className="font-bold text-slate-900 hover:underline underline-offset-4 cursor-pointer"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            {isSignUp ? 'Fazer login' : 'Cadastre-se'}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
