import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AddressList from "@/components/profile/AddressList";
import { api } from "@/lib/api-client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AddressPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/profile/address");
  }

  let addresses = [];
  try {
    const data = await api.get<any[]>("/addresses", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      revalidate: 0 // Fetch always on the server for user data
    });
    addresses = data || [];
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <AddressList initialAddresses={addresses} />
    </div>
  );
}
