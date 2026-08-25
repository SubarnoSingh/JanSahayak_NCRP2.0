import type { IncidentCategory } from "../models/Incident";

/**
 * Provisional legal mapping (Bharatiya Nyaya Sanhita 2023 + IT Act 2000).
 * Displayed as "provisional — for officer reference", never as a legal conclusion.
 */
export function mapBnsSections(
  category: IncidentCategory,
  signals: { financial?: boolean; sexualContent?: boolean; minorInvolved?: boolean }
): { section: string; title: string; rationale: string }[] {
  const out: { section: string; title: string; rationale: string }[] = [];
  switch (category) {
    case "financial_fraud":
      out.push({ section: "BNS 318(4)", title: "Cheating", rationale: "Deception causing wrongful loss of property/money" });
      if (signals.financial)
        out.push({ section: "IT Act 66C", title: "Identity theft", rationale: "Fraudulent use of digital signature, password or unique identification feature" });
      out.push({ section: "IT Act 66D", title: "Cheating by personation using computer resource", rationale: "Online impersonation-based cheating" });
      break;
    case "harassment_extortion":
      out.push({ section: "BNS 308(2)", title: "Extortion", rationale: "Intentional intimidation to deliver property" });
      out.push({ section: "BNS 78", title: "Stalking", rationale: "Repeated unwanted contact/monitoring" });
      if (signals.sexualContent)
        out.push({ section: "IT Act 66E / BNS 77", title: "Privacy violation / assault on modesty", rationale: "Capture or publication of private images" });
      break;
    case "women_child_safety":
      out.push({ section: "BNS 79", title: "Insult to modesty of a woman", rationale: "Word/gesture/act intended to insult modesty" });
      if (signals.minorInvolved) {
        out.push({ section: "POCSO Act (relevant sections)", title: "Protection of Children from Sexual Offences", rationale: "Minor victim protocol — case routed to specialized unit" });
        out.push({ section: "IT Act 67B", title: "Child sexual abuse material", rationale: "Strictly prohibited content involving minors" });
      }
      if (signals.sexualContent)
        out.push({ section: "IT Act 67", title: "Obscene material in electronic form", rationale: "Publication/transmission of obscene content" });
      break;
    case "other_cyber_crime":
      out.push({ section: "IT Act 43 / 66", title: "Unauthorised access & damage to computer systems", rationale: "Hacking/unauthorised use of computer resource" });
      out.push({ section: "BNS 303(2)", title: "Theft", rationale: "Dishonest taking of movable property incl. data-dependent assets" });
      break;
  }
  return out;
}
