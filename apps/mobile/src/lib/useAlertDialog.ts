import { useCallback, useRef, useState } from "react";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  variant: "default" | "error";
}

/**
 * Pairs with <AlertDialog />. Call showAlert(title, message) wherever
 * Alert.alert(title, message) used to be called, then spread
 * alertDialogProps onto <AlertDialog {...alertDialogProps} /> near the
 * screen's other modals. Keeps every screen's themed-alert boilerplate
 * identical.
 *
 * Unlike the native Alert.alert (an OS-level dialog that survives even
 * if the screen navigates away underneath it), this is a React Modal
 * tied to the component tree — navigating away unmounts it instantly.
 * If a call site used to do `Alert.alert(...); router.replace(...)`
 * right after each other, pass the navigation as onDismiss so it fires
 * only once the user actually closes the dialog, not before they've
 * seen it.
 */
export function useAlertDialog() {
  const [state, setState] = useState<AlertState>({
    visible: false, title: "", message: "", variant: "default",
  });
  const onDismissRef = useRef<(() => void) | null>(null);

  const showAlert = useCallback((
    title: string,
    message: string,
    options?: { variant?: "default" | "error"; onDismiss?: () => void }
  ) => {
    onDismissRef.current = options?.onDismiss ?? null;
    setState({ visible: true, title, message, variant: options?.variant ?? "default" });
  }, []);

  const hideAlert = useCallback(() => {
    setState((current) => ({ ...current, visible: false }));
    const onDismiss = onDismissRef.current;
    onDismissRef.current = null;
    if (onDismiss) onDismiss();
  }, []);

  return {
    showAlert,
    alertDialogProps: { ...state, onClose: hideAlert },
  };
}
