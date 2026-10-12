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
  const propExtensionMapRef = useRef<Map<string, UIExtension>>(new Map());
  const previousPropExtensionMapRef = useRef<Map<string, UIExtension>>(new Map());
  const runtimeExtensionMapRef = useRef<Map<string, RegisteredExtension>>(new Map());
  const registrationCounterRef = useRef(0);
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
    const existing = runtimeExtensionMapRef.current.get(entry.extension.id);
    if (
      existing &&
      (existing.registrationId !== entry.registrationId ||
        existing.source !== entry.source ||
        existing.extension !== entry.extension)
    ) {
      safelyDispose(existing.extension);
    }
    runtimeExtensionMapRef.current.set(entry.extension.id, entry);
  };

  const nextPropExtensionMap = new Map<string, UIExtension>();
  for (const extension of extensions) {
    nextPropExtensionMap.set(extension.id, extension);
  }
  propExtensionMapRef.current = nextPropExtensionMap;

  useEffect(() => {
    const previousPropMap = previousPropExtensionMapRef.current;
    const nextPropMap = propExtensionMapRef.current;

    for (const [previousId, previousExtension] of previousPropMap.entries()) {
      const replacement = nextPropMap.get(previousId);
      if (replacement === previousExtension) {
        continue;
      }
      safelyDispose(previousExtension);
    }

    previousPropExtensionMapRef.current = new Map(nextPropMap);
  }, [extensions]);

  useEffect(
    () => () => {
      for (const extension of propExtensionMapRef.current.values()) {
        safelyDispose(extension);
      }

      for (const registered of runtimeExtensionMapRef.current.values()) {
        safelyDispose(registered.extension);
      }
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

        for (const extension of propExtensionMapRef.current.values()) {
          safeInvoke(extension, event, dispatchContext);
        }

        for (const [id, registered] of runtimeExtensionMapRef.current.entries()) {
          if (propExtensionMapRef.current.has(id)) {
            continue;
          }
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
          const current = runtimeExtensionMapRef.current.get(extension.id);
          if (!current || current.registrationId !== registrationId || current.source !== "runtime") {
            return;
          }
          safelyDispose(current.extension);
          runtimeExtensionMapRef.current.delete(extension.id);
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
