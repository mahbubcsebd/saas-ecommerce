import EmailSettingsClient from "./client";

export const metadata = {
  title: "Email Settings | Dashboard",
  description: "Configure SMTP and email notifications",
};

export default function EmailSettingsPage() {
  return <EmailSettingsClient />;
}
