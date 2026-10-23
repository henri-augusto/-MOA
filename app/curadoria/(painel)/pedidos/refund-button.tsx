"use client";

import { useActionState } from "react";
import { FormAlert, secondaryButtonClass } from "@/components/studio/form";
import { refundOrder, type RefundState } from "./actions";

const initial: RefundState = {};

export function RefundButton({ orderId }: { orderId: number }) {
  const [state, action, pending] = useActionState(refundOrder, initial);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className={secondaryButtonClass}
        onClick={(event) => {
          if (!window.confirm("Reembolsar este pedido? O valor volta do arranjador e a comissão também.")) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "Reembolsando…" : "Reembolsar"}
      </button>
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.success ? <FormAlert tone="success">{state.success}</FormAlert> : null}
    </form>
  );
}
