"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/context/SettingsContext";
import { useTranslations } from "@/context/TranslationContext";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const { settings } = useSettings();
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);

  // Simple form handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Message sent successfully!");
    setLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="container py-12 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t('contact', 'title', { defaultValue: 'Contact Us' })}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('contact', 'subtitle', { defaultValue: 'We are here to help. Reach out to us for any queries.' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Info Side */}
        <div className="space-y-8">
          <div className="bg-muted/30 p-8 rounded-2xl space-y-6">
            <h2 className="text-2xl font-semibold mb-6">{t('contact', 'infoTitle', { defaultValue: 'Get in Touch' })}</h2>

            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-medium">{t('contact', 'address', { defaultValue: 'Address' })}</h3>
                <p className="text-muted-foreground">
                  {settings?.contact?.addressLine1 || "123 Main Street"}<br />
                  {settings?.contact?.city || "City"}, {settings?.contact?.country || "Country"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-medium">{t('contact', 'phone', { defaultValue: 'Phone' })}</h3>
                <p className="text-muted-foreground space-y-1">
                   {settings?.contact?.phone && <span className="block">{settings.contact.phone}</span>}
                   {settings?.contact?.whatsapp && <span className="block">WhatsApp: {settings.contact.whatsapp}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-medium">{t('contact', 'email', { defaultValue: 'Email' })}</h3>
                <p className="text-muted-foreground">
                  {settings?.contact?.email || "support@example.com"}
                </p>
              </div>
            </div>

            {settings?.contact?.workingHours && (
              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">{t('contact', 'workingHours', { defaultValue: 'Working Hours' })}</h3>
                  <p className="text-muted-foreground">
                    {settings.contact.workingHours}
                  </p>
                </div>
              </div>
            )}
          </div>

          {settings?.contact?.mapUrl ? (
             <div className="aspect-video w-full rounded-2xl overflow-hidden border bg-muted">
                <iframe
                    src={settings.contact.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
             </div>
          ) : null}

        </div>

        {/* Contact Form Side */}
        <div className="bg-card border p-8 rounded-2xl shadow-sm">
           <h2 className="text-2xl font-semibold mb-6">{t('contact', 'formTitle', { defaultValue: 'Send us a Message' })}</h2>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input required placeholder="Your Name" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input required type="email" placeholder="john@example.com" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Subject</label>
                 <Input required placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Message</label>
                 <Textarea required placeholder="Write your message here..." className="min-h-[150px]" />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                 {loading ? "Sending..." : "Send Message"}
              </Button>
           </form>
        </div>
      </div>
    </div>
  );
}
