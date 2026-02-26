import LanguageSettingsClient from "./client";

export const metadata = {
  title: "Language Settings | Dashboard",
  description: "Configure system languages and localization matrix",
};

export default function LanguageSettingsPage() {
  return <LanguageSettingsClient />;
}
