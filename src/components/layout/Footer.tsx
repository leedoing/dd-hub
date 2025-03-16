'use client';

import { datadogRum } from '@datadog/browser-rum';

export default function Footer() {
  const handleLinkClick = (linkType: string) => {
    try {
      datadogRum.addAction('Footer_Link_Click', {
        link_type: linkType,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking footer link click:', error);
    }
  };

  return (
    <footer className="py-3 md:py-6 px-2 md:px-8 border-t mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between text-gray-500 text-xs md:text-sm">
        <div className="mb-2 sm:mb-0 text-center sm:text-left">
          © {new Date().getFullYear()} Datadog Hub.
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-2 md:gap-4">
          <span>Questions?</span>
          <a
            href="https://www.linkedin.com/in/hyunjin-lee-35a146b1/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 transition-colors"
            onClick={() => handleLinkClick('linkedin')}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}