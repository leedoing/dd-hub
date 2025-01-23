const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-5 rounded-lg flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-purple-900 font-medium">Syncing...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 