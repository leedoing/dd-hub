export default function Footer() {
    return (
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Datadog Sync Tool. All rights reserved.
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Questions? Contact:</span>
              <a
                href="mailto:lluckyy77@gmail.com"
                className="text-purple-600 hover:text-purple-800 transition-colors text-sm"
              >
                lluckyy77@gmail.com
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="https://github.com/leedoing/dd-hub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 transition-colors text-sm"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }