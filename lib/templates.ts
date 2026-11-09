import type { PanelConfig } from "./store";

export type Template = { id: string; name: string; emoji: string; blurb: string; config: PanelConfig };

const q = (label: string, style: "short" | "paragraph" = "short", placeholder = "") => ({ label, style, required: true, placeholder });

export const TEMPLATES: Template[] = [
  { id: "support", name: "Support", emoji: "🎫", blurb: "One button, instant ticket.", config: {
    type: "normal", title: "🎫 Support", description: "Need help? Press the button below and our team will be with you shortly.", color: "8B5CF6",
    footer: "We usually reply within a few minutes", options: [{ label: "Open Ticket", emoji: "🎫", type: "normal" }] } },
  { id: "report", name: "Report a player", emoji: "🚨", blurb: "Form with evidence fields.", config: {
    type: "form", title: "🚨 Report a player", description: "Break a rule? Fill in the short form and staff will review it privately.", color: "EF4444",
    options: [{ label: "Report a Player", emoji: "🚨", type: "form" }],
    questions: [q("Who are you reporting?", "short", "Username or ID"), q("What happened?", "paragraph", "Describe the incident"), q("Evidence", "paragraph", "Links to screenshots or clips")] } },
  { id: "partnership", name: "Partnership", emoji: "🤝", blurb: "Collect server details first.", config: {
    type: "form", title: "🤝 Partnership requests", description: "Want to partner with us? Tell us about your server.", color: "10B981",
    options: [{ label: "Request Partnership", emoji: "🤝", type: "form" }],
    questions: [q("Server name"), q("Member count"), q("Permanent invite link"), q("Why partner with us?", "paragraph")] } },
  { id: "staff", name: "Staff application", emoji: "📝", blurb: "Opens your staff application.", config: {
    type: "normal", title: "📝 Join the team", description: "We're looking for new staff. Press the button to start your application.", color: "F59E0B",
    options: [{ label: "Apply Now", emoji: "📝", type: "staffapp" }] } },
  { id: "multi", name: "Multiple categories", emoji: "🗂️", blurb: "Members pick a category.", config: {
    type: "multiple", title: "🗂️ How can we help?", description: "Pick the category that fits your request.", color: "6366F1",
    options: [{ label: "General Support", emoji: "💬", type: "normal", description: "Questions and help" },
              { label: "Report", emoji: "🚨", type: "normal", description: "Report a member" },
              { label: "Staff Application", emoji: "📝", type: "staffapp", description: "Apply to join staff" }] } },
  { id: "blank", name: "Blank", emoji: "✨", blurb: "Start from scratch.", config: {
    type: "normal", title: "", description: "", color: "9B5CFF", options: [{ label: "Open Ticket", emoji: "🎫", type: "normal" }] } },
];

export const template = (id: string | undefined) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
