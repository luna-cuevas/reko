import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStateContext } from '../context/StateContext';

const SpotifyCallback = () => {
  const { setState, state } = useStateContext();
  const router = useRouter();

  useEffect(() => {
    // Extract access token from URL fragment
    const hashFragment = window.location.hash.substring(1);
    const params = new URLSearchParams(hashFragment);
    const accessToken = params.get('access_token');

    const storedSessionStr = localStorage.getItem('session');

    // Store access token in state/context
    console.log('Handling state session...', JSON.parse(storedSessionStr));
    setState({
      ...state,
      session: JSON.parse(storedSessionStr),
      expiresAt: JSON.parse(storedSessionStr)?.expires_at,
      devCredentials: localStorage.getItem('devCredentials') || '',
      userAuthorizationCode: accessToken,
    });

    console.log('Handling localStorage session');
    localStorage.setItem('session', storedSessionStr);
    localStorage.setItem('expiresAt', JSON.parse(storedSessionStr)?.expires_at);

    localStorage.setItem('userAuthorizationCode', accessToken);

    if (accessToken) {
      router.push('/');
    }
  }, []);

  return <div>Processing Spotify callback...</div>;
};

export default SpotifyCallback;
