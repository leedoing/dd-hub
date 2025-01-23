import tracer from 'dd-trace';

tracer.init({
  service: process.env.DD_SERVICE || 'dd-sync',
  env: process.env.DD_ENV || 'prod',
  version: process.env.DD_VERSION,
  logInjection: process.env.DD_LOGS_INJECTION === 'true',
  profiling: process.env.DD_PROFILING_ENABLED === 'true',
  appsec: process.env.DD_APPSEC_ENABLED === 'true',
  iast: process.env.DD_IAST_ENABLED === 'true',
});

export default tracer; 