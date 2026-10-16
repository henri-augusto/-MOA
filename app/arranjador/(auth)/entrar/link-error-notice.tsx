"use client";

import { useSearchParams } from "next/navigation";
import { FormAlert } from "@/components/studio/form";

export function LinkErrorNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("erro") !== "link") return null;

  return (
    <div className="mt-8">
      <FormAlert>
        O link de confirmação expirou ou já foi usado. Entre com e-mail e senha ou crie a conta de novo.
      </FormAlert>
    </div>
  );
}
