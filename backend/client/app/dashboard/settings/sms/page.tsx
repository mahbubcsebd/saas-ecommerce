import SmsSettingsClient from "./client";

export const metadata = {
  title: "SMS Settings | Dashboard",
  description: "Configure SMS gateways and notifications",
};

export default function SmsSettingsPage() {
  return <SmsSettingsClient />;
}
