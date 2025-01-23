# Datadog Hub Service

This service helps you find the best Dashboards and Monitors for your Datadog setup. These resources are curated from Datadog's out-of-box content and real-world experience. You can sync Dashboards and Monitors between your Datadog accounts in just a few clicks.

> ⚠️ **Note**: This is not an official Datadog service. This is a personal project created to enhance the convenience of using Datadog and for PoC (Proof of Concept) purposes. Datadog API Keys and Application Keys used in this service are not stored.

## Features

## Recommendations

### Dashboards Recommendations
- Datadog Cost Estimate
- Infrastructure & AWS
- APM (Not Traced Metrics, e.g trace.servlet.request)
- RUM
- MySQL & PostgreSQL

### Monitors Recommendations
- Infrastructure & Network
- Kubernetes
- APM (Not Traced Metrics, e.g trace.servlet.request)
- Logs
- RUM

## Synchronization

### Dashboard Synchronization
- Clone dashboards between environments
- Title-based filtering support
- Sync all dashboard components

### Monitor Synchronization
- Clone monitors between environments
- Tag-based filtering support
- Sync all monitor settings

## Supported Regions
- US1 (api.datadoghq.com)
- US3 (api.us3.datadoghq.com)
- US5 (api.us5.datadoghq.com)
- EU (api.datadoghq.eu)
- AP1 (api.ap1.datadoghq.com)
- US1-FED (api.ddog-gov.com)

## Important Notes
- API keys and Application keys must have appropriate permissions
- No API keys or Application keys are stored in the application

## Getting Started

1. Source Environment Setup
   - Enter API Key and Application Key
   - Select region
   - Set filter (optional)

2. Target Environment Setup
   - Enter API Key and Application Key
   - Select region

3. Click Sync Button
   - Monitor synchronization progress
   - Check result report

## License

This is a personal project created for internal use. Feel free to use and modify as needed.