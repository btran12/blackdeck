import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  Switch,
  FormControlLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Button,
  Box,
  Stack,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { WidgetContext } from '../context/WidgetContext';
import { ENTITLEMENT_ENDPOINT } from '../config/endpoints';
import {
  createWidgetSettingsForType,
  getLayoutPreset,
  getPositionLabel,
  FONT_OPTIONS,
  LAYOUT_PRESETS,
  normalizeLayoutPreset,
  WIDGET_OPTIONS,
} from './widgetConfig';

const FALLBACK_CITIES = [
  'New York, New York',
  'Los Angeles, California',
  'Chicago, Illinois',
  'Houston, Texas',
  'Phoenix, Arizona',
  'Philadelphia, Pennsylvania',
  'San Francisco, California',
  'Seattle, Washington',
  'Denver, Colorado',
  'Boston, Massachusetts',
  'Miami, Florida',
  'Atlanta, Georgia',
  'Austin, Texas',
  'Portland, Oregon',
  'Las Vegas, Nevada',
];

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    color: '#f3f3f3',
    bgcolor: 'rgba(255,255,255,0.04)',
    borderRadius: 2,
    transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover': {
      bgcolor: 'rgba(255,255,255,0.06)',
    },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
    '&.Mui-focused': {
      bgcolor: 'rgba(33,150,243,0.08)',
      boxShadow: '0 0 0 3px rgba(33,150,243,0.12)',
    },
    '&.Mui-focused fieldset': { borderColor: '#4dabf5' },
    '&.Mui-disabled': {
      bgcolor: 'rgba(255,255,255,0.08)',
    },
    '&.Mui-disabled fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
  },
  '& .MuiInputBase-input': { color: '#eef3f7' },
  '& .MuiInputBase-input::placeholder': { color: '#9ea9ba', opacity: 1 },
  '& .MuiInputBase-input.Mui-disabled': {
    color: '#d8e0ea',
    WebkitTextFillColor: '#d8e0ea',
    opacity: 1,
  },
  '& .MuiInputLabel-root': { color: '#b7c1cf' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#90caf9' },
  '& .MuiInputLabel-root.Mui-disabled': { color: '#a9b4c4' },
  '& .MuiFormHelperText-root': { color: '#95a1b3' },
  '& .MuiFormHelperText-root.Mui-disabled': { color: '#8d98a8' },
};

const selectStyles = {
  color: '#f3f3f3',
  bgcolor: 'rgba(255,255,255,0.04)',
  borderRadius: 2,
  transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.06)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.16)' },
  '&.Mui-focused': {
    bgcolor: 'rgba(33,150,243,0.08)',
    boxShadow: '0 0 0 3px rgba(33,150,243,0.12)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4dabf5' },
  '& .MuiSvgIcon-root': { color: '#d5d9df' },
};

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: '#121212',
      color: '#f3f3f3',
      border: '1px solid rgba(255,255,255,0.08)',
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      '& .MuiList-root': {
        py: 0.5,
      },
      '& .MuiMenuItem-root': {
        color: '#f3f3f3',
        borderRadius: 1,
        mx: 0.5,
        my: 0.25,
        '&:hover': {
          bgcolor: 'rgba(33,150,243,0.16)',
        },
        '&.Mui-selected': {
          bgcolor: 'rgba(33,150,243,0.24)',
          '&:hover': {
            bgcolor: 'rgba(33,150,243,0.3)',
          },
        },
      },
    },
  },
};

const buildSettingsDefaultsFromInstances = (layoutWidgets, widgetSettingsMap, previousSettings) => {
  const nextSettings = { ...previousSettings };

  layoutWidgets.forEach((widgetType, position) => {
    const instanceSettings = widgetSettingsMap[position];
    if (!widgetType || !instanceSettings) return;

    if (widgetType === 'clock' && instanceSettings.clockFormat) {
      nextSettings.clockFormat = instanceSettings.clockFormat;
    }

    if (widgetType === 'weather') {
      nextSettings.tempUnit = instanceSettings.tempUnit || nextSettings.tempUnit;
      nextSettings.clockFormat = instanceSettings.clockFormat || nextSettings.clockFormat;
    }

    if (widgetType === 'calendar' && instanceSettings.icsUrl) {
      nextSettings.icsUrl = instanceSettings.icsUrl;
    }

    if (widgetType === 'airquality') {
      // Keep global default location user-controlled in Settings.
    }

    if (widgetType === 'compliments') {
      nextSettings.complimentsConfigUrl = instanceSettings.complimentsConfigUrl || nextSettings.complimentsConfigUrl;
    }
  });

  return nextSettings;
};

const entitlementEndpoint = ENTITLEMENT_ENDPOINT;

const getPremiumStatusFromEntitlement = (payload) => {
  const plan = payload?.plan || payload?.subscription?.plan;
  const status = payload?.status || payload?.subscription?.status;
  const premiumFlag = payload?.premium;

  if (premiumFlag === true) return 'premium';

  if (typeof plan === 'string' && plan.toLowerCase() === 'premium') {
    if (!status || ['active', 'trialing'].includes(String(status).toLowerCase())) {
      return 'premium';
    }
  }

  if (premiumFlag === false) return 'free';
  if (typeof plan === 'string') return 'free';

  return 'unknown';
};

const getPremiumChipConfig = (status) => {
  if (status === 'premium') {
    return {
      label: 'Premium',
      sx: {
        height: 22,
        bgcolor: '#f4b400',
        color: '#111111',
        fontWeight: 700,
      },
    };
  }

  if (status === 'free' || status === 'error') {
    return {
      label: 'Standard',
      sx: {
        height: 22,
        bgcolor: 'transparent',
        color: '#b0b0b0',
        border: '1px solid #666666',
      },
    };
  }

  return {
    label: 'Checking...',
    sx: {
      height: 22,
      bgcolor: 'transparent',
      color: '#90caf9',
      border: '1px solid #90caf9',
    },
  };
};

const LOCATION_WIDGETS = new Set(['weather', 'airquality', 'compliments']);

const fetchOpenMeteoSuggestions = async (query) => {
  if (!query || query.length < 1) return [];

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
  );

  if (!response.ok) {
    throw new Error(`Fallback geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  return results.map((item) => {
    const parts = [item.name, item.admin1, item.country].filter(Boolean);
    return parts.join(', ');
  });
};

const applyDefaultLocationToWidgetSettings = (layoutWidgets, widgetSettingsMap, defaultLocation) => {
  const nextWidgetSettings = { ...widgetSettingsMap };

  layoutWidgets.forEach((widgetType, position) => {
    if (!LOCATION_WIDGETS.has(widgetType)) return;

    const currentSettings = nextWidgetSettings[position];
    if (!currentSettings || currentSettings.widgetType !== widgetType) return;

    nextWidgetSettings[position] = {
      ...currentSettings,
      location: defaultLocation,
    };
  });

  return nextWidgetSettings;
};

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, layout, widgetSettings, saveDashboardConfiguration } = useContext(WidgetContext);
  const auth = useAuth();
  const hideApiKeyFields = auth.isAuthenticated && auth.isPremium;
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localLayoutPreset, setLocalLayoutPreset] = useState(layout.preset);
  const [localWidgetSettings, setLocalWidgetSettings] = useState(widgetSettings);
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authResetCode, setAuthResetCode] = useState('');
  const [authResetPassword, setAuthResetPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [premiumStatus, setPremiumStatus] = useState('unknown');
  const [entitlementDetail, setEntitlementDetail] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutCardholder, setCheckoutCardholder] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const searchCacheRef = useRef({});
  const citySearchRequestRef = useRef(0);

  const accountLabel = auth.user?.name || auth.user?.email || auth.user?.username || 'Signed in user';

  useEffect(() => {
    if (!isOpen) return;

    setLocalSettings(settings);
    setLocalLayout(layout.widgets);
    setLocalLayoutPreset(layout.preset);
    setLocalWidgetSettings(widgetSettings);
    setAuthMessage('');
    setEntitlementDetail('');
    auth.clearError();
  }, [isOpen, layout.preset, layout.widgets, settings, widgetSettings]);

  useEffect(() => {
    if (!isOpen || !auth.isAuthenticated || !auth.user?.accessToken) {
      setPremiumStatus('unknown');
      setEntitlementDetail('');
      return;
    }

    if (auth.isPremium) {
      setPremiumStatus('premium');
      setEntitlementDetail(
        auth.hasDummyPremium ? 'Activated locally via dummy checkout (demo mode).' : ''
      );
      return;
    }

    const controller = new AbortController();

    const fetchEntitlement = async () => {
      setPremiumStatus('unknown');
      setEntitlementDetail('');

      try {
        const response = await fetch(entitlementEndpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth.user.accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Entitlement check failed: ${response.status}`);
        }

        const payload = await response.json();
        const nextStatus = getPremiumStatusFromEntitlement(payload);
        setPremiumStatus(nextStatus === 'unknown' ? 'free' : nextStatus);

        if (payload?.currentPeriodEnd) {
          setEntitlementDetail(`Renews until ${new Date(payload.currentPeriodEnd).toLocaleDateString()}`);
        }
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setPremiumStatus('free');
          setEntitlementDetail('');
        }
      }
    };

    fetchEntitlement();

    return () => controller.abort();
  }, [isOpen, auth.isAuthenticated, auth.user?.accessToken, auth.isPremium, auth.hasDummyPremium]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    setAuthMode('login');
    setAuthPassword('');
    setAuthCode('');
    setAuthNewPassword('');
    setAuthResetCode('');
    setAuthResetPassword('');
    setAuthMessage('You are signed in.');
  }, [auth.isAuthenticated]);

  useEffect(() => () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const query = String(localSettings.location || '').trim();
    const requestId = ++citySearchRequestRef.current;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query) {
      setCitySuggestions(FALLBACK_CITIES.slice(0, 8));
      setCityLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCitySuggestions(query, localSettings.openweatherApiKey, requestId);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isOpen, localSettings.location, localSettings.openweatherApiKey]);

  const fetchCitySuggestions = async (query, apiKey, requestId) => {
    if (!query || query.length < 1) {
      if (requestId === citySearchRequestRef.current) {
        setCitySuggestions([]);
        setCityLoading(false);
      }
      return;
    }

    const cacheKey = `${apiKey || 'fallback'}:${query.toLowerCase()}`;
    if (searchCacheRef.current[cacheKey]) {
      if (requestId === citySearchRequestRef.current) {
        setCitySuggestions(searchCacheRef.current[cacheKey]);
        setCityLoading(false);
      }
      return;
    }

    if (!apiKey) {
      setCityLoading(true);
      try {
        const openMeteoResults = await fetchOpenMeteoSuggestions(query);
        const fallbackCities = FALLBACK_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
        const merged = Array.from(new Set([...openMeteoResults, ...fallbackCities]));
        const fallbackResults = merged.length > 0 ? merged : FALLBACK_CITIES.slice(0, 8);
        searchCacheRef.current[cacheKey] = fallbackResults;
        if (requestId === citySearchRequestRef.current) {
          setCitySuggestions(fallbackResults);
        }
      } catch {
        const fallbackCities = FALLBACK_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
        const fallbackResults = fallbackCities.length > 0 ? fallbackCities : FALLBACK_CITIES.slice(0, 8);
        searchCacheRef.current[cacheKey] = fallbackResults;
        if (requestId === citySearchRequestRef.current) {
          setCitySuggestions(fallbackResults);
        }
      } finally {
        if (requestId === citySearchRequestRef.current) {
          setCityLoading(false);
        }
      }
      return;
    }

    setCityLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${apiKey}`
      );
      if (!response.ok) throw new Error(`City search failed: ${response.status}`);

      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted = data.map((location) => {
          let label = location.name;
          if (location.state) label += `, ${location.state}`;
          if (location.country) label += `, ${location.country}`;
          return label;
        });

        searchCacheRef.current[cacheKey] = formatted;
        if (requestId === citySearchRequestRef.current) {
          setCitySuggestions(formatted);
        }
      } else if (requestId === citySearchRequestRef.current) {
        setCitySuggestions([]);
      }
    } catch (error) {
      try {
        const openMeteoResults = await fetchOpenMeteoSuggestions(query);
        const fallbackCities = FALLBACK_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
        const merged = Array.from(new Set([...openMeteoResults, ...fallbackCities]));
        const fallbackResults = merged.length > 0 ? merged : FALLBACK_CITIES.slice(0, 8);

        if (requestId === citySearchRequestRef.current) {
          setCitySuggestions(fallbackResults);
        }
      } catch {
        if (requestId === citySearchRequestRef.current) {
          const fallbackCities = FALLBACK_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
          setCitySuggestions(fallbackCities.length > 0 ? fallbackCities : FALLBACK_CITIES.slice(0, 8));
        }
      }
    } finally {
      if (requestId === citySearchRequestRef.current) {
        setCityLoading(false);
      }
    }
  };

  const handleLocationInputChange = (newInputValue) => {
    handleDefaultSettingChange('location', newInputValue);
  };

  const handleLocationFocus = () => {
    const current = String(localSettings.location || '').trim();
    if (!current) {
      setCitySuggestions(FALLBACK_CITIES.slice(0, 8));
      return;
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) return;
    if (auth.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      setAuthMode('newPassword');
      setAuthMessage('Set a new password to finish signing in.');
    }
  }, [auth.isAuthenticated, auth.signInStep]);

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthMessage('');
    auth.clearError();
  };

  const handleLogin = async () => {
    if (!authEmail || !authPassword) {
      setAuthMessage('Enter your email and password.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.login({ email: authEmail.trim(), password: authPassword });
    setAuthBusy(false);

    if (result.success && result.isAuthenticated) {
      setAuthMessage('Logged in successfully.');
      setAuthPassword('');
      return;
    }

    if (!result.success && result.nextStep) {
      if (result.nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setAuthMode('newPassword');
        setAuthMessage('Set a new password to finish signing in.');
      } else {
        setAuthMessage(`Login needs extra verification (${result.nextStep}). Complete that step and try again.`);
      }
    }
  };

  const handleCompleteNewPassword = async () => {
    if (!authNewPassword) {
      setAuthMessage('Enter a new password.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.completeNewPassword({ newPassword: authNewPassword });
    setAuthBusy(false);

    if (result.success && result.isAuthenticated) {
      setAuthMessage('Password updated. Logged in successfully.');
      setAuthPassword('');
      setAuthCode('');
      setAuthNewPassword('');
      return;
    }

    if (!result.success && result.nextStep) {
      setAuthMessage(`Login still needs verification (${result.nextStep}).`);
    }
  };

  const handleSignup = async () => {
    if (!authName.trim() || !authEmail || !authPassword) {
      setAuthMessage('Enter your name, email, and password to sign up.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.register({
      name: authName.trim(),
      email: authEmail.trim(),
      password: authPassword,
    });
    setAuthBusy(false);

    if (result.success) {
      if (result.nextStep === 'CONFIRM_SIGN_UP') {
        setAuthMessage('Account created. Enter the verification code from your email.');
        setAuthMode('confirm');
      } else {
        setAuthMessage('Sign up completed. You can now use your account.');
      }
      setAuthPassword('');
    }
  };

  const handleConfirmSignup = async () => {
    if (!authEmail || !authCode) {
      setAuthMessage('Enter your email and verification code.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.confirmRegistration({ email: authEmail.trim(), code: authCode.trim() });
    setAuthBusy(false);

    if (result.success) {
      setAuthMessage('Email verified. Log in with your new account.');
      setAuthCode('');
      setAuthMode('login');
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!authEmail) {
      setAuthMessage('Enter your email to reset your password.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.requestPasswordReset({ email: authEmail.trim() });
    setAuthBusy(false);

    if (result.success) {
      const destination = result.delivery?.destination ? ` to ${result.delivery.destination}` : '';
      setAuthMessage(`Reset code sent${destination}. Enter the code and your new password.`);
      setAuthMode('resetPassword');
      setAuthPassword('');
      return;
    }

    setAuthMessage(result.message || 'Could not start password reset.');
  };

  const handleConfirmPasswordReset = async () => {
    if (!authEmail || !authResetCode || !authResetPassword) {
      setAuthMessage('Enter your email, reset code, and new password.');
      return;
    }

    setAuthBusy(true);
    const result = await auth.confirmPasswordReset({
      email: authEmail.trim(),
      code: authResetCode.trim(),
      newPassword: authResetPassword,
    });
    setAuthBusy(false);

    if (result.success) {
      setAuthMessage('Password reset successfully. Log in with your new password.');
      setAuthMode('login');
      setAuthResetCode('');
      setAuthResetPassword('');
      return;
    }

    setAuthMessage(result.message || 'Could not reset password.');
  };

  const handleLogout = async () => {
    setAuthBusy(true);
    const result = await auth.logout();
    setAuthBusy(false);

    if (result.success) {
      setAuthMessage('Logged out.');
      setAuthCode('');
      setAuthPassword('');
      setAuthNewPassword('');
      setAuthResetCode('');
      setAuthResetPassword('');
      setAuthName('');
      setAuthEmail('');
      setAuthMode('login');
    }
  };

  const openCheckout = () => {
    if (!auth.isAuthenticated) {
      setAuthMessage('Sign in before upgrading to premium.');
      return;
    }

    if (premiumStatus === 'premium') {
      setAuthMessage('This account already has premium access.');
      return;
    }

    setCheckoutCardholder(auth.user?.name || '');
    setCheckoutMessage('');
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (checkoutBusy) return;
    setIsCheckoutOpen(false);
    setCheckoutMessage('');
  };

  const handleCompleteCheckout = async () => {
    if (!checkoutCardholder.trim()) {
      setCheckoutMessage('Enter the cardholder name to continue.');
      return;
    }

    setCheckoutBusy(true);
    const result = await auth.activateDummyPremium();
    setCheckoutBusy(false);

    if (!result.success) {
      setCheckoutMessage(result.message || 'Could not complete checkout.');
      return;
    }

    const usedLocalFallback = result.source === 'local';
    setPremiumStatus('premium');
    setEntitlementDetail(
      usedLocalFallback
        ? 'Activated locally via dummy checkout (demo mode).'
        : 'Subscription activated and saved to backend table.'
    );
    setAuthMessage(result.message || 'Premium activated.');
    setCheckoutMessage(
      usedLocalFallback
        ? 'Demo payment succeeded. Premium is active locally only.'
        : 'Demo payment succeeded. Premium is active and saved to the subscription table.'
    );
    setIsCheckoutOpen(false);
  };

  const handleLayoutChange = (position, widgetType) => {
    const nextLayout = [...localLayout];
    nextLayout[position] = widgetType;
    setLocalLayout(nextLayout);

    setLocalWidgetSettings(prev => {
      const next = { ...prev };

      if (!widgetType) {
        delete next[position];
        return next;
      }

      if (next[position]?.widgetType === widgetType) {
        return next;
      }

      const existingInstance = Object.values(next).find(item => item?.widgetType === widgetType);
      next[position] = existingInstance
        ? { ...existingInstance, widgetType }
        : createWidgetSettingsForType(widgetType, localSettings);

      return next;
    });
  };

  const handleDefaultSettingChange = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const nextSettings = buildSettingsDefaultsFromInstances(localLayout, localWidgetSettings, localSettings);
    const defaultLocation = String(nextSettings.location || '').trim();
    const nextWidgetSettings = applyDefaultLocationToWidgetSettings(
      localLayout,
      localWidgetSettings,
      defaultLocation
    );

    saveDashboardConfiguration(localLayout, nextWidgetSettings, nextSettings, localLayoutPreset);
    onClose();
  };

  const layoutPresetOptions = Object.values(LAYOUT_PRESETS);
  const activeLayoutPreset = getLayoutPreset(localLayoutPreset);
  const premiumChip = getPremiumChipConfig(premiumStatus);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
          maxHeight: '90vh',
          scrollbarColor: '#3c4653 #161616',
          '& ::-webkit-scrollbar': {
            width: '10px',
          },
          '& ::-webkit-scrollbar-track': {
            background: '#161616',
          },
          '& ::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #3a4552, #2a313a)',
            borderRadius: '999px',
            border: '2px solid #161616',
          },
          '& ::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #4a5868, #33404d)',
          },
        },
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', pb: 2 }}>
        Settings
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 2,
          overflowY: 'auto',
          pr: 1.5,
          scrollbarWidth: 'thin',
          scrollbarColor: '#3c4653 #161616',
          '&::-webkit-scrollbar': {
            width: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#161616',
            borderRadius: '999px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #3a4552, #2a313a)',
            borderRadius: '999px',
            border: '2px solid #161616',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #4a5868, #33404d)',
          },
        }}
      >
        <Stack spacing={4}>
          <Box sx={{ order: 99 }}>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2, mt: 2 }}>Account</Typography>
            <Stack spacing={1.5}>
              {auth.isLoading && (
                <Typography sx={{ color: '#999999', fontSize: '0.9rem' }}>Checking sign-in status...</Typography>
              )}

              {auth.error && (
                <Typography sx={{ color: '#ff8a80', fontSize: '0.85rem' }}>
                  {auth.error}
                </Typography>
              )}

              {authMessage && (
                <Typography sx={{ color: '#90caf9', fontSize: '0.85rem' }}>
                  {authMessage}
                </Typography>
              )}

              {!auth.isLoading && auth.isAuthenticated && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ color: '#c8e6c9', fontSize: '0.9rem' }}>
                      Signed in as {accountLabel}
                    </Typography>
                    <Chip size="small" label={premiumChip.label} sx={premiumChip.sx} />
                  </Box>

                  {premiumStatus === 'premium' && entitlementDetail && (
                    <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                      {entitlementDetail}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {premiumStatus !== 'premium' && (
                      <Button
                        onClick={openCheckout}
                        disabled={authBusy}
                        variant="contained"
                        sx={{
                          bgcolor: '#f4b400',
                          color: '#111111',
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#d9a007' },
                        }}
                      >
                        Upgrade to Premium
                      </Button>
                    )}
                    <Button
                      onClick={handleLogout}
                      disabled={authBusy}
                      variant="outlined"
                      sx={{
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      Log Out
                    </Button>
                  </Box>

                  {auth.hasDummyPremium && (
                    <Typography sx={{ color: '#fdd663', fontSize: '0.8rem' }}>
                      Demo premium is active for this account.
                    </Typography>
                  )}
                </>
              )}

              {!auth.isLoading && !auth.isAuthenticated && (
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      onClick={() => switchAuthMode('login')}
                      variant={authMode === 'login' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'login' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'login' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      onClick={() => switchAuthMode('signup')}
                      variant={authMode === 'signup' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'signup' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'signup' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      Sign Up
                    </Button>
                    <Button
                      onClick={() => switchAuthMode('forgotPassword')}
                      variant={authMode === 'forgotPassword' || authMode === 'resetPassword' ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        bgcolor: authMode === 'forgotPassword' || authMode === 'resetPassword' ? '#2196f3' : 'transparent',
                        color: '#ffffff',
                        borderColor: '#444444',
                        '&:hover': {
                          borderColor: '#555555',
                          bgcolor: authMode === 'forgotPassword' || authMode === 'resetPassword' ? '#1976d2' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      Forgot Password
                    </Button>
                  </Box>

                  {authMode === 'signup' && (
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Enter your full name"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  <TextField
                    fullWidth
                    label="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    variant="outlined"
                    sx={fieldStyles}
                  />

                  {(authMode === 'login' || authMode === 'signup') && (
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter your password"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  {authMode === 'confirm' && (
                    <TextField
                      fullWidth
                      label="Verification Code"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="Enter email verification code"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  {authMode === 'newPassword' && (
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={authNewPassword}
                      onChange={(e) => setAuthNewPassword(e.target.value)}
                      placeholder="Enter a new secure password"
                      variant="outlined"
                      sx={fieldStyles}
                    />
                  )}

                  {authMode === 'resetPassword' && (
                    <>
                      <TextField
                        fullWidth
                        label="Reset Code"
                        value={authResetCode}
                        onChange={(e) => setAuthResetCode(e.target.value)}
                        placeholder="Enter password reset code"
                        variant="outlined"
                        sx={fieldStyles}
                      />
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={authResetPassword}
                        onChange={(e) => setAuthResetPassword(e.target.value)}
                        placeholder="Enter your new password"
                        variant="outlined"
                        sx={fieldStyles}
                      />
                    </>
                  )}

                  {authMode === 'login' && (
                    <Button
                      onClick={handleLogin}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Logging In...' : 'Log In'}
                    </Button>
                  )}

                  {authMode === 'signup' && (
                    <Button
                      onClick={handleSignup}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  )}

                  {authMode === 'confirm' && (
                    <Button
                      onClick={handleConfirmSignup}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Verifying...' : 'Verify Email'}
                    </Button>
                  )}

                  {authMode === 'newPassword' && (
                    <Button
                      onClick={handleCompleteNewPassword}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Updating Password...' : 'Set New Password'}
                    </Button>
                  )}

                  {authMode === 'forgotPassword' && (
                    <Button
                      onClick={handleRequestPasswordReset}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Sending Code...' : 'Send Reset Code'}
                    </Button>
                  )}

                  {authMode === 'resetPassword' && (
                    <Button
                      onClick={handleConfirmPasswordReset}
                      disabled={authBusy}
                      variant="contained"
                      sx={{
                        bgcolor: '#2196f3',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      {authBusy ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                  )}
                </Stack>
              )}

              {!auth.isLoading && !auth.isAuthenticated && (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.16)', my: 1 }} />
              )}

              <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                {auth.hasDummyPremium
                  ? 'You are using local fallback premium only. Enable backend activation endpoint for real subscription-table updates.'
                  : 'Use Upgrade to Premium for a demo checkout flow. No real payment is processed, but backend demo activation can update the subscription table.'}
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.16)', order: 98, mb: 2 }} />

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>Dashboard Layout</Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <FormControl size="small" variant="outlined" sx={{ maxWidth: 300 }}>
                <InputLabel sx={{ color: '#cccccc' }}>Layout Preset</InputLabel>
                <Select
                  value={normalizeLayoutPreset(localLayoutPreset)}
                  onChange={(e) => setLocalLayoutPreset(normalizeLayoutPreset(e.target.value))}
                  label="Layout Preset"
                  sx={selectStyles}
                  MenuProps={menuProps}
                >
                  {layoutPresetOptions.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ color: '#999999', fontSize: '0.85rem' }}>
                {activeLayoutPreset.description}
              </Typography>
            </Stack>
            <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
              {activeLayoutPreset.rows.map((row) => {
                const colWidths = row.colSpans;
                return (
                  <Box key={row.id}>
                    <Typography sx={{ color: '#ffffff', fontSize: '1rem', mb: 1 }}>
                      {row.label}
                    </Typography>
                    <Grid container spacing={2}>
                      {row.positions.map((position, index) => (
                        <Grid item xs={12} md={colWidths[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>{getPositionLabel(position, localLayoutPreset)}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={getPositionLabel(position, localLayoutPreset)}
                              sx={selectStyles}
                              MenuProps={menuProps}
                            >
                              {WIDGET_OPTIONS.map((option) => (
                                <MenuItem key={option.label} value={option.value || ''}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Appearance</Typography>
            <Stack spacing={2}>
              <FormControl size="small" variant="outlined" sx={{ maxWidth: 300 }}>
                <InputLabel sx={{ color: '#cccccc' }}>Font Family</InputLabel>
                <Select
                  value={localSettings.fontFamily || 'monospace'}
                  onChange={(e) => handleDefaultSettingChange('fontFamily', e.target.value)}
                  label="Font Family"
                  sx={selectStyles}
                  MenuProps={menuProps}
                >
                  {FONT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontFamily: option.value }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Default Location</Typography>
            <Stack spacing={1}>
              <Autocomplete
                freeSolo
                options={citySuggestions}
                filterOptions={(options) => options}
                openOnFocus
                value={localSettings.location || ''}
                onChange={(event, newValue) => {
                  handleDefaultSettingChange('location', newValue || '');
                }}
                inputValue={localSettings.location || ''}
                onInputChange={(event, newInputValue) => handleLocationInputChange(newInputValue)}
                onFocus={handleLocationFocus}
                loading={cityLoading}
                noOptionsText="No matching locations"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Location"
                    placeholder="Enter city name (e.g., New York)"
                    helperText="Used as the default for widgets that require a location"
                    variant="outlined"
                    sx={fieldStyles}
                  />
                )}
                slotProps={{
                  popper: {
                    sx: {
                      zIndex: 2000,
                    },
                  },
                  paper: {
                    sx: {
                      bgcolor: '#121212',
                      color: '#f3f3f3',
                      border: '1px solid rgba(255,255,255,0.08)',
                      '& .MuiAutocomplete-listbox': {
                        '& li': {
                          padding: '8px 16px',
                          '&[aria-selected="true"]': {
                            bgcolor: 'rgba(33,150,243,0.24)',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(33,150,243,0.16)',
                          },
                        },
                      },
                    },
                  },
                }}
              />
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Service Polling</Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={(
                  <Switch
                    checked={Boolean(localSettings.quietHoursEnabled)}
                    onChange={(e) => handleDefaultSettingChange('quietHoursEnabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#2196f3',
                        '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: 'rgba(33, 150, 243, 0.3)',
                      },
                      '& .MuiSwitch-track': {
                        bgcolor: '#444444',
                      },
                    }}
                  />
                )}
                label="Enable Quiet Hours"
                sx={{ color: '#d9dee7' }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Quiet Hours Start"
                  type="time"
                  value={localSettings.quietHoursStart || '23:00'}
                  onChange={(e) => handleDefaultSettingChange('quietHoursStart', e.target.value)}
                  variant="outlined"
                  disabled={!localSettings.quietHoursEnabled}
                  sx={{
                    ...fieldStyles,
                    maxWidth: 260,
                    '& input::-webkit-calendar-picker-indicator': {
                      filter: 'invert(0.85)',
                    },
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                />
                <TextField
                  fullWidth
                  label="Quiet Hours End"
                  type="time"
                  value={localSettings.quietHoursEnd || '06:00'}
                  onChange={(e) => handleDefaultSettingChange('quietHoursEnd', e.target.value)}
                  variant="outlined"
                  disabled={!localSettings.quietHoursEnabled}
                  sx={{
                    ...fieldStyles,
                    maxWidth: 260,
                    '& input::-webkit-calendar-picker-indicator': {
                      filter: 'invert(0.85)',
                    },
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                />
              </Stack>

              <Typography sx={{ color: '#95a1b3', fontSize: '0.8rem' }}>
                During quiet hours, automatic polling pauses for service-backed widgets and resumes automatically after the end time.
              </Typography>
            </Stack>
          </Box>

          {!hideApiKeyFields && (
            <Box>
              <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Default Service API Keys</Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Currents API Key (News - Primary)"
                  type="password"
                  value={localSettings.currentsApiKey || ''}
                  onChange={(e) => handleDefaultSettingChange('currentsApiKey', e.target.value)}
                  placeholder="Enter default Currents API key"
                  variant="outlined"
                  sx={fieldStyles}
                />
                <TextField
                  fullWidth
                  label="TheNewsAPI Key (News - Fallback)"
                  type="password"
                  value={localSettings.newsApiKey || ''}
                  onChange={(e) => handleDefaultSettingChange('newsApiKey', e.target.value)}
                  placeholder="Enter default TheNewsAPI key (optional)"
                  variant="outlined"
                  sx={fieldStyles}
                />
                <TextField
                  fullWidth
                  label="OpenWeather API Key (Weather / Air Quality / Compliments)"
                  type="password"
                  value={localSettings.openweatherApiKey || ''}
                  onChange={(e) => handleDefaultSettingChange('openweatherApiKey', e.target.value)}
                  placeholder="Enter default OpenWeather key"
                  variant="outlined"
                  sx={fieldStyles}
                />
                <TextField
                  fullWidth
                  label="Finnhub API Key (Stocks)"
                  type="password"
                  value={localSettings.finnhubApiKey || ''}
                  onChange={(e) => handleDefaultSettingChange('finnhubApiKey', e.target.value)}
                  placeholder="Enter default Finnhub key"
                  variant="outlined"
                  sx={fieldStyles}
                />
                <TextField
                  fullWidth
                  label="API Ninjas Key (Holidays)"
                  type="password"
                  value={localSettings.apiNinjasApiKey || ''}
                  onChange={(e) => handleDefaultSettingChange('apiNinjasApiKey', e.target.value)}
                  placeholder="Enter your API Ninjas key"
                  variant="outlined"
                  sx={fieldStyles}
                />
                <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                  <strong>News:</strong> Uses Currents API (primary) with Reddit API fallback. Up to 30 rotating headlines.
                  <br />
                  <strong>Other services:</strong> Defaults are used when adding new widgets or when widget-specific keys are left empty.
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <Dialog
        open={isCheckoutOpen}
        onClose={closeCheckout}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#161616',
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundImage: 'linear-gradient(180deg, rgba(244,180,0,0.12), rgba(255,255,255,0.02))',
          },
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontWeight: 700 }}>
          Premium Checkout (Demo)
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography sx={{ color: '#d9dee7', fontSize: '0.92rem' }}>
              This is a fake checkout page for testing upgrade UX. No Stripe call or real charge is made.
            </Typography>
            <Box
              sx={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                p: 1.5,
                bgcolor: 'rgba(0,0,0,0.2)',
              }}
            >
              <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>Premium Plan</Typography>
              <Typography sx={{ color: '#b8c2d1', fontSize: '0.85rem' }}>
                Unlocks backend-managed premium services (weather, news, stocks, crypto, holidays, sports).
              </Typography>
              <Typography sx={{ color: '#fdd663', mt: 1, fontSize: '0.95rem', fontWeight: 700 }}>
                $9.99/month (demo)
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Billing Email"
              value={auth.user?.email || ''}
              disabled
              variant="outlined"
              sx={fieldStyles}
            />
            <TextField
              fullWidth
              label="Cardholder Name"
              value={checkoutCardholder}
              onChange={(e) => setCheckoutCardholder(e.target.value)}
              placeholder="Name on card"
              variant="outlined"
              sx={fieldStyles}
            />
            <TextField
              fullWidth
              label="Card Number"
              value="4242 4242 4242 4242"
              disabled
              variant="outlined"
              sx={fieldStyles}
              helperText="Demo card shown for UI only"
            />
            {checkoutMessage && (
              <Typography sx={{ color: '#90caf9', fontSize: '0.85rem' }}>{checkoutMessage}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={closeCheckout}
            disabled={checkoutBusy}
            variant="outlined"
            sx={{
              color: '#ffffff',
              borderColor: '#4b5563',
              '&:hover': { borderColor: '#6b7280', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteCheckout}
            disabled={checkoutBusy}
            variant="contained"
            sx={{
              bgcolor: '#f4b400',
              color: '#111111',
              fontWeight: 700,
              '&:hover': { bgcolor: '#d9a007' },
            }}
          >
            {checkoutBusy ? 'Processing...' : 'Complete Checkout'}
          </Button>
        </DialogActions>
      </Dialog>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#ffffff',
            borderColor: '#444444',
            '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: '#2196f3',
            color: '#ffffff',
            '&:hover': { bgcolor: '#1976d2' },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};