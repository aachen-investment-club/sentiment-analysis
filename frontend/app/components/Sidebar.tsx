'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-lg p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-40
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Sidebar Header with Toggle Button */}
          <div className="mb-8 flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-2xl font-bold text-gray-900">Navigation</h2>
            )}
            <button
              onClick={toggleSidebar}
              className={`hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                isCollapsed ? '' : 'ml-auto'
              }`}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isCollapsed ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Home Button */}
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`
              w-full px-4 py-3 rounded-lg font-medium transition-colors mb-4 flex items-center gap-3
              ${
                isActive('/')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Home' : ''}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {!isCollapsed && <span>Home</span>}
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-300 my-4"></div>

          {/* Modes Section */}
          <div className="mb-4">
            {!isCollapsed && (
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                Modes
              </h3>
            )}

            {/* Progression Mode */}
            <Link
              href="/progression"
              onClick={() => setIsOpen(false)}
              className={`
                block w-full px-4 py-3 rounded-lg font-medium transition-colors mb-2 flex items-center gap-3
                ${
                  isActive('/progression')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Sentiment over time mode' : ''}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {!isCollapsed && <span className="truncate">Sentiment over time mode</span>}
            </Link>

            {/* Comparison Mode */}
            <Link
              href="/comparison"
              onClick={() => setIsOpen(false)}
              className={`
                block w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3
                ${
                  isActive('/comparison')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Asset sentiment comparison mode' : ''}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              {!isCollapsed && <span className="truncate">Asset sentiment comparison mode</span>}
            </Link>
          </div>

          {/* Analyze Link */}
          <div className="mt-auto pt-4 border-t border-gray-300">
            <Link
              href="/analyze"
              onClick={() => setIsOpen(false)}
              className={`
                block w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3
                ${
                  isActive('/analyze')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Quick Analyze' : ''}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              {!isCollapsed && <span>Quick Analyze</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

