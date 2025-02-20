const initializeTracer = () => {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    try {
      // 동적 임포트로 변경
      const tracer = require('dd-trace');
      tracer.init({
        service: process.env.DD_SERVICE || 'dd-hub',
        env: process.env.DD_ENV || 'prod',
        version: process.env.DD_VERSION,
        logInjection: process.env.DD_LOGS_INJECTION === 'true',
        profiling: process.env.DD_PROFILING_ENABLED === 'true',
        appsec: process.env.DD_APPSEC_ENABLED === 'true',
        iast: process.env.DD_IAST_ENABLED === 'true',
      });
      return tracer;
    } catch (error) {
      console.error('Failed to initialize dd-trace:', error);
      return null;
    }
  }
  return null;
};

export default initializeTracer; 