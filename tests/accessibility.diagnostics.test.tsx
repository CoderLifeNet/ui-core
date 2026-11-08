import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessibilityDiagnostics, scanAccessibility } from "../src/accessibility/index.js";
import { Dialog, DialogTitle, IconButton, TextField } from "../src/index.js";

afterEach(cleanup);

describe("accessibility diagnostics", () => {
  it("is opt-in and checks rendered labels, including dialogs in portals", async () => {
    const onIssue = vi.fn();
    const app = (enabled: boolean) => (
      <>
        <AccessibilityDiagnostics enabled={enabled} onIssue={onIssue} />
        <IconButton><span aria-hidden="true">×</span></IconButton>
        <TextField />
        <Dialog open disablePortal={false} aria-labelledby="missing-title">Body</Dialog>
      </>
    );
    const { rerender } = render(app(false));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onIssue).not.toHaveBeenCalled();
    rerender(app(true));
    // The modal hides its siblings from the accessibility tree.
    await waitFor(() => expect(onIssue).toHaveBeenCalledWith(expect.objectContaining({ component: "Dialog" })));
    expect(onIssue).toHaveBeenCalledTimes(1);
    rerender(
      <>
        <AccessibilityDiagnostics enabled onIssue={onIssue} />
        <IconButton><span aria-hidden="true">×</span></IconButton>
        <TextField />
      </>
    );
    await waitFor(() => expect(onIssue.mock.calls.map(([issue]) => issue.component)).toEqual(["Dialog", "IconButton", "TextField"]));
  });

  it("accepts MUI labels and slot props and reports a new issue only once", async () => {
    const onIssue = vi.fn();
    const app = (label: string | undefined, updated = false) => (
      <>
        <AccessibilityDiagnostics enabled onIssue={onIssue} />
        <IconButton aria-label={label}><span aria-hidden="true">×</span></IconButton>
        <TextField slotProps={{ htmlInput: { "aria-label": "Email" } }} />
        <IconButton data-ui-core-a11y-ignore />
        {updated && <p>Unrelated update</p>}
      </>
    );
    const { rerender } = render(
      <>
        <AccessibilityDiagnostics enabled onIssue={onIssue} />
        <Dialog open><DialogTitle>Confirm order</DialogTitle></Dialog>
      </>
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onIssue).not.toHaveBeenCalled();
    rerender(app("Close"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onIssue).not.toHaveBeenCalled();
    rerender(app(undefined));
    await waitFor(() => expect(onIssue).toHaveBeenCalledTimes(1));
    rerender(app(undefined, true));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onIssue).toHaveBeenCalledTimes(1);
  });
});

describe("scanAccessibility", () => {
  it("checks the scope itself and reports broken description references with the offending element", () => {
    const { container } = render(
      <>
        <IconButton><span aria-hidden="true">×</span></IconButton>
        <TextField id="email" label="Email" helperText="Work email only" />
        <TextField id="phone" label="Phone" slotProps={{ htmlInput: { "aria-describedby": "existing missing" } }} />
        <span id="existing">Optional</span>
        <TextField data-ui-core-a11y-ignore />
      </>
    );
    const iconButton = container.querySelector("button")!;
    const phone = container.querySelector("#phone")!;
    expect(scanAccessibility(iconButton)).toEqual([
      expect.objectContaining({ element: iconButton, code: "missing_accessible_name" })
    ]);
    expect(scanAccessibility(container)).toEqual([
      expect.objectContaining({ element: iconButton, code: "missing_accessible_name" }),
      expect.objectContaining({ element: phone, code: "missing_description_reference", message: expect.stringContaining("missing") })
    ]);
    phone.setAttribute("aria-describedby", "existing");
    expect(scanAccessibility(container)).toEqual([
      expect.objectContaining({ element: iconButton, code: "missing_accessible_name" })
    ]);
  });
});
