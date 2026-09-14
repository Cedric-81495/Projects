import { legal } from './site'

/* ══ LEGAL PAGE CONTENT ═════════════════════════════════════════════════════
   Content for /privacy, /terms and /disclosures, kept apart from the
   components that render it so replacement copy is a change to this file only.

   Every factual statement here was checked against the software, not written
   from recollection. Where the product does not do something, the text says so
   rather than describing an intention.

   Three things are deliberately absent, and their absence is the point:

     · A RETENTION PERIOD. Nothing in the system deletes anything and there is
       no automated deletion path. A stated period would be a false statement
       to a consumer. /privacy handles requests by contact instead, which is a
       commitment a person can actually honour.

     · THE CLAIM THAT WE ARE NOT A CREDIT REPAIR ORGANISATION. That is a legal
       conclusion about the exact question counsel has been asked, on the site
       of an entity registered as a credit repair business. What appears
       instead is the list of things the software verifiably never does.

     · A GOVERNING LAW CLAUSE. `legal.address` is Boston, but that was chosen
       as a marketing location and is explicitly revisable — it is not a
       statement about where the entity was formed. Naming a state here would
       be a guess.

   ⚠ CONTACT_EMAIL MUST BE A MAILBOX SOMEBODY READS. It is published on three
   pages as the route for privacy requests, deletion requests and disputes. An
   address that bounces is worse than no address, because a consumer has then
   been given a remedy that does not exist.

   Set 2026-09-14 to the address already used as the GHL sender, so it is known
   to exist and to be monitored rather than invented for these pages.

   ⚠ IT IS ALSO THE MARKETING SENDER, WHICH CUTS BOTH WAYS. Replies to campaign
   sends land in the same place as deletion requests, and a deletion request
   looks like an unsubscribe until somebody reads it properly. If that inbox is
   filtered or largely automated, a request with a legal clock on it can sit
   unseen. A dedicated privacy@ alias forwarding to a person is the safer
   arrangement once there is somebody to own it. */

export const CONTACT_EMAIL = 'info@thegwopblueprint.com'

export type Block =
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'note'; text: string }
  | { t: 'dl'; rows: { k: string; v: string }[] }

export type Section = { h: string; blocks: Block[] }

export type LegalDoc = {
  tag: string
  title: string
  lede: string
  updated: string
  sections: Section[]
  /* Rendered small and last. Says plainly what is still being settled, instead
     of inventing text to fill the gap. A reader who is told nothing about
     retention has been misled; a reader who is told it is being set has not. */
  footnote?: string
}

const ENTITY = legal.entity.text

/* ── PRIVACY ──────────────────────────────────────────────────────────────── */

export const PRIVACY: LegalDoc = {
  tag: 'Legal',
  title: 'Privacy Policy',
  lede: `How ${ENTITY} handles the information you give us, and what we do not do with it.`,
  updated: '14 September 2026',
  sections: [
    {
      h: 'Who we are',
      blocks: [
        { t: 'p', text: `GWOP University is operated by ${ENTITY}, ${legal.address.text}.` },
        { t: 'p', text: `For anything in this policy, write to ${CONTACT_EMAIL}.` },
      ],
    },
    {
      h: 'What this policy covers',
      blocks: [
        { t: 'p', text: 'This policy covers the GWOP University website and product. It does not cover any other website you reach from ours, including IdentityIQ — see “Who else receives your information” below.' },
      ],
    },
    {
      h: 'What you give us',
      blocks: [
        { t: 'p', text: 'You can complete our seven-question assessment without an account and without paying. We ask for:' },
        {
          t: 'ul',
          items: [
            'First name — to personalise your plan and any follow-up',
            'Last name — optional',
            'Email address — to send your plan and marketing emails',
            'Mobile number — for marketing text messages, only if you consent',
            'The topic you want help with — so follow-up is relevant',
          ],
        },
        { t: 'p', text: 'The seven questions ask you to pick one answer from a fixed list: where you are financially, roughly what range your credit score is in, how much emergency savings you have, whether you budget, what you are building toward, and your biggest obstacle. Every answer is your own statement about yourself. We do not check any of it.' },
        { t: 'note', text: 'We hold no credit report and no credit score. The credit question asks you to choose a range yourself, and “I don’t know” is one of the options. We never obtain a credit report, never contact a credit bureau, and receive nothing about you from any credit reporting agency.' },
      ],
    },
    {
      h: 'Text message consent',
      blocks: [
        { t: 'p', text: 'The consent box is optional and unchecked by default. If you tick it, we record that you agreed, the exact wording you were shown, the date and time, and the internet address your device was using.' },
        { t: 'p', text: 'We keep the wording itself so that if a question ever arises we can show what you agreed to, rather than what the website says today.' },
        { t: 'p', text: 'If you do not tick it, we still keep you as a contact and simply send you no text messages.' },
      ],
    },
    {
      h: 'Your account and payment',
      blocks: [
        { t: 'p', text: 'If you create an account we hold your name, email, phone number and marketing preference.' },
        { t: 'p', text: 'Card details are entered on Stripe’s own payment page, not ours. Card numbers never reach our website or our records. We keep only the amount, the currency, the date, and Stripe’s reference numbers for the transaction.' },
      ],
    },
    {
      h: 'What we collect automatically',
      blocks: [
        {
          t: 'dl',
          rows: [
            { k: 'The internet address of your device', v: 'When you submit a form, and when our staff act on an account. Part of the consent record, fraud prevention, and our internal security log.' },
            { k: 'Your browser and device type', v: 'When you submit a form.' },
            { k: 'Which website or advertisement you came from', v: 'To know which marketing is working.' },
            { k: 'Which printed QR code you scanned', v: 'To attribute a signup to a specific event.' },
          ],
        },
        { t: 'p', text: 'General page-view analytics are currently switched off.' },
      ],
    },
    {
      h: 'What we record as you use the product',
      blocks: [
        {
          t: 'ul',
          items: [
            'Which levels you have access to, and from when',
            'Which lessons you started and finished, how far through a video you reached, and when you first opened a lesson. This also serves as evidence of delivery if a charge is later disputed',
            'Certificates you earn',
            'Actions our staff take on your account, including the staff member’s internet address',
          ],
        },
      ],
    },
    {
      h: 'Who else receives your information',
      blocks: [
        { t: 'p', text: 'The following are service providers acting on our instructions. Everything is stored in the United States.' },
        {
          t: 'dl',
          rows: [
            { k: 'GoHighLevel', v: 'Name, email, phone, topic of interest, your consent record and the wording shown, where you came from, and the date. After the assessment: email, phone, your seven answers, and which plan you were given. Used for email and text follow-up.' },
            { k: 'Supabase', v: 'Hosts our database. Receives everything described above.' },
            { k: 'Vercel', v: 'Hosts our website. Receives website traffic, including internet addresses.' },
            { k: 'Cloudflare', v: 'Receives your internet address and browser details at the moment you submit a form, to block automated spam.' },
            { k: 'Stripe', v: 'Receives your name, email and card details, entered on Stripe’s own page, to process payment.' },
            { k: 'PostHog', v: 'Product analytics. Receives an account identifier, the event name, and a fixed list of non-personal details — which level, which plan, the amount and currency. No name, email, phone number or assessment answers.' },
          ],
        },
      ],
    },
    {
      h: 'IdentityIQ — nothing is exchanged',
      blocks: [
        { t: 'p', text: 'We show an optional link to IdentityIQ, a separate company that sells credit monitoring. You click the link and sign up directly with them, on their website, under their terms.' },
        { t: 'p', text: 'The link contains nothing but our referral code. We send IdentityIQ nothing about you and receive nothing about you back. We may earn a commission if you sign up, and we say so on the page.' },
      ],
    },
    {
      h: 'We do not sell your information',
      blocks: [
        { t: 'p', text: 'We do not sell it, and we do not share it for advertising that follows you across other websites. It goes only to the providers listed above, for the purposes listed.' },
      ],
    },
    {
      h: 'Who can see it',
      blocks: [
        { t: 'p', text: 'Course PDFs are held in private storage and can only be opened through a temporary link that expires. Nothing is publicly reachable by guessing a web address.' },
        {
          t: 'ul',
          items: [
            'You can see only your own information',
            'Course content is available only for the levels you bought',
            'Contact records and assessment answers cannot be read by any logged-in customer at all. The database refuses the request outright, for every customer account, without exception. Only our own server processes can read them, and only to send your plan and update our customer system',
            'These limits are built into the database rather than only into the website, so a fault in the website cannot expose one customer’s records to another',
          ],
        },
      ],
    },
    {
      h: 'How long we keep it, and asking us to delete it',
      blocks: [
        { t: 'p', text: `We keep your information for as long as we need it to provide the product and to meet our legal, tax and accounting obligations. We are setting defined retention periods with our attorney and will publish them here once they are settled.` },
        { t: 'p', text: `You can ask us to delete your information by writing to ${CONTACT_EMAIL}. We handle these requests by hand, so allow us a reasonable period to respond.` },
        { t: 'p', text: 'Some records we must keep even after a deletion request — payment records for tax purposes, and our internal log of staff actions on accounts. We will tell you what we have kept and why.' },
      ],
    },
    {
      h: 'Your choices',
      blocks: [
        { t: 'p', text: 'Text messages: reply STOP to any message to opt out, or HELP for assistance. Consent is not a condition of purchase.' },
        { t: 'p', text: 'Marketing emails: use the unsubscribe link in any email.' },
        { t: 'p', text: `Access and correction: write to ${CONTACT_EMAIL} and we will tell you what we hold about you, or correct it.` },
      ],
    },
    {
      h: 'Children',
      blocks: [
        { t: 'p', text: 'GWOP University is intended for adults. We do not knowingly collect information from anyone under 18.' },
      ],
    },
    {
      h: 'Changes to this policy',
      blocks: [
        { t: 'p', text: 'If we change this policy we will post the change here and update the date above.' },
      ],
    },
  ],
  footnote: 'Retention periods and the formal description of your rights under applicable state law are being finalised with our attorney and will be published here. Everything above describes what the product does today.',
}

/* ── TERMS ────────────────────────────────────────────────────────────────── */

export const TERMS: LegalDoc = {
  tag: 'Legal',
  title: 'Terms of Service',
  lede: `The agreement between you and ${ENTITY} when you use GWOP University.`,
  updated: '14 September 2026',
  sections: [
    {
      h: 'Who these terms are between',
      blocks: [
        { t: 'p', text: `These terms are between you and ${ENTITY}, ${legal.address.text}, which operates GWOP University. By creating an account or buying anything, you agree to them.` },
      ],
    },
    {
      h: 'What GWOP University is',
      blocks: [
        { t: 'p', text: 'GWOP University sells recorded video lessons and accompanying written materials covering personal credit, business formation and business credit, funding and banking strategy, and capital and wealth strategy.' },
        { t: 'p', text: 'It is education. We teach you about your own financial position and how to act on it. We do not act on your behalf.' },
        { t: 'p', text: 'We do not, and will not:' },
        {
          t: 'ul',
          items: [
            'obtain, review or hold your credit report',
            'contact any credit bureau, creditor or collection agency on your behalf',
            'dispute, remove or alter anything on your credit file',
            'apply for credit or funding on your behalf',
            'guarantee any improvement in your credit score, any approval for funding, or any financial outcome',
          ],
        },
      ],
    },
    {
      h: 'Eligibility',
      blocks: [
        { t: 'p', text: 'You must be at least 18 and able to enter into a binding contract.' },
      ],
    },
    {
      h: 'Your account',
      blocks: [
        { t: 'p', text: 'You are responsible for keeping your password confidential and for activity under your account. Tell us promptly if you believe someone else has access to it.' },
        { t: 'p', text: 'One account is for one person. You may not share your login, and you may not copy, download, redistribute, resell or publish the course materials.' },
      ],
    },
    {
      h: 'What you are buying',
      blocks: [
        { t: 'p', text: 'Levels are sold individually or together as a bundle.' },
        { t: 'note', text: 'Buying one level gives you that level only. It does not include the levels below it. The bundle includes all four. What each purchase includes is stated on the purchase page before you buy.' },
        { t: 'p', text: 'Your access does not expire on a fixed date. If we ever have to withdraw a level, we will give you reasonable notice.' },
      ],
    },
    {
      h: 'Price and payment',
      blocks: [
        { t: 'p', text: 'Prices are shown on the purchase page in US dollars and may change. The price that applies is the one shown at the time you buy.' },
        { t: 'p', text: 'Payment is taken in full at the time of purchase, and access to what you bought opens as soon as the payment succeeds. Payment is processed by Stripe; card details are entered on Stripe’s page, not ours.' },
      ],
    },
    {
      h: 'Refunds',
      blocks: [
        { t: 'p', text: 'Purchases are non-refundable. You receive immediate access to the full material for the level or bundle you bought, which is why we ask you to be sure before you buy. What each purchase includes is set out on the purchase page.' },
        { t: 'p', text: 'We record which lessons you opened and how far through each video you reached. If a charge is disputed, that record shows what was delivered.' },
        { t: 'note', text: 'Nothing in this section affects any right you have under applicable law that cannot be excluded or waived.' },
      ],
    },
    {
      h: 'What we do not promise',
      blocks: [
        { t: 'p', text: 'The material is general education. It is not legal, financial, tax or investment advice, and it is not tailored to your circumstances.' },
        { t: 'p', text: 'We make no promise about results. What you get out of this depends on your own situation and your own decisions, neither of which we control — and on how lenders and other third parties choose to act, which nobody controls. See our Disclosures page.' },
      ],
    },
    {
      h: 'How you may use the service',
      blocks: [
        { t: 'p', text: 'You may not use GWOP University to break the law, infringe anyone’s rights, or interfere with the service or other users. We may suspend or close an account that does.' },
      ],
    },
    {
      h: 'Our material',
      blocks: [
        { t: 'p', text: `All course content — text, video, graphics and downloadable materials — belongs to ${ENTITY} or its licensors. Buying access does not transfer ownership. You may use the materials for your own personal use only.` },
      ],
    },
    {
      h: 'Other websites',
      blocks: [
        { t: 'p', text: 'We link to IdentityIQ and may link to other services. We do not control them and are not responsible for their content or their practices. Where we may earn a commission, we say so.' },
      ],
    },
    {
      h: 'Changes to these terms',
      blocks: [
        { t: 'p', text: 'We may change these terms. Changes are posted here with an updated date. Changes do not alter what was included in a purchase you have already made.' },
      ],
    },
    {
      h: 'Contact',
      blocks: [
        { t: 'p', text: `Write to ${CONTACT_EMAIL}.` },
      ],
    },
  ],
  footnote: 'Our limitation of liability, governing law and dispute resolution provisions are being finalised with our attorney and will be published here.',
}

/* ── DISCLOSURES ──────────────────────────────────────────────────────────── */

export const DISCLOSURES: LegalDoc = {
  tag: 'Legal',
  title: 'Disclosures',
  lede: 'What we sell, what we earn from, and what we do not promise.',
  updated: '14 September 2026',
  sections: [
    {
      h: 'This is education, not advice',
      blocks: [
        { t: 'p', text: 'Everything GWOP University publishes is general education. It is not legal advice, financial advice, tax advice or investment advice, and none of it is tailored to your particular circumstances.' },
        { t: 'p', text: 'We do not know your situation and we never review your credit report. Whether any part of what we teach fits you is for you to judge, with a qualified professional where that matters.' },
      ],
    },
    {
      h: 'What we do not do',
      blocks: [
        { t: 'p', text: 'We sell recorded lessons and written materials. We do not act on your behalf. Specifically, we never:' },
        {
          t: 'ul',
          items: [
            'obtain, review or hold your credit report',
            'contact a credit bureau, creditor or collection agency on your behalf',
            'dispute, remove or alter anything on your credit file',
            'apply for credit or funding on your behalf',
          ],
        },
      ],
    },
    {
      h: 'No guarantee of results',
      blocks: [
        { t: 'p', text: 'We do not promise that you will improve your credit score, be approved for funding, earn any amount of money, or reach any financial outcome.' },
        { t: 'p', text: 'Any example, figure or result described in our materials is what happened for one person in their circumstances. It is not typical, it is not a promise, and it is not something you should expect.' },
      ],
    },
    {
      h: 'Affiliate relationships',
      blocks: [
        { t: 'p', text: 'We show an optional link to IdentityIQ, a separate company that sells credit monitoring. If you sign up through our link we may earn a commission, at no additional cost to you.' },
        { t: 'p', text: 'We are not connected to IdentityIQ beyond that referral. You sign up directly with them, on their website, under their terms. We send them nothing about you and receive nothing about you back — the link carries only our referral code.' },
        { t: 'note', text: 'The commission does not change what we teach, and our recommendation is not paid for.' },
      ],
    },
    {
      h: 'Text messages',
      blocks: [
        { t: 'p', text: 'If you consent, we send marketing text messages to the number you give us. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, or HELP for assistance.' },
        { t: 'p', text: 'Consent is not a condition of purchase. See our SMS Terms page.' },
      ],
    },
    {
      h: 'Service providers and other websites',
      blocks: [
        { t: 'p', text: 'We use service providers to run the product — hosting, payment, customer communication and analytics. They are listed in our Privacy Policy.' },
        { t: 'p', text: 'We link to other websites from time to time. We do not control them and are not responsible for their content or their practices.' },
      ],
    },
    {
      h: 'Contact',
      blocks: [
        { t: 'p', text: `Write to ${CONTACT_EMAIL}.` },
      ],
    },
  ],
}
