# Analytics Integration

## Vite Environment Mapping

```ts
const analyticsConfig = {
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === "true",
  consent: {
    analyticsStorage: import.meta.env.VITE_ANALYTICS_CONSENT === "granted" ? "granted" : "denied",
    adStorage: import.meta.env.VITE_AD_CONSENT === "granted" ? "granted" : "denied"
  }
};
```

## Next.js Environment Mapping

```ts
const analyticsConfig = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  consent: {
    analyticsStorage: process.env.NEXT_PUBLIC_ANALYTICS_CONSENT === "granted" ? "granted" : "denied",
    adStorage: process.env.NEXT_PUBLIC_AD_CONSENT === "granted" ? "granted" : "denied"
  }
};
```

## Privacy Defaults

- No analytics delivery without explicit enablement and granted consent.
- No raw event object forwarding.
- No automatic DOM text or input capture.
