'use client';

import Link from 'next/link';

interface Contributor {
  role: string;
  name: string;
  linkedin?: string;
}

interface FooterProps {
  className?: string;
  sidebarWidth?: string;
}

export default function Footer({ className = '', sidebarWidth = '' }: FooterProps) {
  const contributors: Contributor[] = [
    { role: 'Developer Team Lead & Project Co-manager', name: 'Benjamin Oyarzun', linkedin: 'https://www.linkedin.com/in/benjam%C3%ADn-o-73634a22b/' },
    { role: 'Project Co-manager', name: 'Kevin Ha', linkedin: 'https://www.linkedin.com/in/kevin-ha-6a17aa333' },
    { role: 'Contributor', name: 'Arash Mohamadpour', linkedin: 'https://www.linkedin.com/in/arash-mohamadpour-7b930b192/' },
  ];

  return (
    <footer className={`bg-gray-200 text-gray-800 transition-all duration-300 ${sidebarWidth} ${className}`}>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-8 min-w-0">
            {/* About This Project */}
            <div className="pt-0 lg:pt-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 break-words">
                About This Project
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed break-words">
                This project was developed and is fully maintained by the Developer Team of the Aachen Investment Club. 
                Our Sentiment Analysis Team is in charge of managing the sentiment analysis models and visualizations 
                that are being displayed in this website. For cost and performance reasons, we use a daily granularity. 
                We compute all metrics and plots from scratch using FinBERT models.
              </p>
            </div>

            {/* Contributors */}
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-wide text-gray-600 mb-3 sm:mb-4">
                CONTRIBUTORS
              </h3>
              <ul className="space-y-2">
                {contributors.filter(c => c.name).map((contributor, index) => (
                  <li key={index} className="text-xs sm:text-sm lg:text-base text-gray-700 break-words">
                    {contributor.role} - {contributor.name}
                    {contributor.linkedin && contributor.linkedin !== '#' && (
                      <Link
                        href={contributor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-700 underline inline-block"
                      >
                        LinkedIn
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-start min-w-0">
            <div className="pt-0 lg:pt-8">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-wide text-gray-600 mb-3 sm:mb-4">
                JOIN US
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 mb-4 sm:mb-6">
                Interested in our club?
              </p>
              <Link
                href="https://www.aachen-investment-club.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-800 rounded-lg text-xs sm:text-sm lg:text-base font-medium text-gray-800 hover:bg-gray-800 hover:text-white transition-colors duration-200"
              >
                Visit Our Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
