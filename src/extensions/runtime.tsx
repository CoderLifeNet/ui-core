"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type {
  ExtensionDispatchContext,
  UIEvent,
  UIExtensionsConfig,
  UIExtensionsContextValue,
  UIExtensionsProviderProps,
  UIExtension
} from "./types.js";

const DEFAULT_CONFIG: UIExtensionsConfig = {
  enabled: false,
  debug: false
};

const UIExtensionsContext = createContext<UIExtensionsContextValue | null>(null);

interface RegisteredExtension {
  source: "prop" | "runtime";
  registrationId: number;
  extension: UIExtension;
}

function safeInvoke(extension: UIExtension, event: UIEvent, context: ExtensionDispatchContext): void {
  try {
    const outcome = extension.onEvent?.(event, context);
    if (outcome && typeof (outcome as Promise<void>).catch === "function") {
      (outcome as Promise<void>).catch(() => undefined);
    }
  } catch {
    // Extension failures must not break host interactions.
  }
}

export function UIExtensionsProvider({
  children,
  extensions = [],
  initialConfig
}: UIExtensionsProviderProps) {
  const extensionMapRef = useRef<Map<string, RegisteredExtension>>(new Map());
  const registrationCounterRef = useRef(0);
  const previousPropExtensionIdsRef = useRef<Set<string>>(new Set());
  const configRef = useRef<UIExtensionsConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  const safelyDispose = (extension: UIExtension): void => {
    try {
      const result = extension.dispose?.();
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => undefined);
      }
    } catch {
      // Disposal failures must not break host cleanup.
    }
  };

  const upsert = (entry: RegisteredExtension): void => {
    const existing = extensionMapRef.current.get(entry.extension.id);
    if (
      existing &&
      (existing.registrationId !== entry.registrationId ||
        existing.source !== entry.source ||
        existing.extension !== entry.extension)
    ) {
      safelyDispose(existing.extension);
    }
    extensionMapRef.current.set(entry.extension.id, entry);
  };

  useEffect(() => {
    const nextIds = new Set<string>();

    for (const extension of extensions) {
      nextIds.add(extension.id);
      upsert({
        extension,
        registrationId: -1,
        source: "prop"
      });
    }

    for (const previousId of previousPropExtensionIdsRef.current) {
      if (nextIds.has(previousId)) {
        continue;
      }
      const existing = extensionMapRef.current.get(previousId);
      if (existing?.source === "prop") {
        safelyDispose(existing.extension);
        extensionMapRef.current.delete(previousId);
      }
    }

    previousPropExtensionIdsRef.current = nextIds;
  }, [extensions]);

  useEffect(
    () => () => {
      for (const registered of extensionMapRef.current.values()) {
        safelyDispose(registered.extension);
      }
      extensionMapRef.current.clear();
    },
    []
  );

  const api = useMemo<UIExtensionsContextValue>(
    () => ({
      emit: (inputEvent, context = {}) => {
        const currentConfig = configRef.current;
        if (!currentConfig.enabled) {
          return;
        }

        if (context.optedOut) {
          return;
        }

        const event: UIEvent = {
          ...inputEvent,
          schemaVersion: "1.0.0",
          timestamp: Date.now()
        };

        const dispatchContext: ExtensionDispatchContext = {
          trackingPath: context.trackingPath ?? [],
          optedOut: context.optedOut ?? false
        };

        for (const registered of extensionMapRef.current.values()) {
          safeInvoke(registered.extension, event, dispatchContext);
        }
      },
      register: (extension) => {
        const registrationId = ++registrationCounterRef.current;
        upsert({
          extension,
          registrationId,
          source: "runtime"
        });

        return () => {
          const current = extensionMapRef.current.get(extension.id);
          if (!current || current.registrationId !== registrationId || current.source !== "runtime") {
            return;
          }
          safelyDispose(current.extension);
          extensionMapRef.current.delete(extension.id);
        };
      },
      updateConfig: (next) => {
        configRef.current = {
          ...configRef.current,
          ...next
        };
      },
      getConfig: () => configRef.current
    }),
    []
  );

  return <UIExtensionsContext.Provider value={api}>{children}</UIExtensionsContext.Provider>;
}

export function useUIExtensions(): UIExtensionsContextValue {
  const ctx = useContext(UIExtensionsContext);
  if (!ctx) {
    throw new Error("useUIExtensions must be used inside UIExtensionsProvider");
  }
  return ctx;
}

export function useOptionalUIExtensions(): UIExtensionsContextValue | null {
  return useContext(UIExtensionsContext);
}
