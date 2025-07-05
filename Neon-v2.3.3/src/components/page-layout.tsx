"use client";

import { ReactNode } from "react";
import Navigation from "./Navigation";
import { Bell, Search } from "lucide-react";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function PageLayout({
  children,
  title,
  subtitle,
  headerActions,
  breadcrumbs,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="nav-glass border-b border-white/10 lg:border-l-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-1">
                {breadcrumbs && (
                  <nav className="flex mb-2" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                      {breadcrumbs.map((crumb, index) => (
                        <li key={index} className="flex items-center">
                          {index > 0 && (
                            <span className="mx-2 text-gray-400">/</span>
                          )}
                          {crumb.href ? (
                            <a
                              href={crumb.href}
                              className="text-sm text-gray-300 hover:text-white transition-colors"
                            >
                              {crumb.label}
                            </a>
                          ) : (
                            <span className="text-sm text-white font-medium">
                              {crumb.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}

                {title && (
                  <div>
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    {subtitle && (
                      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {headerActions}
                <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-pink rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

// Also export as named export for backward compatibility
export { PageLayout };
