/**
 * Centralized In-Memory Access Token Storage
 * Ensures access tokens are not exposed to localStorage
 */

type TokenListener = (token: string | null) => void;

let inMemoryAccessToken: string | null = null;
let listeners: TokenListener[] = [];

export const authStorage = {
  /**
   * Get the current in-memory access token.
   * Returns null if unauthenticated or page was hard reloaded.
   */
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  /**
   * Set the current in-memory access token.
   * Notifies any active subscribers (e.g., AuthContext).
   */
  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
    listeners.forEach((listener) => {
      try {
        listener(token);
      } catch (err) {
        console.error("[authStorage] Listener notification error:", err);
      }
    });
  },

  /**
   * Clear the in-memory token on logout or session expiration.
   */
  clear(): void {
    this.setAccessToken(null);
  },

  /**
   * Subscribe to token updates.
   * Returns an unsubscribe function.
   */
  subscribe(listener: TokenListener): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

