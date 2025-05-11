// Simple hook to resize & reposition Vaul Drawer.Content when the on-screen keyboard appears (mobile Safari/Chrome).
// Usage: const contentRef = useRef<HTMLDivElement>(null); useKeyboardAwareDrawer(contentRef);

import { useEffect } from 'react';

export function useKeyboardAwareDrawer(
  ref: React.RefObject<HTMLElement>,
  options: { offset?: number } = {}
) {
  const { offset = 16 } = options;

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof window === 'undefined' || !('visualViewport' in window)) return;

    const vv = window.visualViewport;

    function handle() {
      const viewportHeight = vv?.height ?? window.innerHeight;
      const diff = window.innerHeight - viewportHeight; // keyboard height

      // set height minus offset so content sits above keyboard
      node.style.height = `${viewportHeight - offset}px`;
      node.style.bottom = `${Math.max(diff, 0)}px`;
    }

    handle();
    vv?.addEventListener('resize', handle);
    return () => vv?.removeEventListener('resize', handle);
  }, [ref, offset]);
}
