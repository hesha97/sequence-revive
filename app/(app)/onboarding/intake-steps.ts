// app/(app)/onboarding/intake-steps.ts
//
// The 17-question v5 intake. Asks what the operator KNOWS.
// Pain, objection, signals, market context are DERIVED by AI after this.
//
// Pattern 14 — every MCQ option has { user, api }. `user` is what the operator
// sees; `api` is the exact value stored on the answers object. For Lemlist
// filter steps, `api` values are the literal Lemlist enum strings.

export type FieldKind = 'text' | 'textarea' | 'mcq-single' | 'mcq-multi' | 'tags'

export type McqOption = {
  user: string
  api: string | string[]
}

export type IntakeStep = {
  id: string
  kind: FieldKind
  eyebrow: string
  question: string
  helper?: string
  placeholder?: string
  options?: McqOption[]
  optional?: boolean
  validate: (v: unknown) => boolean
}

const nonEmpty = (v: unknown): boolean =>
  typeof v === 'string' && v.trim().length > 0

const minWords = (n: number) => (v: unknown): boolean =>
  typeof v === 'string' && v.trim().split(/\s+/).filter(Boolean).length >= n

const nonEmptyArray = (v: unknown): boolean =>
  Array.isArray(v) && v.length > 0

const anyValue = (): boolean => true

export const INTAKE_STEPS: IntakeStep[] = [
  // ---------- CHAPTER 1 — WHO YOU ARE ----------
  {
    id: 'company-name',
    kind: 'text',
    eyebrow: 'Who you are',
    question: "What's your company called?",
    helper: 'The name people see on your website and emails.',
    placeholder: 'e.g. Sequence Revive',
    validate: nonEmpty,
  },
  {
    id: 'company-website',
    kind: 'text',
    eyebrow: 'Who you are',
    question: "What's the website?",
    helper: "We'll learn your voice from it. Just the domain works.",
    placeholder: 'e.g. sequencerevive.com',
    validate: nonEmpty,
  },
  {
    id: 'company-stage',
    kind: 'mcq-single',
    eyebrow: 'Who you are',
    question: 'What stage is the company in?',
    options: [
      { user: 'Pre-launch / building', api: 'pre_launch' },
      { user: 'Just launched / first paying customers', api: 'early' },
      { user: 'Growing / scaling team and revenue', api: 'growth' },
      { user: 'Established / known in our market', api: 'established' },
      { user: 'Enterprise / mature business', api: 'mature' },
    ],
    validate: nonEmpty,
  },
  {
    id: 'your-role',
    kind: 'mcq-single',
    eyebrow: 'Who you are',
    question: "What's your role?",
    options: [
      { user: 'Founder / CEO', api: 'founder' },
      { user: 'Head of Sales / BD', api: 'head_sales' },
      { user: 'Sales / BD individual contributor', api: 'ic_sales' },
      { user: 'Marketing leader', api: 'marketing' },
      { user: 'Recruiter / Talent', api: 'recruiter' },
      { user: 'Other operator', api: 'other' },
    ],
    validate: nonEmpty,
  },
  {
    id: 'what-you-sell',
    kind: 'textarea',
    eyebrow: 'Who you are',
    question: 'In a paragraph — what do you sell, and to whom?',
    helper: "Plain language. The way you'd tell a friend at dinner. This becomes the spine of every email.",
    placeholder: "We help mid-market construction firms in MENA hit their tender targets by running outbound on their behalf.",
    validate: minWords(12),
  },

  // ---------- CHAPTER 2 — WHO YOU REACH ----------
  {
    id: 'ideal-buyer-title',
    kind: 'mcq-multi',
    eyebrow: 'Who you reach',
    question: 'What seniority typically buys from you?',
    helper: 'Pick all that apply. These become exact search filters.',
    options: [
      { user: 'Owner / Founder', api: 'Ownership / Firm Leadership' },
      { user: 'C-Suite (CEO, CTO, CMO, etc.)', api: 'Executive Leadership' },
      { user: 'VP / Vice President', api: 'Executive Leadership' },
      { user: 'Director / Head of...', api: 'Department Leadership' },
      { user: 'Manager / Team Lead', api: 'People Management / Leadership' },
      { user: 'Senior Individual Contributor', api: 'Upper Mid-Level / Experienced IC' },
    ],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal-buyer-departments',
    kind: 'mcq-multi',
    eyebrow: 'Who you reach',
    question: 'Which departments do they sit in?',
    options: [
      { user: 'HR / People / Talent', api: 'Human Resources' },
      { user: 'Marketing / Brand', api: 'Marketing' },
      { user: 'Sales / BD / Revenue', api: 'Sales' },
      { user: 'Procurement / Supply Chain', api: 'Purchasing' },
      { user: 'Operations', api: 'Operations' },
      { user: 'Engineering / Product', api: 'Engineering' },
      { user: 'Finance', api: 'Finance' },
      { user: 'Founder / Owner (no specific dept)', api: 'Business Development' },
    ],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal-company-size',
    kind: 'mcq-multi',
    eyebrow: 'Who you reach',
    question: 'What size companies are your sweet spot?',
    options: [
      { user: 'Solo / very small (1-10)', api: '1-10' },
      { user: 'Growing (11-50)', api: '11-50' },
      { user: 'Mid-size (51-200)', api: '51-200' },
      { user: 'Large (201-500)', api: '201-500' },
      { user: 'Enterprise (501-1000)', api: '501-1000' },
      { user: 'Very large (1001-5000)', api: '1001-5000' },
      { user: 'Massive (5000+)', api: '5001-10000' },
    ],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal-industries',
    kind: 'tags',
    eyebrow: 'Who you reach',
    question: 'Which industries? (3-7 is the sweet spot)',
    helper: "Type and press Enter. Be specific — 'B2B SaaS' beats 'Software'.",
    placeholder: 'e.g. B2B SaaS',
    validate: nonEmptyArray,
  },
  {
    id: 'geography',
    kind: 'mcq-single',
    eyebrow: 'Who you reach',
    question: 'Where are these people?',
    options: [
      { user: 'Egypt only', api: ['Egypt'] },
      { user: 'Egypt + GCC', api: ['Egypt', 'United Arab Emirates', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'] },
      { user: 'MENA region', api: ['Egypt', 'United Arab Emirates', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Morocco', 'Tunisia', 'Algeria'] },
      { user: 'Europe', api: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Ireland', 'Sweden', 'Denmark', 'Belgium'] },
      { user: 'United States + Canada', api: ['United States', 'Canada'] },
      { user: 'Anywhere', api: 'Global' },
    ],
    validate: (v) => v !== undefined && v !== null,
  },

  // ---------- CHAPTER 3 — THE CONVERSATION ----------
  {
    id: 'biggest-win-story',
    kind: 'textarea',
    eyebrow: 'The conversation',
    question: 'Tell us about your favorite client win — in 2-3 sentences.',
    helper: "The story you tell at dinner. We'll learn your selling instinct from how you talk about it.",
    placeholder: 'Sahmoud Group — we opened 12 booked meetings in 3 months with Egypt mid-market construction.',
    validate: minWords(10),
  },
  {
    id: 'decision-window',
    kind: 'mcq-single',
    eyebrow: 'The conversation',
    question: 'How fast do your deals usually move?',
    options: [
      { user: 'Pretty fast — under a month', api: 'fast' },
      { user: 'Steady — 1-3 months', api: 'medium' },
      { user: 'Patient — 3-6 months', api: 'long' },
      { user: 'Long game — 6+ months', api: 'enterprise' },
    ],
    validate: nonEmpty,
  },

  // ---------- CHAPTER 4 — YOUR EDGE ----------
  {
    id: 'tone-register',
    kind: 'mcq-single',
    eyebrow: 'Your edge',
    question: 'How do you want to come across?',
    options: [
      { user: 'Warm + human (like a coffee chat)', api: 'warm_human' },
      { user: 'Professional + direct (no fluff)', api: 'professional_direct' },
      { user: "Confident + bold (we know we're great)", api: 'confident_bold' },
      { user: 'Quiet + premium (like a luxury concierge)', api: 'quiet_premium' },
      { user: 'Witty + clever (a little personality)', api: 'witty_clever' },
      { user: 'Technical + precise (peer to peer)', api: 'technical_precise' },
    ],
    validate: nonEmpty,
  },
  {
    id: 'cta-style',
    kind: 'mcq-single',
    eyebrow: 'Your edge',
    question: "What's the right ask in email #1?",
    options: [
      { user: 'Reply yes → I send credentials/info pack (AVL-style)', api: 'reply_yes' },
      { user: 'Reply with availability → I send calendar link', api: 'reply_avail' },
      { user: 'Click to book directly', api: 'book_link' },
      { user: 'Reply with a single yes/no question', api: 'yes_no' },
      { user: "Open-ended: 'worth a quick chat?'", api: 'open_ended' },
    ],
    validate: nonEmpty,
  },
  {
    id: 'proof-and-clients',
    kind: 'textarea',
    eyebrow: 'Your edge',
    question: 'Name 2-4 clients or named results we can reference.',
    helper: "Real names land harder than 'a leading enterprise'. If pre-launch, write 'N/A' — we'll lead with vision instead.",
    placeholder: 'Sahmoud Group, Siemens, Heidelberg Materials',
    validate: nonEmpty,
  },
  {
    id: 'forbidden-phrases',
    kind: 'tags',
    eyebrow: 'Your edge',
    question: 'Any phrases we should NEVER use?',
    helper: "Words or claims that feel off-brand. (Optional — press skip if none come to mind.)",
    placeholder: "e.g. 'I hope this finds you well'",
    optional: true,
    validate: anyValue,
  },
  {
    id: 'named-competitors',
    kind: 'tags',
    eyebrow: 'Your edge',
    question: 'Who do you compete with most often?',
    helper: "We'll never trash-talk them — but we'll know to position around them.",
    placeholder: 'e.g. Lemlist, Apollo',
    optional: true,
    validate: anyValue,
  },
]
