/**
 * Auto-seed — populates demo data only when the database is empty.
 * Safe to call on every startup; skips if data already exists.
 */
import mongoose from "mongoose";
import { config } from "../config";
import { Incident, Suspect, Resource, ScamAlert, Officer } from "../models";
import { computeReadiness } from "../services/readinessService";
import { mapBnsSections } from "../services/bnsMapper";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 3600_000);
}

export async function autoSeed(): Promise<void> {
  const [resourceCount, alertCount] = await Promise.all([
    Resource.countDocuments(),
    ScamAlert.countDocuments(),
  ]);
  if (resourceCount > 0 && alertCount > 0) {
    console.log("[seed] database already populated — skipping");
    return;
  }
  console.log("[seed] database incomplete — seeding demo data...");

  await Officer.findOneAndUpdate(
    { email: config.officerDemo.email },
    {
      email: config.officerDemo.email,
      name: "Inspector A. Verma",
      rank: "Inspector",
      unit: "Cyber Police Station — Demo Range",
      passwordHash: "demo-only",
    },
    { upsert: true, new: true }
  );

  const suspects = [
    {
      identifier: "+91-98765-43210",
      normalizedIdentifier: "+91-9876543210",
      type: "phone",
      reportCount: 47,
      categories: ["financial_fraud"],
      status: "flagged",
      recentActivity: [
        { at: daysAgo(1), category: "financial_fraud", note: "Fake customer care callback" },
        { at: daysAgo(4), category: "financial_fraud", note: "KYC expiry scam call" },
        { at: daysAgo(9), category: "financial_fraud", note: "UPI collect request fraud" },
      ],
    },
    {
      identifier: "scammer.refund@okaxis",
      normalizedIdentifier: "scammer.refund@okaxis",
      type: "upi",
      reportCount: 23,
      categories: ["financial_fraud"],
      status: "active",
      recentActivity: [
        { at: daysAgo(2), category: "financial_fraud", note: "Refund-processing scam VPA" },
        { at: daysAgo(6), category: "financial_fraud", note: "Marketplace purchase fraud" },
      ],
    },
    {
      identifier: "http://secure-sbi-kyc.xyz",
      normalizedIdentifier: "http://secure-sbi-kyc.xyz",
      type: "url",
      reportCount: 61,
      categories: ["financial_fraud", "other_cyber_crime"],
      status: "action_taken",
      recentActivity: [
        { at: daysAgo(3), category: "financial_fraud", note: "Phishing page cloned bank portal" },
      ],
    },
    {
      identifier: "+91-81234-56780",
      normalizedIdentifier: "+91-8123456780",
      type: "phone",
      reportCount: 12,
      categories: ["harassment_extortion"],
      status: "monitoring",
      recentActivity: [
        { at: daysAgo(5), category: "harassment_extortion", note: "Video-call sextortion attempt" },
        { at: daysAgo(11), category: "harassment_extortion", note: "Repeated threatening calls" },
      ],
    },
    {
      identifier: "@quickprofit_trades",
      normalizedIdentifier: "@quickprofit_trades",
      type: "social",
      reportCount: 9,
      categories: ["financial_fraud"],
      status: "active",
      recentActivity: [
        { at: daysAgo(7), category: "financial_fraud", note: "Telegram investment group promising 10x returns" },
      ],
    },
  ];
  await Suspect.insertMany(suspects.map((s) => ({ ...s, firstReportedAt: daysAgo(90) })));

  const resources = [
    {
      slug: "digital-arrest-scams",
      title: "Digital Arrest scams",
      titleHi: "डिजिटल अरेस्ट घोटाले",
      category: "trending" as const,
      scamType: "Digital Arrest",
      trending: true,
      readMinutes: 4,
      summary:
        "Scammers pose as police or CBI over video call, claim you are 'digitally arrested', and demand money to 'clear your name'. Police never arrest anyone over a video call.",
      summaryHi:
        "धोखेबाज़ वीडियो कॉल पर पुलिस या CBI बनकर कहते हैं कि आप 'डिजिटल अरेस्ट' में हैं और पैसे मांगते हैं। पुलिस कभी वीडियो कॉल पर गिरफ्तारी नहीं करती।",
      body: [
        "## How the scam works",
        "1. You receive a call claiming to be from a courier company, then 'transferred' to police/CBI/Customs.",
        "2. The caller says a package with your name contains illegal items, or your Aadhaar was misused.",
        "3. They move you to a video call, show fake IDs and uniforms, even fake police stations.",
        "4. They say you are under 'digital arrest' — you must stay on camera and not tell anyone.",
        "5. They pressure you to pay a 'verification amount' or 'security deposit' to be released.",
        "",
        "## What to do if it happens to you",
        "- Hang up. Genuine agencies never arrest or investigate over video calls.",
        "- Do NOT transfer money under any circumstances.",
        "- If money was transferred, call 1930 within the golden hour and report here.",
        "- Save the phone numbers, screenshots of the video call, and any payment details as evidence.",
        "",
        "## Remember",
        "No government agency demands money over calls for 'verification'. Fear is their only weapon — ending the call ends the scam.",
      ].join("\n"),
      tags: ["impersonation", "video call", "police"],
    },
    {
      slug: "boss-scam",
      title: "Boss Scam",
      titleHi: "बॉस स्कैम",
      category: "trending" as const,
      scamType: "CEO Fraud",
      trending: true,
      readMinutes: 3,
      summary:
        "Fraudsters impersonate senior executives or trusted business contacts and send malicious files disguised as account statements, MCA/RBI communications or other official documents.",
      summaryHi:
        "धोखेबाज़ वरिष्ठ अधिकारियों या विश्वसनीय व्यापारिक संपर्कों का रूप धारण करके खाता विवरण, MCA/RBI संचार या अन्य आधिकारिक दस्तावेज़ों के रूप में दूषित फ़ाइलें भेजते हैं।",
      body: [
        "## What is a Boss Scam?",
        "A Boss Scam (also called CEO Fraud or Business Email Compromise) is when a fraudster impersonates a senior executive — such as your CEO, CFO, or a trusted business partner — and sends you files or messages that look official.",
        "",
        "## How the scam works",
        "1. The scammer researches your company or contacts and identifies senior figures.",
        "2. They create a convincing email or message using a similar name, design, or logo.",
        "3. The message includes an attached file — often a PDF, Excel sheet, or Word document.",
        "4. The file is disguised as an account statement, MCA filing, RBI notice, or compliance report.",
        "5. Opening the file installs malware, or the file contains links to credential-harvesting websites.",
        "6. Once your device or accounts are compromised, the attacker moves funds, steals data, or spreads further.",
        "",
        "## Common warning signs",
        "- The email comes from a slightly different address.",
        "- The message has unusual urgency: 'Process this payment immediately — confidential.'",
        "- Attached file names reference MCA, RBI, income tax, or audit reports you were not expecting.",
        "- You are asked to keep the request confidential or bypass normal approval processes.",
        "",
        "## What you should never do",
        "- Never open attachments from unknown or unexpected senders.",
        "- Never enable macros or content in Office documents unless you are certain the file is genuine.",
        "- Never transfer funds based solely on an email instruction.",
        "",
        "## How to verify a request",
        "- Call the supposed sender on their known phone number.",
        "- Check the sender's email address carefully for subtle misspellings or wrong domains.",
        "- Forward the email to your IT or security team before opening any attachments.",
      ].join("\n"),
      tags: ["impersonation", "malware", "CEO fraud", "business email compromise"],
    },
    {
      slug: "phishing-guide",
      title: "Phishing links & fake websites",
      category: "guide" as const,
      scamType: "Phishing",
      readMinutes: 3,
      summary:
        "Messages that mimic banks, government portals or delivery services to steal passwords and card details.",
      body: [
        "## Warning signs",
        "- Urgency: 'Your account will be blocked in 24 hours.'",
        "- Lookalike domains: sbi-kyc.online instead of sbi.co.in",
        "- Requests for OTP, CVV, or UPI PIN — no genuine service asks for these.",
        "",
        "## Protect yourself",
        "- Type official URLs yourself; don't click message links.",
        "- Check for the padlock AND the exact domain spelling.",
        "- Report suspicious links on this portal so others are warned.",
      ].join("\n"),
      tags: ["phishing", "banking"],
    },
    {
      slug: "upi-fraud-guide",
      title: "UPI fraud patterns",
      category: "guide" as const,
      scamType: "UPI Fraud",
      readMinutes: 4,
      summary:
        "Collect requests disguised as refunds, screen-sharing apps used to watch you type PINs, QR codes that debit instead of credit.",
      body: [
        "## Common tricks",
        "- 'Enter amount to RECEIVE money' — receiving never needs your PIN.",
        "- Any UPI app asking for screen sharing during payment.",
        "- QR codes sent by strangers that trigger a DEBIT request.",
        "",
        "## Golden rules",
        "- To receive money, you never enter a PIN.",
        "- Never install remote-access apps for 'customer support'.",
        "- Verify beneficiary names before confirming every transfer.",
      ].join("\n"),
      tags: ["upi", "payments"],
    },
    {
      slug: "fake-customer-support",
      title: "Fake customer support numbers",
      category: "guide" as const,
      scamType: "Impersonation",
      readMinutes: 2,
      summary:
        "Search-engine ads list fake helplines. Callers ask for card details 'to process your refund'.",
      body: [
        "## How it works",
        "- You search for a company's support number; a paid ad shows a scammer's number.",
        "- The 'agent' asks for your card number, CVV, OTP or asks you to install an app.",
        "",
        "## Defense",
        "- Only use numbers printed on the official website or app.",
        "- Refunds never require you to share OTPs or scan QR codes.",
      ].join("\n"),
      tags: ["support", "refund"],
    },
    {
      slug: "job-scam-guide",
      title: "Job & work-from-home scams",
      category: "guide" as const,
      scamType: "Job Scam",
      readMinutes: 3,
      summary:
        "'Earn ₹5000 daily liking videos' — small first payouts build trust, then come registration fees and deposit demands.",
      body: [
        "## The pattern",
        "- Telegram/WhatsApp groups assign simple tasks with instant tiny payouts.",
        "- Then 'prepaid tasks': pay ₹5,000 to unlock a task worth ₹15,000.",
        "- The group disappears once deposits grow.",
        "",
        "## Reality check",
        "- Real employers never ask candidates for money.",
        "- Guaranteed high returns for trivial work is always bait.",
      ].join("\n"),
      tags: ["jobs", "telegram"],
    },
    {
      slug: "investment-scam-guide",
      title: "Investment & trading scams",
      category: "guide" as const,
      scamType: "Investment Scam",
      readMinutes: 3,
      summary:
        "Fake apps showing fabricated profits. Withdrawals freeze once you invest bigger amounts.",
      body: [
        "## Red flags",
        "- WhatsApp groups where 'experts' post guaranteed profits.",
        "- Apps not listed on official app stores.",
        "- Profits visible in-app but withdrawals always 'pending'.",
        "",
        "## Check before investing",
        "- SEBI registration of any platform handling your money.",
        "- Never transfer to personal accounts 'for activation'.",
      ].join("\n"),
      tags: ["investment", "trading"],
    },
    {
      slug: "account-takeover-guide",
      title: "Account takeover & SIM swap",
      category: "guide" as const,
      scamType: "Account Takeover",
      readMinutes: 3,
      summary:
        "Attackers hijack your email or phone number first, then reset everything else using it.",
      body: [
        "## Early warnings",
        "- Phone shows 'No Service' unexpectedly (possible SIM swap).",
        "- Password-reset emails you didn't request.",
        "",
        "## Response",
        "- Contact your mobile operator immediately if signal dies.",
        "- Enable app-based two-factor authentication everywhere.",
        "- Report identity misuse here — IT Act 66C covers identity theft.",
      ].join("\n"),
      tags: ["security", "sim swap"],
    },
  ];
  await Resource.insertMany(resources);

  await ScamAlert.insertMany([
    {
      title: "Digital arrest complaints up 3× this quarter",
      severity: "critical",
      region: "Nationwide",
      summary:
        "Citizens report video-call impersonation of police officers demanding 'clearance payments'. End the call and report immediately.",
      publishedAt: daysAgo(2),
    },
    {
      title: "Fake KYC SMS targeting bank customers",
      severity: "warning",
      region: "North India",
      summary:
        "SMS claiming 'PAN-KYC suspension' leads to credential-harvesting sites. Banks never suspend KYC via SMS links.",
      publishedAt: daysAgo(5),
    },
    {
      title: "Festive-season delivery scam wave",
      severity: "info",
      region: "Metro cities",
      summary:
        "'Delivery failed, reschedule here' texts lead to payment pages for a small 'redelivery fee' that steals full card details.",
      publishedAt: daysAgo(9),
    },
  ]);

  const narrative =
    "I received a call from someone claiming to be from my bank's KYC department. They asked me to verify my account by making a small UPI transaction. After I entered the PIN, ₹35,000 was debited in two transactions within minutes. The caller disconnected afterwards and my calls go unanswered now.";
  const txn = {
    utr: "421598761234",
    amount: 35000,
    timestamp: new Date(Date.now() - 40 * 60_000).toISOString(),
    senderBank: "HDFC Bank",
    beneficiaryVpa: "scammer.refund@okaxis",
    method: "UPI",
    source: "citizen" as const,
    verifiedByCitizen: true,
  };
  const readiness = computeReadiness({
    category: "financial_fraud",
    narrative,
    categoryConfirmedByCitizen: true,
    transactionDetails: { utr: txn.utr, amount: txn.amount, timestamp: txn.timestamp },
    suspectIdentifiers: [{ type: "upi" }],
    evidenceCount: 1,
    hasContact: true,
  });
  const demoIncident = await Incident.create({
    acknowledgementNumber: "NCRP-2026-A1B2C3",
    incident_category: "financial_fraud",
    categoryConfidence: 0.92,
    categorySource: "citizen_confirmed",
    language: "en",
    narrative_raw: narrative,
    narrative_summary:
      "Caller posing as bank KYC staff induced the complainant into a UPI verification step; ₹35,000 was debited in two transactions. Caller became unreachable after the debit.",
    financial_transactions: [txn],
    suspect_identifiers: [
      { type: "upi", value: "scammer.refund@okaxis", context: "beneficiary VPA from transaction receipt" },
      { type: "phone", value: "+91-98765-43210", context: "caller's number" },
    ],
    bns_sections_mapped: mapBnsSections("financial_fraud", { financial: true }),
    statutory_readiness_score: readiness.score,
    readiness_breakdown: readiness.breakdown,
    anonymousMode: false,
    citizenContact: { fullName: "Demo Citizen", phone: "+91-90000-00001", state: "Delhi", district: "New Delhi" },
    signature_status: "signed",
    signature: {
      provider: "epramaan_mock",
      method: "aadhaar_otp_demo",
      artifact: "demo-signature-artifact",
      signedHash: "demosignedhash0000000000000000000000000000000000000000000000000000",
      signedAt: new Date(Date.now() - 38 * 60_000),
    },
    status: "submitted",
    statusHistory: [{ status: "submitted", label: "Complaint submitted", at: new Date(Date.now() - 36 * 60_000) }],
    goldenHour: { startedAt: new Date(Date.now() - 38 * 60_000), windowMinutes: 120 },
    audit_trail: [
      { actor: "citizen", action: "Complaint started" },
      { actor: "ai", action: "AI analysis applied", detail: "provider=heuristic, confidence=0.92" },
      { actor: "citizen", action: "Evidence added (1)" },
      { actor: "system", action: "Digital signature applied (mock e-Pramaan)" },
      { actor: "citizen", action: "Complaint submitted" },
    ],
    acknowledgementIssuedAt: new Date(Date.now() - 36 * 60_000),
  });

  demoIncident.evidence.push({
    evidenceId: crypto.randomUUID(),
    originalName: "upi-receipt-demo.png",
    storedName: "demo-upi-receipt.png",
    mimeType: "image/png",
    sizeBytes: 431_104,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    hashVerifiedServer: true,
    exifScrubbed: false,
    uploadedAt: new Date(Date.now() - 37 * 60_000),
  });
  const trace = await import("../integrations/cfcfrms").then((m) =>
    m.cfcfrmsTraceTransaction({ utr: txn.utr, amount: txn.amount, beneficiaryVpa: txn.beneficiaryVpa })
  );
  demoIncident.moneyTrail = trace;
  await demoIncident.save();

  console.log("[seed] done:", {
    suspects: suspects.length,
    resources: resources.length,
    demoIncident: demoIncident.acknowledgementNumber,
  });
}
