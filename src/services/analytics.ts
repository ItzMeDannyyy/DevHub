import { trackEvent as aptabaseTrackEvent, trackError as aptabaseTrackError } from '@aptabase/tauri';

export type EventProps = Record<string, string | number>;

/**
 * Tracks a custom event in Aptabase.
 * Safe to call anywhere; handles errors gracefully in case Tauri IPC is unavailable.
 */
export async function trackEvent(name: string, props?: EventProps): Promise<void> {
  try {
    await aptabaseTrackEvent(name, props);
  } catch (err) {
    // Fail silently in development/browser environments
    console.debug('[Analytics] trackEvent error:', name, err);
  }
}

/**
 * Reports an error to Aptabase (appears on the Errors page of your Aptabase dashboard).
 */
export async function trackError(error: unknown, options?: { fatal?: boolean }): Promise<void> {
  try {
    await aptabaseTrackError(error, options);
  } catch (err) {
    console.debug('[Analytics] trackError failed:', err);
  }
}
