// Onboarding intake spec — 17 questions, MCQ-heavy.
// Values for seniority / company_size / countries / departments are the EXACT
// strings Lemlist accepts. Pattern 14 — API Vocabulary Exactness. Editing these
// values silently changes search results.

export type IntakeStepKind =
  | 'text'
  | 'longtext'
  | 'single'
  | 'multi'

export type IntakeStep = {
  id: string
  kind: IntakeStepKind
  eyebrow: string
  question: string
  helper?: string
  placeholder?: string
  options?: string[]
  // unknown rather than any — narrow at use sites.
  validate: (v: unknown) => boolean
}

// Canonical Lemlist filter values
export const SENIORITIES = [
  'CxO',
  'Founder',
  'Owner',
  'President',
  'Vice President',
  'Director',
  'Manager',
  'Senior',
  'Entry',
] as const

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10001+',
] as const

export const MENA_COUNTRIES = [
  'Egypt',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Jordan',
  'Lebanon',
  'Morocco',
  'Tunisia',
] as const

export const DEPARTMENTS = [
  'Marketing',
  'Sales',
  'Operations',
  'Procurement',
  'HR',
  'Finance',
  'Engineering',
  'Product',
  'Customer Success',
  'Executive',
] as const

export const INDUSTRIES = [
  'B2B SaaS',
  'Real Estate',
  'Construction',
  'Manufacturing',
  'Hospitality',
  'Retail',
  'Healthcare',
  'Education',
  'Financial Services',
  'Professional Services',
  'E-commerce',
  'Media',
] as const

const nonEmpty = (v: unknown) =>
  typeof v === 'string' ? v.trim().length > 0 : false
const nonEmptyArray = (v: unknown) =>
  Array.isArray(v) && v.length > 0

export const INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'company_name',
    kind: 'text',
    eyebrow: 'About you',
    question: "What's the name of your company?",
    placeholder: 'Revive Agency',
    validate: nonEmpty,
  },
  {
    id: 'what_you_do',
    kind: 'longtext',
    eyebrow: 'About you',
    question: 'In two sentences, what do you do and who do you do it for?',
    helper: "Plain words. The person you're writing to should picture it.",
    placeholder:
      'We help mid-market construction firms in MENA hit their tender targets by running outbound on their behalf.',
    validate: nonEmpty,
  },
  {
    id: 'named_proof',
    kind: 'longtext',
    eyebrow: 'About you',
    question: "Name two or three clients you've done this for, plus one outcome each.",
    helper: 'Real names, real results. This becomes the proof points in every email.',
    placeholder:
      'Sahmoud Group — 12 booked meetings in 3 months. Etisalat — 4 enterprise pilots opened.',
    validate: nonEmpty,
  },
  {
    id: 'voice_register',
    kind: 'single',
    eyebrow: 'Your voice',
    question: 'How do you want to sound?',
    options: [
      'Direct and corporate — like a senior consultant',
      'Warm and conversational — like a thoughtful friend',
      'Confident and brief — like a busy executive',
      'Curious and analytical — like a researcher',
    ],
    validate: nonEmpty,
  },
  {
    id: 'voice_constraints',
    kind: 'longtext',
    eyebrow: 'Your voice',
    question: 'Any words, phrases, or moves to avoid?',
    helper: 'Optional. Anything that would feel off in your voice.',
    placeholder: 'No exclamation marks. No "I hope this finds you well."',
    validate: () => true,
  },
  {
    id: 'ideal_buyer_title',
    kind: 'multi',
    eyebrow: 'Who you want to reach',
    question: 'What seniority levels are you reaching out to?',
    helper: 'Pick all that apply. These become exact search filters.',
    options: [...SENIORITIES],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal_buyer_departments',
    kind: 'multi',
    eyebrow: 'Who you want to reach',
    question: 'Which departments inside the company?',
    options: [...DEPARTMENTS],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal_buyer_description',
    kind: 'longtext',
    eyebrow: 'Who you want to reach',
    question: 'Describe the buyer you want to talk to.',
    helper: 'Be vivid and specific — title, what their week looks like, who they answer to.',
    placeholder:
      "A Head of Marketing at a 200-person construction firm who owns the pipeline number but doesn't have a BDR team.",
    validate: nonEmpty,
  },
  {
    id: 'ideal_company_size',
    kind: 'multi',
    eyebrow: 'Who you want to reach',
    question: 'How big are their companies?',
    options: [...COMPANY_SIZES],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal_industries',
    kind: 'multi',
    eyebrow: 'Who you want to reach',
    question: 'Which industries?',
    options: [...INDUSTRIES],
    validate: nonEmptyArray,
  },
  {
    id: 'ideal_countries',
    kind: 'multi',
    eyebrow: 'Who you want to reach',
    question: 'Which countries?',
    options: [...MENA_COUNTRIES],
    validate: nonEmptyArray,
  },
  {
    id: 'buyer_daily_pain',
    kind: 'longtext',
    eyebrow: 'The conversation',
    question: 'What pain does this buyer feel every single day?',
    helper: 'Not the thing you solve — the thing they actually feel when they open their inbox.',
    placeholder:
      "Their leadership keeps asking for the pipeline number and they don't have an honest answer.",
    validate: nonEmpty,
  },
  {
    id: 'common_objection',
    kind: 'longtext',
    eyebrow: 'The conversation',
    question: 'When this buyer says no, what do they usually say?',
    helper: "The push-back you hear most often. We'll preempt it in email two.",
    placeholder: 'We already have a marketing agency. / Budget is locked for the year.',
    validate: nonEmpty,
  },
  {
    id: 'winning_argument',
    kind: 'longtext',
    eyebrow: 'The conversation',
    question: "What's the one argument that actually closes them?",
    helper: 'Lead with this in email one.',
    placeholder: "You don't replace your agency. We just open meetings they can't.",
    validate: nonEmpty,
  },
  {
    id: 'buying_signals',
    kind: 'longtext',
    eyebrow: 'The conversation',
    question: 'What signals tell you a company is about to buy?',
    helper: 'List 5-7 short ones, one per line. We use these to score people.',
    placeholder:
      'Just raised funding. Posting BDR job. New CMO in the last 6 months. Sponsoring a trade show.',
    validate: nonEmpty,
  },
  {
    id: 'key_value_props',
    kind: 'longtext',
    eyebrow: 'The conversation',
    question: 'List your 3-4 strongest value props in short phrases.',
    helper: 'One per line. We rotate them across emails.',
    placeholder: 'AVL-aware MENA outbound. Named-client proof. Compliant by default. 14-day pilot.',
    validate: nonEmpty,
  },
  {
    id: 'market_context',
    kind: 'longtext',
    eyebrow: 'The conversation',
    question: "In one or two sentences, what's happening in their industry right now?",
    helper: 'The thing they read about this week.',
    placeholder: 'Tender cycles are tightening across the GCC and procurement is moving in-house.',
    validate: nonEmpty,
  },
]
