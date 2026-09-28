export const ENTITLEMENT_ENDPOINT =
  'https://dnq7um1pgb.execute-api.us-east-1.amazonaws.com/prod/v1/entitlements/me';

export const SUBSCRIPTION_ACTIVATION_ENDPOINT =
  'https://dnq7um1pgb.execute-api.us-east-1.amazonaws.com/prod/v1/subscriptions/activate-demo';

const ENTITLEMENT_PATH = '/v1/entitlements/me';

export const getServiceEndpoint = (servicePath) => {
  if (typeof servicePath !== 'string' || !servicePath.startsWith('/v1/services/')) {
    return null;
  }

  if (!ENTITLEMENT_ENDPOINT.includes(ENTITLEMENT_PATH)) {
    return null;
  }

  return ENTITLEMENT_ENDPOINT.replace(ENTITLEMENT_PATH, servicePath);
};