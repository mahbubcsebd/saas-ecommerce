"use client";

import LandingPageForm from "@/components/LandingPageForm";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { use, useEffect, useState } from "react";

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing-pages/admin/${id}`, {
             headers: { Authorization: `Bearer ${session?.accessToken}` }
        });
        const json = await res.json();
        if (json.success) {
            setData(json.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (session?.accessToken) fetchData();
  }, [id, session]);

  return (
     <div className="p-6">
       {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div> : <LandingPageForm initialData={data} />}
     </div>
  );
}
