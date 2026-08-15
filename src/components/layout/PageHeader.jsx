import { cn } from '../../lib/utils';

export function PageHeader({ title, description, children, className }) {
    return (
        <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-1", className)}>
            <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {title}
                </h1>
                {description && (
                    <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
}
