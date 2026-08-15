import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/auth';
import { Button, Input } from '@/components/ui';
import logo from '../assets/logo.png';
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

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
        <main className="relative min-h-screen flex items-center justify-center bg-slate-950 p-4 overflow-hidden selection:bg-indigo-500 selection:text-white">
            <Helmet>
                <title>{isSignUp ? 'Criar Conta - Precious' : 'Entrar - Precious'}</title>
                <meta name="description" content="Acesse com segurança seu painel do Precious para gerenciar finanças e patrimônio." />
                <link rel="canonical" href="https://my-precious-app.com/login" />
            </Helmet>

            {/* Ambient Background Light Orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/50 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/50 text-slate-100">
                    
                    {/* Header with Logo */}
                    <div className="text-center space-y-3 mb-8">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner mb-2">
                            <img src={logo} alt="Precious" className="h-10 w-auto object-contain" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                            {isSignUp ? 'Criar sua conta' : 'Bem-vindo de volta'}
                        </h1>
                        <p className="text-sm text-slate-400">
                            {isSignUp 
                                ? 'Gerencie seu patrimônio e investimentos em um só lugar' 
                                : 'Acesse seu painel financeiro e acompanhe sua evolução'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 h-11 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Senha</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 h-11 rounded-xl"
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            size="lg"
                            className="w-full h-11 text-base font-semibold bg-white text-slate-950 hover:bg-slate-100 transition-all rounded-xl shadow-lg mt-2 cursor-pointer"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
                                    <ArrowRight size={16} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
                                Ou continue com
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-11 text-sm font-semibold bg-slate-950/50 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-xl cursor-pointer"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <svg className="mr-2.5 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Conta Google
                    </Button>

                    <div className="text-center text-sm mt-6">
                        <span className="text-slate-400">
                            {isSignUp ? "Já possui uma conta? " : "Não tem uma conta? "}
                        </span>
                        <button
                            type="button"
                            className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 cursor-pointer"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            {isSignUp ? 'Fazer login' : 'Cadastre-se'}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>Criptografia ponta a ponta e dados protegidos</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
