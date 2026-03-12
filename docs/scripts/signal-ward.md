# Signal Ward — NLP & Medical Text

> **COMING SOON** — Signal Ward is the third theme in TensorCraft. It is currently in development. The script below contains the full narrative design, character profiles, and module outlines. Lesson-level detail will be added during production.

---

## SCRIPT GUIDE

**Tags:** `NLP` `transformers` `BERT` `medical-text` `RAG` `clinical-AI`
**Theme:** AI-assisted clinical decision support in a hospital setting
**Setting:** Signal Ward is the advanced research wing of Caduceus Medical Center, a cutting-edge hospital and research facility. The ward processes millions of patient records, clinical notes, medical literature, and diagnostic reports. The healthcare system is drowning in unstructured text — doctors' handwritten notes digitized into messy transcripts, research papers piling up faster than anyone can read, and critical diagnostic information buried in paragraphs of clinical prose.
**Model being built:** Diagnostic One — an AI text assistant for clinical NLP
**GitHub repo deployed at end:** `diagnostic-one-clinical-nlp`

### Characters

| Name | Role | Description |
|---|---|---|
| **Dr. Elena Vasquez** | Head Researcher / Mentor | Director of Signal Ward. Brilliant diagnostician, demanding but empathetic. Lost a patient early in her career due to a missed note in a chart — this drives her mission. Sets clinical context and explains *why* each NLP capability matters. Has no patience for sloppy work but infinite patience for genuine learning. |
| **Obi Nwosu** | Computational Linguist / Concept Explainer | NLP expert with a PhD in biomedical NLP. Warm, articulate, deeply enthusiastic about language. Speaks three languages fluently and sees beauty in how words carry meaning. Introduces NLP theory, explains architectures, builds linguistic intuition. |
| **Santos** | Nurse & Data Curator / Implementation Lead | Handles data quality, labeling, and the messy reality of clinical text. Practical, meticulous, protective of patient data. Has labeled ten thousand records by hand. Bridges the gap between raw medical records and clean training data. |
| **Khalil Mensah** | Bioethicist & Health IT / Student Avatar | The player character. A skilled frontend developer working in Caduceus Medical Center's IT department. Strong JS/TS skills, no ML background. Thoughtful, principled, detail-oriented. He asks uncomfortable ethical questions that make the system better. Tasked with building the Diagnostic One interface after the hospital's vendor solution failed. Previously built Meridian General's patient records UI — a React app that displayed charts, lab results, and medication histories but couldn't surface relevant information. The data was all there — drug interactions hiding across tabs, symptom patterns buried in months of notes — but his frontend could only *display* it, never *understand* it. Khalil knows the data is there; he just couldn't make it smart. Now he gets to fix that at the ML level. |
| **MEDI** | Clinical Decision Support AI | The ward's AI assistant. Precise, helpful, occasionally pedantic about medical terminology. Unlike other theme AIs, MEDI is designed to be cautious — it flags uncertainty rather than projecting confidence. Corrects gently but firmly. Tutorial guide and hint system. |

### DISCLAIMER

> **IMPORTANT: Signal Ward is an educational simulation.** The clinical scenarios, patient data, and medical information presented in this theme are entirely fictional and created for teaching NLP concepts. Nothing in this course constitutes medical advice. The AI systems built in this course are educational demonstrations and must never be used for real clinical decisions. Real clinical NLP systems require extensive validation, regulatory approval (FDA/CE), and oversight by licensed medical professionals.

### AI-Wrong Moments

Signal Ward deliberately includes moments where the AI system produces incorrect or misleading outputs, teaching students to build systems that handle failure gracefully:

- **Module 6 (Transformers & BERT):** MEDI misinterprets temporal context in a clinical note — confusing a patient's *history* of a condition with a *current* diagnosis. The sentence "History of Type 2 diabetes, resolved after bariatric surgery" gets classified as an active condition. Khalil learns to build temporal-aware models with negation detection.
- **Module 8 (Text Classification):** MEDI generates a clinical summary that is linguistically fluent but factually wrong — it hallucinates a medication dosage that appears nowhere in the source notes. The summary reads convincingly, making the error harder to catch. The team learns about hallucination detection and grounding.
- **Module 11 (Capstone):** MEDI flags a false positive — an urgent drug interaction alert for a patient who is actually stable. Dr. Vasquez uses this as a teaching moment: "This is why AI assists but never decides. The false positive costs us 3 minutes of review. A false negative could cost a life."

### Career Paths & Salaries

> **Note:** Tensorcraft graduates are best positioned for "ML-Enhanced" frontend/fullstack roles. The pure ML engineering roles below typically also require Python fluency and deeper mathematics — Tensorcraft provides the conceptual foundation to pursue them.

| Path | Description | Avg Salary (US) |
|---|---|---|
| ML-Enhanced Frontend Engineer | Build NLP-powered features in the browser (search, text analysis, chatbot UIs) | $120,000 - $160,000 |
| Frontend Engineer (NLP Products) | Frontend for NLP-heavy products (text annotation, clinical dashboards, AI safety UIs) | $125,000 - $165,000 |
| NLP Engineer* | Build text understanding and generation systems | $145,000 - $195,000 |
| ML Engineer (NLP)* | Train and deploy language models at scale | $150,000 - $200,000 |
| AI Safety / Alignment Engineer* | Build guardrails and safety systems for AI outputs | $155,000 - $210,000 |

*\*Requires additional Python fluency and deeper mathematics beyond this course.*

---

## COMING SOON PREVIEW

### Preview Art

A hospital corridor at night. Fluorescent lights cast a blue-white glow on polished floors. In the foreground, Khalil sits at a workstation in the IT office, multiple monitors showing clinical text with highlighted entities — medications in blue, conditions in amber, procedures in green. On one monitor, MEDI's interface displays a clinical summary with confidence bars next to each extracted fact. Through the glass window behind Khalil, the ICU is visible — monitors blinking, nurses moving between beds. The contrast between the quiet code and the urgent care beyond the glass captures the theme's tension.

### Story Summary

Signal Ward at Caduceus Medical Center is drowning in unstructured clinical text. Thousands of notes, reports, and discharge summaries flow through the EHR system daily, but critical information gets buried. After a vendor NLP solution fails spectacularly — misclassifying a drug allergy and triggering a near-miss adverse event — Dr. Vasquez cancels the vendor contract and decides to build an in-house system.

Khalil, a frontend developer in the IT department, is tasked with building the interface for Diagnostic One, a clinical NLP pipeline. Under the guidance of Dr. Vasquez (clinical context), Obi (NLP theory), and Santos (data quality), he learns to build text processing systems that can tokenize clinical language, extract medical entities, classify note types, summarize documents, and flag critical findings — all running in the browser for privacy and speed.

The journey is not just technical — it is ethical. Signal Ward confronts the reality that AI in healthcare must be held to a higher standard. Every module includes moments where the system fails, and the team learns to build safeguards, communicate uncertainty, and keep humans in the loop.

### Model Preview

Diagnostic One evolves across 11 modules:

1. **M1-M2:** Text preprocessor and tokenizer for clinical documents
2. **M3:** Word embedding model trained on medical vocabulary
3. **M4:** Sequence model for parsing clinical narratives
4. **M5:** Attention-enhanced model for focusing on medically relevant terms
5. **M6:** Transformer-based document understanding (BERT fine-tuned on clinical text)
6. **M7:** Named Entity Recognition for medications, conditions, procedures
7. **M8:** Text classifier for record triage and urgency scoring
8. **M9:** Question-answering system with RAG for clinical queries
9. **M10:** Production-optimized, privacy-preserving deployment
10. **M11:** Full clinical assistant with monitoring, safety guardrails, and feedback loops

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
>
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Signal Ward):**
>
> - Text processing (tokenization, vocabularies, embeddings)
> - Language modeling (n-grams, perplexity, next-token prediction)
> - Sequence modeling (RNNs, LSTMs, GRUs, bidirectional models)
> - Attention and transformers (self-attention, multi-head, positional encoding)
> - Pre-trained models (BERT, fine-tuning, feature extraction)
> - Named entity recognition (BIO tagging, span extraction)
> - Retrieval-augmented generation (RAG, vector search, grounding)
> - Clinical NLP (medical ontologies, negation detection, temporal reasoning)

---

## MODULE 1: ML THROUGH TEXT (FREE)

*Khalil is introduced to the crisis at Caduceus Medical Center and begins learning ML basics through clinical text data.*

### Summary

The hospital's vendor NLP system has failed — a misclassified drug allergy led to a near-miss adverse event. Dr. Vasquez cancels the vendor contract and tasks the IT team with building an in-house solution. Khalil, a frontend dev with strong TypeScript skills, is assigned to build the interface.

Obi introduces Khalil to the fundamentals: what ML is, how it differs from rule-based text processing, the three learning paradigms, neural network basics, and text-as-data. Each concept is grounded in clinical examples — classifying note types, extracting medication names, predicting diagnosis codes.

> **KHALIL:** "So instead of writing regex patterns for every possible drug name format, we train a model to recognize them from examples?"

> **OBI:** "Exactly. And when a new drug name appears that we never wrote a rule for, the model can still recognize it — because it learned the *pattern* of what drug names look like, not a fixed list."

> **MEDI:** "I should note that my predecessor — the vendor system — used 2,847 hand-written rules. It achieved 73% accuracy on medication extraction. I believe we can improve upon that. Carefully."

### Lessons

| # | Title | Description | FE Bridge | 5C Variation |
|---|---|---|---|---|
| 1 | The Crisis | What ML is and why it matters for clinical text | App architecture overview | Standard |
| 2 | Text as Data | Converting clinical notes to numerical representations | `JSON.parse()` on API responses | Discovery |
| 3 | Your First Classifier | A simple note type classifier | `Array.map(x => x * weight + bias)` | Broken Code First |
| 4 | Tokens and Vocabulary | Breaking text into processable units | URL parsing (`new URL()`) | Standard |
| 5 | Forward Pass | Running a simple text classifier end to end | Promise chains / middleware | Standard (with debrief elements) |

**Inter-Lesson Hooks:**

- **L1.1 → L1.2:** Khalil's first text analysis returns gibberish — turns out the input encoding is wrong. The clinical notes are UTF-8 but his pipeline assumed ASCII, mangling every accented character and special symbol.
- **L1.2 → L1.3:** The tokenizer works, but MEDI flags a problem: two patients with identical symptoms are being classified differently. One note says "chest pain," the other says "CP." Same meaning, different tokens.
- **L1.3 → L1.4:** The model runs, but Santos notices it's ignoring abbreviations that nurses use constantly — "pt," "hx," "dx," "prn." The vocabulary is built from textbooks, not from the ward.
- **L1.4 → L1.5:** The vocabulary now handles abbreviations, but the forward pass produces wildly different confidence scores for notes that say the same thing in different word orders. Sequence matters — and the model doesn't know that yet.

**FE BRIDGE (Module-Level):** Tokenization is URL parsing. When you call `new URL('https://caduceus.org/patient/12345?tab=notes&filter=active')`, the browser breaks the URL into structured parts — protocol, hostname, pathname, search params. Tokenization does the same to text: `"Patient presents with acute chest pain"` becomes `["Patient", "presents", "with", "acute", "chest", "pain"]` — structured, indexable, processable.

### GITHUB

**Commit:** `feat(m1): initial clinical text classifier with tokenization pipeline`
**Branch:** `module-01/ml-through-text`

**Cliffhanger:** The prototype catches a drug interaction that the rule-based system missed. But Khalil notices something else: the model's confidence score is suspiciously high.

---

## MODULE 2: TOKENIZATION & PREPROCESSING

*Breaking clinical text into meaningful units and preparing it for model consumption.*

### Narrative

Clinical text is uniquely messy — abbreviations (pt, hx, dx, rx), misspellings, inconsistent formatting, copy-pasted templates, and critical information buried in free-text narratives. Santos presents the messiest records she can find.

> **SANTOS:** "This record has three different abbreviations for the same medication. 'MTX,' 'methotrex,' and 'methotrexate.' If your tokenizer treats these as different tokens, your model will miss critical drug interactions."

> **OBI:** "Your router breaks `/patients/123/records` into meaningful segments. A tokenizer does the same for 'acetaminophen-induced hepatotoxicity.'"

**Unique content:** Khalil builds a clinical text preprocessing pipeline — word tokenization, subword tokenization (BPE, WordPiece), medical vocabulary handling, text normalization for clinical abbreviations, encoding/decoding pipelines, and train/val/test splitting with stratification for rare clinical categories.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Word Tokenization | Splitting text on boundaries | `String.split()` and regex patterns |
| 2 | Subword Tokenization | BPE and WordPiece algorithms | URL route parsing (`/path/:param/segment`) |
| 3 | Medical Tokenization | Handling medical abbreviations and terminology | Domain-specific parsing rules |
| 4 | Vocabulary Building | Creating and managing token dictionaries | i18n translation key dictionaries |
| 5 | Encoding & Decoding | Converting between text and token IDs | Base64 encode/decode pipeline |

### GITHUB

**Commit:** `feat(m2): clinical text tokenization with medical vocabulary handling`
**Branch:** `module-02/tokenization`

**Cliffhanger:** The tokenizer handles typed notes perfectly. Then Santos hands them a stack of handwritten charts from the overflow ward. The OCR output is barely legible.

---

## MODULE 3: WORD EMBEDDINGS

*Learning dense vector representations of medical vocabulary.*

### Narrative

Obi demonstrates word embeddings by showing that in the trained vector space, "aspirin" is closer to "ibuprofen" than to "appendectomy."

> **OBI:** "The model learned that these words live in similar contexts — because they do. Doctors use them in similar sentences. The embedding space captures this automatically."

**Unique content:** Khalil implements one-hot encoding, Word2Vec (skip-gram and CBOW), and domain-specific medical embeddings. He visualizes word relationships in vector space and learns to use pre-trained embeddings as transfer learning for clinical text.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | One-Hot Encoding | The naive approach and its limitations | Radio buttons — only one active at a time |
| 2 | Word2Vec | Learning word relationships from context | Recommendation engines ("users also bought") |
| 3 | Medical Embeddings | Domain-specific word vectors | Theme-specific design tokens |
| 4 | Embedding Visualization | Exploring word relationships in vector space | 2D scatter plots with D3.js |
| 5 | Transfer Embeddings | Using pre-trained word vectors | npm packages — reusing learned representations |

### GITHUB

**Commit:** `feat(m3): medical word embeddings with Word2Vec and visualization`
**Branch:** `module-03/word-embeddings`

**Cliffhanger:** The NER system extracts entities perfectly from typed notes. Then Santos hands them a stack of handwritten charts from the overflow ward.

---

## MODULE 4: SEQUENCE MODELS

*Processing clinical text as ordered sequences where word order changes meaning.*

### Narrative

Dr. Vasquez presents a case where word order is life-or-death: "Patient denied chest pain" vs. "Patient reported chest pain."

> **VASQUEZ:** "One word changes everything. Your model needs to understand sequence, not just vocabulary."

> **SANTOS:** "And what about 'Patient denied chest pain but later reported shortness of breath'? The negation applies to one symptom but not the other. Good luck writing regex for that."

**Unique content:** Khalil implements RNNs for text, LSTMs for long clinical narratives, and bidirectional models that read text in both directions. He builds a clinical narrative parser that extracts structured information from free-text notes.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Why Sequences Matter | Word order changes meaning in clinical text | Array order matters — React list rendering |
| 2 | RNNs for Text | Processing text word by word | `Array.reduce()` — accumulating state |
| 3 | LSTMs for Documents | Handling long clinical narratives | Session storage with selective persistence |
| 4 | Bidirectional Models | Reading text in both directions | Doubly-linked list traversal |
| 5 | Clinical Narrative Parsing | Extracting structured info from narratives | Form parsing from unstructured input |

### GITHUB

**Commit:** `feat(m4): LSTM sequence models for clinical narrative parsing`
**Branch:** `module-04/sequence-models`

**Cliffhanger:** The sequence model parses a clinical narrative and flags an unusual phrase: "symptom onset correlates with ward transfer." Four patients. Same ward. Same timeline.

---

## MODULE 5: ATTENTION MECHANISMS

*Teaching models to focus on what matters in medical text.*

### Narrative

Obi draws the attention diagram on the whiteboard:

> **OBI:** "When you read 'The patient was prescribed methotrexate for rheumatoid arthritis,' your brain automatically connects 'methotrexate' to 'arthritis.' Attention teaches the model to make that same connection."

**Unique content:** Khalil implements self-attention, multi-head attention, and attention visualization. He builds a clinical attention system that highlights medically relevant terms — drug-condition pairs, dosage-frequency relationships, and temporal markers.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | The Attention Problem | Why not all words are equally important | CSS `:focus` and `tabIndex` — directing attention |
| 2 | Self-Attention | Each word attending to every other word | `scrollIntoView()` — programmatic focus |
| 3 | Multi-Head Attention | Attending to multiple aspects simultaneously | Multiple event listeners on one element |
| 4 | Attention Visualization | Seeing what the model focuses on | DevTools highlighting of selected elements |
| 5 | Clinical Attention | Focusing on medically relevant terms | Search result highlighting |

**FE BRIDGE (Module-Level):** Attention is CSS `:focus`. When reading a clinical note, certain words demand attention — drug names, dosages, negation cues ("no", "denies", "without"). The attention mechanism learns to dynamically "focus" on these critical tokens, just as CSS `:focus` highlights the currently active form element.

### GITHUB

**Commit:** `feat(m5): attention mechanisms with clinical text visualization`
**Branch:** `module-05/attention`

**Cliffhanger:** MEDI processes its thousandth patient record and flags a cluster: twelve patients in Ward C share an unusual symptom pattern.

---

## MODULE 6: TRANSFORMERS & BERT

*The architecture that changed NLP — bidirectional understanding of clinical text.*

### Narrative

Obi introduces the transformer architecture:

> **OBI:** "Before transformers, language models read text like a scroll — left to right. BERT reads like a human — it looks at the whole sentence at once and understands each word in the context of all the others."

**AI-Wrong Moment:** MEDI misinterprets temporal context — it flags "History of Type 2 diabetes, resolved after bariatric surgery" as an active condition. The model lacks explicit temporal reasoning.

> **VASQUEZ:** "Your system just flagged a resolved condition as active. In clinical terms, that could mean unnecessary treatment. Fix it."

**Unique content:** Khalil implements the transformer architecture from first principles — scaled dot-product attention, multi-head attention, positional encoding, and the encoder stack. He fine-tunes a pre-trained BERT model for clinical text classification and learns negation detection and temporal reasoning to address the AI-wrong moment.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | From RNN to Transformer | Why self-attention replaced recurrence | React class components to hooks — paradigm shift |
| 2 | Transformer Architecture | Encoder stack with attention and feedforward | React virtual DOM — diffing and reconciliation |
| 3 | Positional Encoding | Injecting word order into attention | CSS `order` property and `z-index` stacking |
| 4 | BERT | Bidirectional understanding of text | Doubly-linked list — forward and backward traversal |
| 5 | Fine-Tuning BERT | Adapting pre-trained transformers to clinical text | Customizing a component library's theme |

**FE BRIDGES (Module-Level):**

- **Transformer = React virtual DOM:** The transformer processes input, computes attention (which parts relate to which), and produces an output representation. React's vDOM processes the component tree, computes diffs (which parts changed), and produces an updated DOM. Both are reconciliation engines that compare current state to desired state.
- **BERT = doubly-linked list:** A unidirectional model (like GPT) reads tokens left-to-right, like a singly-linked list — each node knows only what came before. BERT is bidirectional, like a doubly-linked list — each token has context from both directions. This bidirectional context is why BERT excels at understanding (classification, NER) rather than generation.

### GITHUB

**Commit:** `feat(m6): transformer architecture with BERT fine-tuning for clinical NLP`
**Branch:** `module-06/transformers-bert`

**Cliffhanger:** Diagnostic One misidentifies a drug interaction because training data used brand names and the chart uses generics.

---

## MODULE 7: NAMED ENTITY RECOGNITION

*Identifying and classifying medical entities in clinical text.*

### Narrative

The midpoint breakthrough. Dr. Vasquez needs structured information extracted from unstructured notes — medication names, dosages, conditions, procedures, anatomical locations.

> **VASQUEZ:** "I need to know, from a 3-page discharge summary, what medications the patient is on, what conditions were diagnosed, and what procedures were performed. I need it in 10 seconds, not 10 minutes."

Diagnostic One's NER system, running on a batch of previously reviewed records, flags a drug interaction between two medications in a patient's chart. Santos checks — three doctors reviewed this chart and none caught it.

> **VASQUEZ:** "This is why we are building this. Right here. This moment."

> **KHALIL:** (nodding thoughtfully) "And if it had flagged incorrectly? What does a false positive cost in a medical setting?"

**Santos Advocacy Scene:** Midway through testing, Obi proposes a model update that improves overall NER accuracy by 3.1%. Santos runs it against her ward's data and blocks the deployment.

> **SANTOS:** "Your new version is 3% more accurate overall, but it's worse on elderly patients. Medication extraction dropped 8% for patients over 75. My ward is 60% elderly. They're on more medications, with more complex interactions, and your 'improvement' makes them less safe. Roll it back."

> **OBI:** "But the aggregate numbers —"

> **SANTOS:** "Aggregate numbers don't take the wrong pill, Obi."

The team learns about subgroup performance analysis — evaluating model accuracy across patient demographics, not just in aggregate. It is a concept Santos understood before they had a name for it: the patients most at risk are often the ones the model serves worst.

**Unique content:** Khalil implements BIO tagging (Beginning, Inside, Outside), builds a sequence labeling model for medical entity extraction, handles relationship extraction between entities, and addresses the unique challenges of medical NER — drug names that are common words, nested entities, discontinuous mentions.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | NER Fundamentals | What entities are and why they matter | DOM element type identification |
| 2 | BIO Tagging | Labeling entity boundaries | HTML tag open/close matching |
| 3 | Medical NER | Recognizing drugs, conditions, procedures | Syntax highlighting in code editors |
| 4 | Relationship Extraction | Connecting entities to each other | Graph data structures / foreign keys |
| 5 | The Missed Interaction | NER catches what humans missed | Linter catching an error before production |

### GITHUB

**Commit:** `feat(m7): medical NER with BIO tagging and relationship extraction`
**Branch:** `module-07/named-entity-recognition`

**Cliffhanger:** Diagnostic One confidently diagnoses a patient. Santos overrides it based on instinct.

---

## MODULE 8: TEXT CLASSIFICATION & TRIAGE

*Categorizing and prioritizing clinical documents automatically.*

### Narrative

> **VASQUEZ:** "I need incoming records triaged automatically. Critical cases cannot wait in a queue behind routine checkups."

**AI-Wrong Moment:** MEDI generates a clinical summary that is linguistically perfect but factually incorrect — it hallucinates a medication dosage that appears nowhere in the source notes. The summary reads fluently, making the error harder to catch.

> **SANTOS:** "This is the dangerous part. The output *sounds* right. If I were not checking against the source notes, I might have missed it. We need grounding."

**Unique content:** Khalil builds multi-label text classification for clinical documents, urgency scoring for record triage, and confidence calibration so the system knows when it is uncertain. He implements hallucination detection by cross-referencing generated text against source documents.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Classification Basics | Assigning labels to documents | Email filtering (spam vs inbox) |
| 2 | Multi-Label Classification | Documents with multiple categories | Tag system with multiple selections |
| 3 | Urgency Scoring | Prioritizing records by clinical urgency | Priority queues in task management |
| 4 | Confidence Calibration | Knowing when the model is uncertain | Loading states and skeleton screens |
| 5 | Triage Pipeline | End-to-end document triage system | Request routing middleware |

### GITHUB

**Commit:** `feat(m8): text classification with urgency scoring and confidence calibration`
**Branch:** `module-08/text-classification`

**Cliffhanger:** The model confidently associates symptoms with a common condition, missing a rare disease Santos catches.

---

## MODULE 9: QUESTION ANSWERING & RAG

*Enabling natural language queries over clinical data with retrieval-augmented generation.*

### Narrative

An unconscious patient arrives in the ER with no accessible medical history. Records exist — but in a different hospital system, in a different format, partially in another language. The attending needs one answer before making a treatment decision: "Has this patient ever had an allergic reaction to penicillin?" In the old system, someone would call Meridian General, wait on hold, get transferred, and pray the night-shift clerk could pull the right file. The attending does not have that time. Diagnostic One needs to reach across systems, normalize formats, handle Spanish-language clinical notes from a previous hospital stay, and return a grounded answer with citations — in seconds, not minutes.

> **OBI:** "This is what it was all for. Natural language access to clinical knowledge — across systems, across formats, across languages."

> **SANTOS:** "The Meridian records use a completely different coding system. And half the allergy notes are free-text in Spanish from when the patient lived in Puerto Rico. If we can't normalize this, we're guessing."

> **KHALIL:** "I built Meridian's records UI. I know their data format. The allergy field is buried in a free-text 'notes' column — no one ever structured it."

**Unique content:** Khalil builds a RAG pipeline for clinical question answering — extractive QA (finding answers within documents), reading comprehension (understanding context), vector search for document retrieval, and knowledge grounding to ensure answers are supported by evidence. He implements citation linking so every generated answer points back to its source documents. The module's crisis scenario drives three additional technical challenges: cross-system retrieval (querying heterogeneous EHR formats), format normalization (mapping between coding systems), and multilingual handling (extracting medical facts from Spanish-language clinical notes).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Extractive QA | Finding answers within documents | `Ctrl+F` — finding text in a page |
| 2 | Reading Comprehension | Understanding context to answer questions | GraphQL resolvers — query-specific data fetching |
| 3 | RAG Architecture | Retrieval-augmented generation pipeline | React Server Components — server-fetched data in client UI |
| 4 | Knowledge Grounding | Ensuring answers are supported by evidence | Hyperlinks — every claim has a source URL |
| 5 | Clinical Queries | Doctors asking questions in natural language | Search bar with NLU |

**FE BRIDGE (Module-Level):** RAG is React Server Components. In RSC, the server fetches data from databases and APIs, then renders components with that data — the client gets pre-hydrated content grounded in real data sources. RAG does the same: the retrieval step fetches relevant documents (like a DB query), and the LLM generates a response grounded in those retrieved documents (like server rendering). Both patterns connect a generation engine to authoritative data sources.

### GITHUB

**Commit:** `feat(m9): RAG pipeline for clinical question answering with citations`
**Branch:** `module-09/question-answering-rag`

**Cliffhanger:** The RAG system pulls a research paper from 2019 that describes the exact symptom cluster in Ward C. It is a disease they thought was eradicated.

---

## MODULE 10: PRODUCTION NLP & PRIVACY

*Deploying Diagnostic One for real clinical use with privacy and fairness.*

### Narrative

Khalil leads the ethics and deployment review:

> **KHALIL:** "Before this goes live, I need answers. What happens when it is wrong? Who is liable? How do we ensure it does not perform worse for certain patient populations?"

> **VASQUEZ:** "Your model performs 12% worse on records written in non-standard English. That means patients from certain demographics get worse care. Is that acceptable?"

The team addresses each concern systematically. Santos builds a human-in-the-loop system where Diagnostic One surfaces findings but a clinician always confirms.

**Unique content:** Khalil implements model serving APIs, latency optimization for clinical-grade response times, HIPAA-compliant data handling, bias auditing across patient demographics, and human-in-the-loop confirmation workflows.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Model Serving | APIs for real-time NLP inference | REST API design with Express/Fastify |
| 2 | Latency Optimization | Keeping response times clinical-grade | Core Web Vitals optimization |
| 3 | Privacy & HIPAA | Handling sensitive medical data | Data encryption, secure storage, CSP headers |
| 4 | Bias Auditing | Ensuring fair performance across demographics | Accessibility auditing (a11y testing) |
| 5 | Human-in-the-Loop | Keeping clinicians in the decision loop | Confirmation dialogs — human approval gates |

### GITHUB

**Commit:** `feat(m10): production NLP with HIPAA compliance and bias auditing`
**Branch:** `module-10/production-privacy`

**Cliffhanger:** Dr. Vasquez deploys Diagnostic One to tablets across all wards. Within an hour, it flags a critical case — in the pediatric wing.

---

## MODULE 11: CAPSTONE — DIAGNOSTIC ONE

*Full deployment of the clinical text assistant with safety guardrails.*

### Narrative

Diagnostic One goes live across Signal Ward. Everything built across 10 modules comes together: the tokenization pipeline, the word embeddings, the sequence models, the attention mechanisms, the transformer-based understanding layer, the NER system, the text classifier, the RAG question-answering pipeline, and the production deployment with privacy and fairness guardrails.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | System Architecture | Designing the complete Diagnostic One system | Full-stack architecture review |
| 2 | Integration | Connecting to hospital information systems | Third-party API integration |
| 3 | Testing & Validation | Clinical validation against expert annotations | End-to-end test suites |
| 4 | Documentation & Training | Preparing staff to use the system | User documentation and onboarding |
| 5 | Go Live | Deploying Diagnostic One to Signal Ward | Production deployment and monitoring |

### CONSEQUENCE

Diagnostic One goes live. The first week produces real results: note categorization accuracy at 94%, medication extraction at 91%, and a 40% reduction in time physicians spend searching through patient records.

Then, on day 9, MEDI flags an urgent alert — a potential drug interaction between two medications prescribed by different specialists who did not know about each other's orders.

> **MEDI:** "Alert: potential interaction detected between methotrexate (prescribed by Rheumatology, 15mg weekly) and trimethoprim (prescribed by Primary Care, 160mg twice daily). Interaction severity: moderate to severe. Confidence: 87%. Recommend clinical review."

Dr. Vasquez reviews it. She pulls up both prescribing notes, checks the patient's renal function panel, and reads the interaction literature.

> **VASQUEZ:** "False positive. The medications interact in theory, but at these dosages and with this patient's renal function, the risk is negligible. Good catch, though — better a false alarm than a missed one."

Khalil nods, relieved but thoughtful.

> **KHALIL:** "So the system works, but it is not perfect."

> **VASQUEZ:** "No system is perfect, Khalil. The question is not whether it makes mistakes. The question is whether it makes fewer mistakes than the alternative — and whether we can catch the mistakes it does make. Diagnostic One does both."

> **MEDI:** "I should note that my false positive rate on drug interactions is currently 12.3%. I am working to reduce this. I would rather flag 100 false positives than miss one true interaction. I hope that is acceptable."

Dr. Vasquez looks at the screen for a long moment.

> **VASQUEZ:** "It is. Keep watching, MEDI."

The closing scene: a new patient record arrives. Diagnostic One processes it in 0.3 seconds, identifies a potential condition the admitting doctor had not considered, flags it with supporting evidence from three prior records and two journal articles. The attending physician reviews the flag, orders additional tests, and confirms the diagnosis. Santos sends a message to the team: "System caught another one. Patient is doing well."

### GITHUB

**Commit:** `feat(m11): Diagnostic One v1.0 — full clinical NLP system with safety guardrails`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/diagnostic-one-clinical-nlp`

---

### Character Arcs

**Khalil Mensah — From Skeptic to Champion**

Khalil's arc traces a principled developer who starts deeply skeptical of ML in healthcare and gradually becomes Diagnostic One's strongest advocate — without ever losing his ethical rigor.

- **M3 (Word Embeddings):** Khalil argues for keeping a rule-based backup system after watching the model struggle with edge cases in clinical abbreviations. "If this fails on 'MTX' versus 'methotrexate,' what else is it missing?"
- **M5 (Attention Mechanisms):** Khalil quietly begins using the model's output to double-check his own manual review of patient records. He does not tell anyone, but Santos notices.
- **M7 (Named Entity Recognition):** Khalil is vindicated when the model confidently misdiagnoses a patient and Santos catches the error. But he also recognizes the value of the data the model surfaced during its analysis — information no human had connected across three separate charts.
- **M11 (Capstone):** Khalil stands before the hospital administration board and defends Diagnostic One. "This system is not perfect. No system is. But it catches things we miss, it never gets tired, and it always shows its work. The question is not whether to trust it — it is whether we can afford not to use it."

---

## Theme-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Chart Note | Patient medical record entry | A single training example — the model's input format, structured or unstructured |
| Intake | New record arriving in the system | Input data |
| Triage Score | Urgency ranking determining treatment order | The model's confidence ranking, deciding which cases need human review vs. auto-processing |
| Diagnosis | Identified condition or finding | Model prediction |
| Differential | List of possible conditions ranked by likelihood | Both the diagnostic differential *and* the gradient/loss differential — the gap between prediction and truth that drives learning |
| Rounds | Regular review of active cases across the ward | A training epoch — the model "makes rounds" through the entire dataset, reviewing every case once |
| Consult | Requesting specialist input | Ensemble model query |
| Vital Signs | Patient health metrics (heart rate, BP, O2 sat) | Model health metrics — loss, accuracy, latency, throughput. If the vitals crash, the model is dying |
| Discharge Summary | Final patient record summarizing stay and outcome | Model output — the inference result, a structured summary of what the model concluded and why |
| Adverse Event | Negative patient outcome | Misclassification with consequences |
| Clinical Trial | Testing new treatment | A/B testing a model version |
| Chart Review | Manual record examination | Manual data annotation |
| STAT | Urgent / immediate priority | High-confidence critical prediction |
| Contraindication | Medical incompatibility | Constraint violation |
| Prognosis | Predicted outcome | Model forecast |
| Second Opinion | Additional expert review | Ensemble verification |
