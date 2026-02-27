import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PersonalInfoForm from "@/components/profile/PersonalInfoForm";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/profile");
  }

  const user = session.user as any;

  const initialData = {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    address: user.address || "",
    bio: user.bio || "",
    dob: user.dob ? new Date(user.dob) : undefined,
    avatar: user.image || user.avatar || null,
    username: user.username || "",
  };

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <ProfileHeader user={session.user} />
      <PersonalInfoForm initialData={initialData} />
    </div>
  );
}
