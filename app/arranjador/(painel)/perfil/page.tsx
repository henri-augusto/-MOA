import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import type { Profile } from "@/lib/arranger/catalog";
import { requireArranger } from "@/lib/arranger/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Perfil — Estúdio do arranjador — MOA",
};

async function ProfileContent() {
  const { supabase, userId } = await requireArranger();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, artist_name, city, bio, formations")
    .eq("id", userId)
    .maybeSingle<Profile>();

  const profile: Profile = data ?? {
    id: userId,
    full_name: "",
    artist_name: null,
    city: null,
    bio: null,
    formations: [],
  };

  return <ProfileForm profile={profile} />;
}

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Perfil público"
        title="Quem assina os arranjos."
        description="Estes dados aparecem na sua vitrine e ao lado de cada obra no acervo. O e-mail e a senha ficam fora da vista do público."
      />
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <ProfileContent />
        </Suspense>
      </div>
    </>
  );
}
