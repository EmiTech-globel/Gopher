import { ContactLine, LegalPage } from "../components/LegalPage";

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what personal information Gopher collects, why, and how it is protected, in line with Nigerian data protection law."
      sections={[
        { heading: "What we collect", body: "Account details (name, email, phone, department). For scouts: matric number, a live selfie, a student ID photo and bank details for payouts. We also keep errand records and in-app chat messages." },
        { heading: "How we use it", body: "To run errands, verify scouts, process payments and payouts, resolve disputes and keep the community safe." },
        { heading: "Who can see it", body: "Other users see only your name, photo and department. Your phone number is shared only if you choose to reveal it in a chat. Verification photos are visible to Gopher admins only." },
        { heading: "Payments", body: "Card and bank payments are handled by Paystack. Gopher does not store your card details." },
        { heading: "Storage and retention", body: "Verification photos sit in restricted storage. After a confirmed ban they are kept so the person cannot register again under a new identity." },
        { heading: "Your rights", body: "You can ask to see, correct or delete your information, except where we must keep it for safety or legal reasons." },
        { heading: "Contact", body: <ContactLine prefix="Privacy questions:" /> },
      ]}
    />
  );
}
