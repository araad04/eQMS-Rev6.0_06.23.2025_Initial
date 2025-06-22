/**
 * Navigation utility to ensure consistent navigation throughout the app
 * This centralizes navigation logic and prevents 404 errors
 */

/**
 * Navigate to a specific route with consistent behavior
 * @param path The path to navigate to
 * @param forceReload Whether to force a full page reload (default: false for SPA behavior)
 */
export function navigateTo(path: string, forceReload: boolean = false): void {
  console.log(`Navigating to: ${path} (forceReload: ${forceReload})`);
  
  // For SPA navigation, use history API to avoid page reloads
  if (!forceReload) {
    // Use history.pushState for SPA navigation
    window.history.pushState({}, '', path);
    
    // Trigger a popstate event to let wouter handle the route change
    const popStateEvent = new PopStateEvent('popstate', { state: {} });
    window.dispatchEvent(popStateEvent);
    return;
  }
  
  // Only use full page reload when explicitly requested
  window.location.href = path;
}

/**
 * Check if the current location matches a specific path or pattern
 * @param path The path to check against
 * @returns Whether the current path matches
 */
export function isCurrentPath(path: string): boolean {
  if (path === '/') {
    return window.location.pathname === '/';
  }
  
  return window.location.pathname.startsWith(path);
}