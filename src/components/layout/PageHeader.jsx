import { cn } from '../../lib/utils';

export function PageHeader({ title, description, children, className }) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8", className)}>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-gray-500 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 self-start md:self-auto">
                    {children}
                </div>
            )}
        </div>
    );
}
