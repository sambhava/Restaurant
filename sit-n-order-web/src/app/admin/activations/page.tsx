import type { Metadata } from "next";
import { ActivationsClient } from "@/components/ActivationsClient";

export const metadata: Metadata = {
  title: "Activations",
  robots: { index: false, follow: false },
};

export default function ActivationsPage() {
  return (
    <section className="shell py-14">
      <ActivationsClient />
    </section>
  );
}
