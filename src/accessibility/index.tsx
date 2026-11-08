"use client";

import { useEffect, useRef } from "react";
import { dialogClasses } from "@mui/material/Dialog";
import { iconButtonClasses } from "@mui/material/IconButton";
import { textFieldClasses } from "@mui/material/TextField";
import { computeAccessibleName, isInaccessible } from "dom-accessibility-api";

const rules = [
  {
    component: "IconButton",
    selector: `.${iconButtonClasses.root}`,
    message: "Provide an accessible name, for example with aria-label."
  },
  {
    component: "TextField",
    selector: ["input:not([type=hidden])", "textarea", "select", "[role=combobox]"]
      .map((control) => `.${textFieldClasses.root} ${control}`).join(", "),
    message: "Label the field using label, an associated label element, or ARIA on the input slot."
  },
  {
    component: "Dialog",
    selector: `.${dialogClasses.paper}:is([role=dialog], [role=alertdialog])`,
    message: "Name the dialog with a DialogTitle, a valid aria-labelledby reference, or aria-label."
  }
] as const;

export interface AccessibilityIssue {
  component: (typeof rules)[number]["component"];
  code: "missing_accessible_name" | "missing_description_reference";
  message: string;
  element: Element;
}

/** Check visible MUI controls within a rendered DOM subtree. Use the document to include portals. */
export function scanAccessibility(root: Document | Element): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  for (const { component, selector, message } of rules) {
    const candidates = [...root.querySelectorAll(selector)];
    if ("matches" in root && root.matches(selector)) candidates.unshift(root);

    for (const element of candidates) {
      if (element.closest("[inert], [data-ui-core-a11y-ignore]") || isInaccessible(element)) continue;

      if (!computeAccessibleName(element)) {
        issues.push({ component, code: "missing_accessible_name", message, element });
      }

      if (component === "TextField") {
        const ids = element.getAttribute("aria-describedby")?.match(/[^\t\n\f\r ]+/g) ?? [];
        if (!ids.length) continue;

        const tree = element.getRootNode() as Document | DocumentFragment | Element;
        const missingIds = ids.filter((id) => {
          if ("getElementById" in tree) return tree.getElementById(id) === null;
          return tree.id !== id && ![...tree.querySelectorAll("[id]")].some((target) => target.id === id);
        });
        if (missingIds.length) {
          issues.push({
            component,
            code: "missing_description_reference",
            message: `aria-describedby references missing elements: ${missingIds.join(", ")}.`,
            element
          });
        }
      }
    }
  }

  return issues;
}

export interface AccessibilityDiagnosticsProps {
  enabled?: boolean;
  root?: Document | Element;
  onIssue?: (issue: AccessibilityIssue) => void;
}

function warn(issue: AccessibilityIssue): void {
  console.warn(`[ui-core] ${issue.component}: ${issue.message}`, issue.element);
}

export function AccessibilityDiagnostics({
  enabled = false,
  root,
  onIssue = warn
}: AccessibilityDiagnosticsProps): null {
  const onIssueRef = useRef(onIssue);
  useEffect(() => {
    onIssueRef.current = onIssue;
  }, [onIssue]);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const scope = root ?? document;
    let reported = new WeakMap<Element, Set<AccessibilityIssue["code"]>>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scan = (): void => {
      timer = undefined;
      const current = new WeakMap<Element, Set<AccessibilityIssue["code"]>>();
      for (const issue of scanAccessibility(scope)) {
        const { element, code } = issue;
        const codes = current.get(element) ?? new Set<AccessibilityIssue["code"]>();
        codes.add(code);
        current.set(element, codes);
        if (reported.get(element)?.has(code)) continue;
        try {
          onIssueRef.current(issue);
        } catch {
          // Diagnostic callbacks must not interrupt the application.
        }
      }
      reported = current;
    };
    const schedule = (): void => {
      if (timer === undefined) timer = setTimeout(scan, 0);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(scope, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-describedby", "aria-label", "aria-labelledby", "aria-hidden", "class", "data-ui-core-a11y-ignore",
        "for", "hidden", "id", "inert", "role", "style", "title", "type"]
    });
    schedule();
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [enabled, root]);

  return null;
}
