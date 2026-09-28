import React from 'react';
import { Amplify } from 'aws-amplify';
import {
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import { ENTITLEMENT_ENDPOINT, SUBSCRIPTION_ACTIVATION_ENDPOINT } from '../config/endpoints';

const region = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_yz3WT2sdT';
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '67vv566d0rt1g3odmekd48chjg';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
      },
    },
  },
});

export const AuthContext = React.createContext(null);

const DUMMY_PREMIUM_STORAGE_KEY = 'blackdeck_dummy_premium_users_v1';

const isLocalPremiumFallbackEnabled = () => {
  return String(import.meta.env.VITE_ENABLE_LOCAL_PREMIUM_FALLBACK || 'false').toLowerCase() === 'true';
};

const readDummyPremiumUsers = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(DUMMY_PREMIUM_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeDummyPremiumUsers = (users) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(DUMMY_PREMIUM_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage write errors in demo mode.
  }
};

const getUserPremiumKeys = (user) => {
  if (!user) return [];

  const keys = [user.userId, user.email, user.username]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim().toLowerCase());

  return [...new Set(keys)];
};

const hasDummyPremiumForUser = (user) => {
  const keys = getUserPremiumKeys(user);
  if (!keys.length) return false;

  const premiumUsers = readDummyPremiumUsers();
  return keys.some((key) => premiumUsers.includes(key));
};

const activateDummyPremiumForUser = (user) => {
  const keys = getUserPremiumKeys(user);
  if (!keys.length) return false;

  const premiumUsers = readDummyPremiumUsers();
  const nextUsers = [...new Set([...premiumUsers, ...keys])];
  writeDummyPremiumUsers(nextUsers);
  return true;
};

const isPremiumEntitlementPayload = (payload) => {
  const premiumFlag = payload?.premium;
  if (premiumFlag === true) return true;

  const plan = payload?.plan || payload?.subscription?.plan;
  const status = payload?.status || payload?.subscription?.status;

  if (typeof plan !== 'string' || plan.toLowerCase() !== 'premium') {
    return false;
  }

  if (!status) return true;
  return ['active', 'trialing'].includes(String(status).toLowerCase());
};

const parseAuthError = (err) => {
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }

  return 'Authentication failed. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [signInStep, setSignInStep] = React.useState('');
  const [isPremium, setIsPremium] = React.useState(false);
  const [hasDummyPremium, setHasDummyPremium] = React.useState(false);

  const refreshSession = React.useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      const accessToken = session.tokens?.accessToken?.toString() || '';
      const resolvedUser = {
        username: currentUser.username,
        userId: currentUser.userId,
        email: attributes.email || currentUser.signInDetails?.loginId || '',
        name: attributes.name || '',
        accessToken,
      };
      const localPremium = hasDummyPremiumForUser(resolvedUser);

      setUser(resolvedUser);
      setIsAuthenticated(Boolean(accessToken));
      setSignInStep('');
      setError('');
      setHasDummyPremium(localPremium);

      let premiumFromEntitlement = false;

      // Fetch premium status after successful auth
      if (accessToken) {
        try {
          const response = await fetch(ENTITLEMENT_ENDPOINT, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const payload = await response.json();
            premiumFromEntitlement = isPremiumEntitlementPayload(payload);
          }
        } catch {
          premiumFromEntitlement = false;
        }
      }

      setIsPremium(localPremium || premiumFromEntitlement);

      return true;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setIsPremium(false);
      setHasDummyPremium(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    const init = async () => {
      await refreshSession();
      setIsLoading(false);
    };

    init();
  }, [refreshSession]);

  const login = async ({ email, password }) => {
    setError('');
    try {
      const result = await signIn({ username: email, password });

      if (result?.isSignedIn) {
        const refreshed = await refreshSession();
        return { success: refreshed, isAuthenticated: refreshed };
      }

      const nextStep = result?.nextStep?.signInStep || 'UNKNOWN';
      setSignInStep(nextStep);

      return {
        success: false,
        isAuthenticated: false,
        nextStep,
        message: 'Additional sign-in steps are required for this account.',
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, isAuthenticated: false, message };
    }
  };

  const completeNewPassword = async ({ newPassword }) => {
    setError('');
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });

      if (result?.isSignedIn) {
        const refreshed = await refreshSession();
        return { success: refreshed, isAuthenticated: refreshed };
      }

      const nextStep = result?.nextStep?.signInStep || 'UNKNOWN';
      setSignInStep(nextStep);
      return {
        success: false,
        isAuthenticated: false,
        nextStep,
        message: 'More verification is still required.',
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, isAuthenticated: false, message };
    }
  };

  const register = async ({ name, email, password }) => {
    setError('');
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
          autoSignIn: true,
        },
      });

      return {
        success: true,
        nextStep: result.nextStep?.signUpStep || 'DONE',
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const confirmRegistration = async ({ email, code }) => {
    setError('');
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const requestPasswordReset = async ({ email }) => {
    setError('');
    try {
      const result = await resetPassword({ username: email });
      return {
        success: true,
        nextStep: result?.nextStep?.resetPasswordStep || 'DONE',
        delivery: result?.nextStep?.codeDeliveryDetails,
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const confirmPasswordReset = async ({ email, code, newPassword }) => {
    setError('');
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      return { success: true };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    setError('');
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      setSignInStep('');
      setIsPremium(false);
      setHasDummyPremium(false);
      return { success: true };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const fetchPremiumStatus = async () => {
    const localPremium = hasDummyPremiumForUser(user);
    setHasDummyPremium(localPremium);

    if (!isAuthenticated || !user?.accessToken) {
      setIsPremium(false);
      return;
    }

    let premiumFromEntitlement = false;

    try {
      const response = await fetch(ENTITLEMENT_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      if (!response.ok) {
        setIsPremium(localPremium);
        return;
      }

      const payload = await response.json();
      premiumFromEntitlement = isPremiumEntitlementPayload(payload);
      setIsPremium(localPremium || premiumFromEntitlement);
    } catch {
      setIsPremium(localPremium || premiumFromEntitlement);
    }
  };

  const activateDummyPremium = async () => {
    if (!isAuthenticated || !user) {
      return { success: false, message: 'Sign in before upgrading to premium.' };
    }

    try {
      const response = await fetch(SUBSCRIPTION_ACTIVATION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: 'checkout-demo' }),
      });

      if (!response.ok) {
        let message = `Activation API returned ${response.status}.`;
        try {
          const payload = await response.json();
          if (typeof payload?.message === 'string' && payload.message.trim()) {
            message = payload.message;
          }
        } catch {
          // Ignore JSON parse errors and keep default message.
        }

        if (!isLocalPremiumFallbackEnabled()) {
          return {
            success: false,
            message: `Could not update subscription table: ${message} Verify the hardcoded activation endpoint and redeploy backend routes if needed.`,
          };
        }
      } else {
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        const premiumActive = payload ? isPremiumEntitlementPayload(payload) : true;
        setHasDummyPremium(false);
        setIsPremium(premiumActive);

        return {
          success: true,
          source: 'backend',
          message: 'Premium activated and saved to the subscription table.',
        };
      }
    } catch (err) {
      if (!isLocalPremiumFallbackEnabled()) {
        return {
          success: false,
            message: `Could not update subscription table: ${parseAuthError(err)}. Check API Gateway CORS AllowedOrigins for this site's domain and verify the activation endpoint.`,
        };
      }
    }

    const activated = activateDummyPremiumForUser(user);
    if (!activated) {
      return { success: false, message: 'Could not activate premium for this account.' };
    }

    setHasDummyPremium(true);
    setIsPremium(true);
    return {
      success: true,
      source: 'local',
      message: 'Premium activated locally only. Subscription table was not updated.',
    };
  };

  const value = {
    region,
    isAuthenticated,
    isLoading,
    user,
    error,
    signInStep,
    isPremium,
    hasDummyPremium,
    login,
    register,
    confirmRegistration,
    requestPasswordReset,
    confirmPasswordReset,
    completeNewPassword,
    activateDummyPremium,
    logout,
    refreshSession,
    fetchPremiumStatus,
    clearError: () => setError(''),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};