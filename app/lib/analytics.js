/**
 * Safe, console-log-free analytics event tracking for Andor Travels.
 * Prepared for easy integration with Vercel Analytics, Plausible, or PostHog.
 */
export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return;

  try {
    // Initialize tracking array on window if not present
    if (!window.andor_events) {
      window.andor_events = [];
    }

    const eventPayload = {
      event: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      }
    };

    // Store event locally in the window structure
    window.andor_events.push(eventPayload);

    // Dispatch a custom event so testing scripts or other components can monitor telemetries
    const telemetryEvent = new CustomEvent('andor-telemetry', { detail: eventPayload });
    window.dispatchEvent(telemetryEvent);

    // Future integrations can be mapped here:
    // if (window.va) window.va('event', { name: eventName, data: properties });
    // if (window.plausible) window.plausible(eventName, { props: properties });
    // if (window.posthog) window.posthog.capture(eventName, properties);

  } catch (err) {
    // Fail silently in production
  }
}
