export function FormMessage({ state }: { state: { ok: boolean; message: string } | null | undefined }) {
  if (!state?.message) return <div role="status" aria-live="polite" />;
  return (
    <div role={state.ok ? "status" : "alert"} aria-live="polite" className={`alert ${state.ok ? "alert-success" : "alert-error"}`}>
      {state.message}
    </div>
  );
}
