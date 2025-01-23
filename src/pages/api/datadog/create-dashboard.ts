import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dashboardData, apiKey, appKey, apiUrl } = req.body;

  try {
    const response = await fetch(`${apiUrl}/dashboard`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
      },
      body: JSON.stringify(dashboardData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0] || 'Failed to create dashboard');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Failed to create dashboard:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create dashboard' });
  }
} 