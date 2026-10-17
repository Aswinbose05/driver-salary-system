import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  badge?: string;
  trend?: string;
}

const colorVariants = {
  emerald: {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    valueText: 'text-emerald-700 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-50/70 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    valueText: 'text-blue-700 dark:text-blue-400',
  },
  amber: {
    bg: 'bg-amber-50/70 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    valueText: 'text-amber-700 dark:text-amber-400',
  },
  purple: {
    bg: 'bg-purple-50/70 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800/50',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    valueText: 'text-purple-700 dark:text-purple-400',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-200 dark:border-slate-800',
    iconBg: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    valueText: 'text-slate-900 dark:text-slate-100',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
  badge,
  trend,
}) => {
  const styles = colorVariants[variant] || colorVariants.emerald;

  return (
    <div
      className={`rounded-2xl p-5 border ${styles.bg} ${styles.border} shadow-sm backdrop-blur-sm transition-all hover:shadow-md flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div>
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${styles.valueText}`}>
          {value}
        </div>

        {(subtitle || badge || trend) && (
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            {subtitle && <span>{subtitle}</span>}
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
            {trend && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{trend}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
