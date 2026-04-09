import { redirect } from "next/navigation";

/** Legacy route: rolls are added per brand → material → Add color on Stock home. */
export default function FilamentsRedirectPage() {
  redirect("/my-inventory");
}
