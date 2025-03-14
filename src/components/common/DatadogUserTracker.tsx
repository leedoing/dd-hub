'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { datadogRum } from '@datadog/browser-rum';

export function DatadogUserTracker() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    // Log session state for debugging
    console.log('Session status:', status);
    console.log('Session data:', session ? {
      hasUser: !!session.user,
      hasEmail: !!session.user?.email,
      email: session.user?.email
    } : 'No session');
    
    if (status === 'authenticated' && session?.user?.email) {
      // Set user information in Datadog RUM
      datadogRum.setUser({
        id: session.user.email,
        email: session.user.email,
        // Add any other user properties you need
        isAuthenticated: true,
        isContributor: session.user.isContributor || false,
        sessionStatus: status
      });
      console.log('Datadog user set:', session.user.email);
    } else if (status === 'unauthenticated' || status === 'loading') {
      // Clear user information when not authenticated
      datadogRum.clearUser();
      console.log('Datadog user cleared, status:', status);
    }
  }, [session, status]);
  
  return null; // This component doesn't render anything
} 