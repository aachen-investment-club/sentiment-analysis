'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ArticleUploader from '../components/ArticleUploader';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../lib/api';

const backendBase = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
const loginUrl = `${backendBase}/login`;

export default function UploadPage() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${backendBase}/user`, {
          credentials: 'include',
        });
        if (!cancelled) {
          setIsAuthenticated(res.ok);
        }
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Header Section */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
        <div className="w-full px-4 sm:px-6 py-8 sm:py-12">
          <div className="mx-auto text-center max-w-full lg:max-w-4xl xl:max-w-5xl">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Upload Article
              </h1>
            </div>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Add a new financial article to the database for sentiment analysis. 
              Fill in the metadata and content below.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full px-4 sm:px-6 py-8 sm:py-16 transition-all duration-300 ${sidebarWidth}`}>
        <div className="mx-auto space-y-8 sm:space-y-12 max-w-full lg:max-w-4xl xl:max-w-5xl">
          
          {!authChecked && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center text-gray-600">
              Checking authentication...
            </div>
          )}

          {authChecked && !isAuthenticated && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Log in required</h2>
              <p className="text-gray-700 mb-4">
                You must be signed in to upload articles.
              </p>
              <a
                href={loginUrl}
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log in
              </a>
            </div>
          )}

          {authChecked && isAuthenticated && (
            <>
              {/* Upload Form */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <ArticleUploader />
              </div>

              {/* Help Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Upload Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Ensure all required metadata fields are filled accurately</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Select appropriate assets, commodities, and markets related to the article</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>The language will be auto-detected from the title, but you can override it if needed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>After uploading, you can immediately use the article in Progression or Comparison mode</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer sidebarWidth={sidebarWidth} />
    </div>
  );
}
