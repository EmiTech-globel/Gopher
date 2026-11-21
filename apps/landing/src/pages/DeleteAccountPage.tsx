import { LegalPage } from "../components/LegalPage";
import { DELETION_DAYS } from "../legal";
import { SUPPORT_EMAIL } from "../site";

export function DeleteAccountPage() {
  const timing = DELETION_DAYS ? `within ${DELETION_DAYS} days` : "as soon as we can";
  return (
    <LegalPage
      title="Delete your account"
      intro="You can ask us to delete your Gopher account and the personal information tied to it."
      sections={[
        {
          heading: "How to request deletion",
          body: (
            <>
              {SUPPORT_EMAIL ? <>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></> : <><a href="/contact">Contact us</a></>} from the address you signed up with, using the subject Delete my account. We will confirm your request and complete it {timing}.
            </>
          ),
        },
        { heading: "What we delete", body: "Your profile, contact details, saved bank details and push notification settings." },
        { heading: "What we keep, and why", body: "Errand and payment records are kept for dispute handling and financial records. Scout selfies and ID photos are kept in restricted storage if an account was banned, so it cannot register again under a new identity." },
        { heading: "Before you request", body: "Finish or cancel any active errand and resolve any open dispute. Money owed to you is settled according to the payout schedule." },
      ]}
    />
  );
}
