import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read our Privacy Policy",
};

async function getPrivacyPolicy() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  const apiUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

  try {
    const res = await fetch(`${apiUrl}/settings/public`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.data?.legal?.privacyPolicy || null;
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    return null;
  }
}

export default async function PrivacyPage() {
  const privacyContent = await getPrivacyPolicy();

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 tracking-tight text-center">
        Privacy Policy
      </h1>

      <div className="bg-card rounded-2xl p-6 md:p-10 border shadow-sm">
        {privacyContent ? (
          <div
            className="prose prose-zinc dark:prose-invert max-w-none prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: privacyContent }}
          />
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p>Our Privacy Policy is currently being updated.</p>
            <p className="mt-2">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
