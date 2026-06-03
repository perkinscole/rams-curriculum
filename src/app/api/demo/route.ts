import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, queryOne, DEFAULT_SUBJECTS, DEFAULT_GRADES } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

interface SampleDoc {
  subject_area: string;
  unit_title: string;
  grade: string;
  unit_summary: string;
  status: 'draft' | 'submitted' | 'approved' | 'revision_requested';
  stage1: object;
  stage2: object;
  stage3: object;
  complete: [boolean, boolean, boolean];
  teacher_email: string;
}

const SAMPLE_TEACHERS = [
  { name: 'Aisha Williams', email: 'aisha.williams@demo.curriclio.app', department: 'English Language Arts' },
  { name: 'Marcus Garcia', email: 'marcus.garcia@demo.curriclio.app', department: 'Social Studies' },
  { name: 'Riya Patel', email: 'riya.patel@demo.curriclio.app', department: 'Mathematics' },
  { name: 'Jane Smith', email: 'jane.smith@demo.curriclio.app', department: 'Science' },
];

const SAMPLE_DOCS: SampleDoc[] = [
  // ====================================================================
  // GRADE 6 ELA — Heroes Across Cultures
  // ====================================================================
  {
    subject_area: 'English Language Arts', grade: '6',
    unit_title: 'Heroes Across Cultures: The Hero\'s Journey',
    unit_summary: 'A 6-week unit in which students analyze the hero\'s journey pattern across three texts from different cultural traditions, then craft an original hero narrative of their own.',
    status: 'approved',
    teacher_email: 'aisha.williams@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'CCSS.ELA-LITERACY.RL.6.1, RL.6.2, RL.6.3; W.6.3; SL.6.1; L.6.1',
      vog_outcomes: 'Communication; Cultural Awareness',
      transfer: 'Identify the hero\'s journey pattern in independently chosen films, novels, or video games.',
      enduring_understandings: 'Story patterns recur across cultures because they reflect shared human experiences. Heroes are defined by their choices under pressure, not by powers granted to them.',
      essential_questions: 'What makes a character a hero? How do stories from different cultures use the same patterns to teach different lessons? Whose stories get told and whose get left out?',
      knowledge: 'Stages of the hero\'s journey (call, refusal, mentor, threshold, trials, transformation, return); archetypes (mentor, shadow, trickster); narrative structure (exposition, rising action, climax, falling action, resolution).',
      skills: 'Annotate texts for plot structure; cite specific textual evidence (RL.6.1); compare and contrast stories from multiple cultures; draft, revise, and edit narrative writing using technique and descriptive detail (W.6.3).',
    },
    stage2: {
      transfer_tasks: 'Write a 1,200-1,500 word original hero narrative that demonstrates at least 5 stages of the hero\'s journey, drawing on cultural traditions of the student\'s choice.',
      formative_assessments: 'Daily reading-response journal entries (3 per week); two formal annotation checks; one Socratic seminar on cross-cultural patterns (rubric-scored on SL.6.1).',
      summative_assessments: 'Hero narrative (75%) graded on the 6-trait rubric. Comparative analytical paragraph (25%) comparing two heroes from different cultural traditions using RL.6.2 and RL.6.3 evidence.',
      other_evidence: 'Peer-edit logs from two structured revision workshops; final reflection on growth as a reader and writer.',
    },
    stage3: {
      learning_events: 'Week 1: Intro to the hero\'s journey + close reading of "The Lightning Thief" excerpts. Week 2-3: Shared reading + journal work. Week 4: Comparative reading from Indigenous and West African oral traditions. Week 5: Narrative writing workshop. Week 6: Peer revision, publishing, Socratic seminar.',
      resources_materials: 'Texts: "The Lightning Thief" (Riordan); excerpts from "When Stars Are Scattered" (Mohamed/Jamieson); selected stories from "African Folktales" (Roger Abrahams); audiobook access for all texts. Writing notebooks; graphic organizer for narrative arc; revision checklist.',
      differentiation: 'Audiobooks available for all texts. Tiered narrative prompts (3 complexity levels). Sentence frames for ML learners writing analytical paragraph. Choice in cultural tradition for final narrative supports student identity and engagement. Extension: students who finish early write a second narrative subverting an archetype.',
    },
  },

  // ====================================================================
  // GRADE 7 ELA — Argument & Evidence
  // ====================================================================
  {
    subject_area: 'English Language Arts', grade: '7',
    unit_title: 'Make Your Case: Argument Writing for a Real Audience',
    unit_summary: 'Students learn to construct evidence-based arguments and write a persuasive op-ed on a school or community issue, ultimately submitting to the local newspaper.',
    status: 'approved',
    teacher_email: 'aisha.williams@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'CCSS.ELA-LITERACY.W.7.1, W.7.2; RI.7.1; SL.7.1; L.7.1',
      vog_outcomes: 'Critical Thinking; Communication; Global Citizenship',
      transfer: 'Identify unsupported claims in news articles, social media, and ads, and articulate what evidence would be needed to strengthen them.',
      enduring_understandings: 'Strong arguments rest on credible evidence and acknowledge counterarguments. Audience shapes argument: what convinces one reader may alienate another.',
      essential_questions: 'What makes an argument convincing? When is an emotional appeal honest, and when is it manipulation? How do you change someone\'s mind without making them defensive?',
      knowledge: 'Argument structure (claim, reasons, evidence, counterargument, rebuttal); types of evidence (statistical, anecdotal, expert testimony); logical fallacies (ad hominem, straw man, false dilemma); rhetorical appeals (ethos, pathos, logos).',
      skills: 'Identify credible sources (RI.7.1); cite textual evidence; draft and revise argumentative writing (W.7.1); engage in collaborative discussion with diverse perspectives (SL.7.1); revise for clarity and concision.',
    },
    stage2: {
      transfer_tasks: 'Write a 600-800 word op-ed on a school or community issue chosen by the student, suitable for submission to the local paper. Includes at least 3 sources, one counterargument, and a rebuttal.',
      formative_assessments: 'Claim-evidence-reasoning worksheets; partner counterargument workshops; two revision rounds with rubric-aligned peer review.',
      summative_assessments: 'Final op-ed (60%); in-class Socratic seminar on a current issue (25%); revision portfolio showing development across 3 drafts (15%).',
      other_evidence: 'Reading response logs on 4 model op-eds; self-assessment using the argument rubric; exit tickets identifying fallacies.',
    },
    stage3: {
      learning_events: 'Week 1: Anatomy of an argument + analyze model op-eds. Week 2: Source evaluation workshop. Week 3: Counterargument and rebuttal mini-lessons. Week 4-5: Drafting and peer revision cycles. Week 6: Polished submission + class showcase.',
      resources_materials: 'NYT Learning Network student opinion archive; CommonLit fallacies module; library access for source research; revision rubric; teacher-curated current-events folder updated weekly.',
      differentiation: 'Sentence stems for thesis construction; graphic organizers for argument structure; choice in topic supports engagement; extended deadlines available; advanced extension: students workshop a peer\'s argument with audio commentary.',
    },
  },

  // ====================================================================
  // GRADE 6 MATH — Ratios and Rates
  // ====================================================================
  {
    subject_area: 'Mathematics', grade: '6',
    unit_title: 'Ratios, Rates, and the Mathematics of Comparison',
    unit_summary: 'Students develop ratio and rate reasoning through real-world contexts (recipes, shopping, sports stats) and apply it to multi-step problems including unit pricing and percent.',
    status: 'approved',
    teacher_email: 'riya.patel@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'CCSS.MATH.CONTENT.6.RP.A.1, 6.RP.A.3; 6.NS.A.1',
      vog_outcomes: 'Quantitative Reasoning; Problem Solving',
      transfer: 'Use ratio reasoning to evaluate everyday comparisons: which deal at the grocery store is actually better, whether a recipe scales correctly, whether two sports stats are really comparable.',
      enduring_understandings: 'Ratios express multiplicative relationships, not additive ones. A unit rate puts any ratio on a common basis for fair comparison.',
      essential_questions: 'When is a ratio more useful than a difference? What does it mean for two ratios to be equivalent? How can you tell which "deal" is really better?',
      knowledge: 'Ratio language (a to b, a:b, a/b); equivalent ratios; unit rates; using tables and double-number-line diagrams; the relationship between fractions and ratios.',
      skills: 'Set up ratios from word problems; find unit rates; use tables and diagrams to find equivalent ratios; solve unit-pricing problems; convert between fractions, decimals, and percents.',
    },
    stage2: {
      transfer_tasks: 'Plan a class breakfast on a $50 budget. Students must scale 3 recipes from a serving size of 4 to a serving size of 28, compute unit prices to choose between brands, and present their plan with justification.',
      formative_assessments: 'Daily warm-up problems; partner whiteboard work on equivalent ratios; quick checks after each lesson.',
      summative_assessments: 'Unit test covering 6.RP.A.1 and 6.RP.A.3 with both procedural and conceptual items; breakfast budget project graded on a 4-point rubric.',
      other_evidence: 'Math journal entries explaining strategies; student error analysis of common mistakes.',
    },
    stage3: {
      learning_events: 'Week 1: Introduction with recipe scaling. Week 2: Unit rates and tables. Week 3: Double-number-line diagrams. Week 4: Percent as a special ratio. Week 5: Budget project + assessment.',
      resources_materials: 'Illustrative Mathematics Grade 6 ratio tasks; Desmos activities (Polygraph Ratios; Stacking Cups); grocery store flyers for unit-pricing context; manipulatives (color tiles for ratio modeling).',
      differentiation: 'Manipulatives available for any student. Sentence frames for explaining reasoning verbally. Extension problems for students who finish early (e.g., compound ratios, ratio chains). Strategic partnering for collaborative work.',
    },
  },

  // ====================================================================
  // GRADE 8 MATH — Functions and Linear Relationships
  // ====================================================================
  {
    subject_area: 'Mathematics', grade: '8',
    unit_title: 'Functions and Linear Relationships',
    unit_summary: 'Students develop a robust understanding of functions as inputs-to-outputs, focusing on linear functions and their representations (equations, tables, graphs, verbal descriptions).',
    status: 'approved',
    teacher_email: 'riya.patel@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'CCSS.MATH.CONTENT.8.F.A.1, 8.F.B.4; 8.EE.C.7',
      vog_outcomes: 'Quantitative Reasoning; Problem Solving',
      transfer: 'Take any real-world situation involving steady change (cell phone plans, savings accounts, fuel consumption) and represent it as a function. Choose the most useful representation for the audience.',
      enduring_understandings: 'A function is a rule that assigns exactly one output to each input. Linear functions model situations with constant rate of change. The same function can be represented in different ways, each useful for a different purpose.',
      essential_questions: 'What is a function, really, and why do we need the idea? Why do we sometimes prefer a graph and other times an equation? How do you know when a relationship is linear from a table alone?',
      knowledge: 'Definition of function; domain and range; slope as rate of change; y-intercept as initial value; the form y = mx + b; solving linear equations in one variable.',
      skills: 'Identify functions from various representations; construct linear function from a context, table, or graph; interpret slope and y-intercept in context; solve linear equations including those requiring distributive property and combining like terms.',
    },
    stage2: {
      transfer_tasks: 'Comparing cell phone plans: students collect 3 real plan structures from local carriers, model each as a linear function, graph them on the same axes, and write a recommendation memo for a fictional family based on usage patterns.',
      formative_assessments: 'Daily checks for understanding; weekly Desmos activity completion; partner problem-solving on whiteboards.',
      summative_assessments: 'Unit exam covering 8.F.A.1, 8.F.B.4, and 8.EE.C.7; cell phone plan project (memo + presentation).',
      other_evidence: 'Math journal entries; exit tickets on slope interpretation; peer feedback on project drafts.',
    },
    stage3: {
      learning_events: 'Week 1: Function machines and definition. Week 2: Linear functions from tables and graphs. Week 3: Slope and y-intercept in context. Week 4: Solving linear equations. Week 5: Cell phone plan project + assessment.',
      resources_materials: 'Desmos Function Carnival; Illustrative Math 8th grade tasks; graphing calculators; printed graph paper; actual cell plan info from local carriers.',
      differentiation: 'Color-coded foldables for vocabulary. Visual graph-to-equation matching activities for ML learners. Extension: piecewise functions, systems of equations. Strategic groupings for the project. Audio explanations of slope concepts available.',
    },
  },

  // ====================================================================
  // GRADE 7 MATH — Proportional Relationships (REVISION REQUESTED)
  // ====================================================================
  {
    subject_area: 'Mathematics', grade: '7',
    unit_title: 'Proportional Relationships in the Real World',
    unit_summary: 'Students explore proportional relationships through scale drawings, similar figures, and percent problems including tax, tip, discount, and markup.',
    status: 'revision_requested',
    teacher_email: 'riya.patel@demo.curriclio.app',
    complete: [true, true, false],
    stage1: {
      learning_standards: 'CCSS.MATH.CONTENT.7.RP.A.2; 7.NS.A.3; 7.G.B.4',
      vog_outcomes: 'Quantitative Reasoning',
      transfer: 'Identify proportional relationships in scale drawings, maps, and real-world percent contexts; reason with constant of proportionality.',
      enduring_understandings: 'Proportional relationships describe situations where one quantity changes at a constant multiplicative rate with another.',
      essential_questions: 'How do we know when two quantities are proportional? When does a non-proportional pattern look proportional at first?',
      knowledge: 'Constant of proportionality; proportional vs non-proportional relationships; percent change; scale factor.',
      skills: 'Identify proportional relationships from tables, graphs, and equations; solve percent problems including tax, tip, discount; work with scale drawings.',
    },
    stage2: {
      transfer_tasks: 'Plan a class trip on a budget: compute total cost with tax and tip; use a scale map to determine driving distance.',
      formative_assessments: 'Daily warm-ups; weekly quizzes on proportion setup.',
      summative_assessments: 'Unit test; class trip budget project.',
      other_evidence: '',
    },
    stage3: { learning_events: 'Currently being revised based on admin feedback — needs more cultural relevance in word problems and a wider range of percent contexts.', resources_materials: '', differentiation: '' },
  },

  // ====================================================================
  // GRADE 6 SCIENCE — Atoms, Molecules, and Phase Changes
  // ====================================================================
  {
    subject_area: 'Science', grade: '6',
    unit_title: 'Atoms, Molecules, and the Behavior of Matter',
    unit_summary: 'Students build models of atomic and molecular structure and use them to explain everyday phenomena: why ice melts, why steam rises, why some materials dissolve and others don\'t.',
    status: 'approved',
    teacher_email: 'jane.smith@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'NGSS MS-PS1-1, MS-PS1-4; MA 6.MS-PS1-1, 6.MS-PS1-4',
      vog_outcomes: 'Scientific Inquiry; Systems Thinking',
      transfer: 'Predict and explain phase changes in unfamiliar situations using a particle model. Explain why heating, cooling, and pressure affect matter the way they do.',
      enduring_understandings: 'All matter is made of particles in motion. The arrangement and energy of particles determine the state and properties of matter.',
      essential_questions: 'What makes ice, water, and steam different — when they\'re all made of the same stuff? Why do some things dissolve in water but oil doesn\'t? How can scientists "see" something as small as an atom?',
      knowledge: 'Atomic structure (nucleus, electrons); the difference between atoms, molecules, and compounds; states of matter (solid, liquid, gas) at the particle level; conservation of mass.',
      skills: 'Develop and use models (MS-PS1-1); analyze and interpret data from controlled investigations; construct evidence-based explanations of phenomena; communicate scientific reasoning in writing and discussion.',
    },
    stage2: {
      transfer_tasks: 'Design and run a controlled investigation on a phase change of the student\'s choosing (e.g., melting butter, evaporating saltwater, freezing oil). Write a lab report explaining results using a particle model.',
      formative_assessments: 'Whiteboard particle model sketches; daily exit tickets on phase change predictions; partner critique of explanations.',
      summative_assessments: 'Phase change investigation lab report (60%); model-based assessment where students apply particle models to novel scenarios (40%).',
      other_evidence: 'Lab notebook entries showing model revisions; class discussion participation; peer review feedback.',
    },
    stage3: {
      learning_events: 'Week 1: What\'s smaller than small? Intro to atoms with simulations. Week 2: Building molecular models with kits. Week 3: Particle motion and phase changes. Week 4: Investigations into solutions and conservation of mass. Week 5: Lab report drafting and model-based assessment.',
      resources_materials: 'PhET States of Matter simulation; molecular model kits; hot plates; balances; thermometers; food coloring; oil/water/salt for solubility demos.',
      differentiation: 'Visual molecular model kits accessible to all learners. Sentence stems for scientific explanations. Audio descriptions of simulation phenomena. Extension: students investigate gas laws qualitatively. Lab partners assigned with attention to language support.',
    },
  },

  // ====================================================================
  // GRADE 7 SCIENCE — Forces, Motion, and Engineering Design
  // ====================================================================
  {
    subject_area: 'Science', grade: '7',
    unit_title: 'Forces, Motion, and Engineering Design',
    unit_summary: 'Students investigate Newton\'s laws through hands-on experiments and apply them in an engineering design challenge: build a vehicle that travels a target distance using a single rubber band.',
    status: 'approved',
    teacher_email: 'jane.smith@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'NGSS MS-PS2-1, MS-PS2-2; MS-ETS1-1, MS-ETS1-4; MA 7.MS-PS2-1, 7.MS-PS2-3',
      vog_outcomes: 'Scientific Inquiry; Problem Solving; Critical Thinking',
      transfer: 'Predict the motion of real-world objects (a soccer ball, a skateboarder, a car) using a force analysis. Critique a proposed engineering design and recommend improvements based on Newton\'s laws.',
      enduring_understandings: 'Forces act in pairs (Newton\'s 3rd law) and cause changes in motion proportional to the net force (Newton\'s 2nd law). Engineering design balances tradeoffs across competing constraints.',
      essential_questions: 'Why do some objects keep moving and others stop? When two things push on each other, who pushes harder? How do you know your design improvement will actually work before you build it?',
      knowledge: 'Newton\'s three laws of motion; friction, gravity, normal force; balanced vs unbalanced forces; engineering design cycle (define, develop, optimize).',
      skills: 'Conduct controlled experiments; collect and graph quantitative data; identify and account for sources of error; iterate on a design based on test data; communicate findings using diagrams and data.',
    },
    stage2: {
      transfer_tasks: 'Rubber band car engineering design challenge: students design, build, and iterate on a vehicle that travels as close as possible to 5 meters using one rubber band as the only energy source. Final report includes 2 design iterations with data-driven justification for changes.',
      formative_assessments: 'Lab notebook checks twice per week; partner critique of force diagrams; exit tickets on Newton\'s laws.',
      summative_assessments: 'Unit exam (40%); rubber band car final report + presentation (60%) graded on engineering design rubric and clarity of physics reasoning.',
      other_evidence: 'Peer review of partner notebooks; reflection on growth as a problem-solver.',
    },
    stage3: {
      learning_events: 'Week 1: Intro to forces; force diagrams. Week 2: Newton\'s 1st and 2nd laws via labs with carts and spring scales. Week 3: Newton\'s 3rd law and friction. Week 4-5: Rubber band car design, build, test, iterate. Week 6: Final presentations and reflection.',
      resources_materials: 'PhET Forces and Motion simulation; carts, ramps, spring scales, balances, rubber bands; cardboard, dowels, wheels, axles, hot glue; graph paper; engineering design rubric.',
      differentiation: 'Engineering teams formed strategically. Visual force diagrams accessible to ML learners. Sentence frames for written analysis. Extension: students explore gear ratios. Lab notebook templates with scaffolded vs blank versions available.',
    },
  },

  // ====================================================================
  // GRADE 7 SCIENCE — Ecosystems
  // ====================================================================
  {
    subject_area: 'Science', grade: '7',
    unit_title: 'Ecosystem Dynamics: Energy, Matter, and Disturbance',
    unit_summary: 'Students model how matter and energy move through a local ecosystem (a New England pond or forest), then analyze how disturbances — natural and human-caused — ripple through the system.',
    status: 'approved',
    teacher_email: 'jane.smith@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'NGSS MS-LS2-1, MS-LS2-3, MS-ESS3-3; MA 7.MS-LS2-1, 7.MS-LS2-4',
      vog_outcomes: 'Systems Thinking; Global Citizenship; Critical Thinking',
      transfer: 'Analyze a local environmental issue (e.g., invasive species, watershed pollution, climate-driven habitat shift) by modeling its impact on the surrounding ecosystem.',
      enduring_understandings: 'Ecosystems depend on the cycling of matter and the one-way flow of energy. Stability arises from interdependence — removing one species often produces cascading effects.',
      essential_questions: 'Where does the energy in an apple actually come from? What happens when something is removed from an ecosystem? How do humans fit into the system we\'re studying?',
      knowledge: 'Producers, consumers, decomposers; food webs; the carbon and water cycles; population dynamics; resource availability and limiting factors; human impacts.',
      skills: 'Build and interpret food-web and energy-flow models (MS-LS2-3); analyze data showing population changes; construct evidence-based explanations of ecosystem dynamics; evaluate the credibility of environmental claims.',
    },
    stage2: {
      transfer_tasks: 'Local ecosystem case study: each team chooses a real New England ecosystem disturbance (e.g., emerald ash borer, salt marsh die-off, beaver re-introduction), models the affected food web, and presents the cascading effects backed by data.',
      formative_assessments: 'Food-web diagrams; weekly data analysis warm-ups; partner critique of models.',
      summative_assessments: 'Ecosystem case study report and presentation (60%); unit exam covering energy flow, matter cycling, and population dynamics (40%).',
      other_evidence: 'Field journal from a local nature walk; reflection on humans as part of ecosystems.',
    },
    stage3: {
      learning_events: 'Week 1: Field trip to local pond + observation journals. Week 2: Energy flow and food webs. Week 3: Matter cycling (carbon, water). Week 4: Limiting factors and population dynamics. Week 5: Case study work and presentations.',
      resources_materials: 'Mass Audubon educational resources; local field site (pond or wooded area); WWF educational data sets; iNaturalist app; presentation rubric.',
      differentiation: 'Visual food-web building tools (Padlet, drag-and-drop). Audio nature recordings for accessibility on field trip. Choice in case study topic supports engagement. Multilingual sources from WWF for ML learners. Extension: students model their case study quantitatively.',
    },
  },

  // ====================================================================
  // GRADE 8 SCIENCE — Heredity
  // ====================================================================
  {
    subject_area: 'Science', grade: '8',
    unit_title: 'Heredity and the Genetic Code',
    unit_summary: 'Students explore how traits are passed from parents to offspring through DNA, model genetic crosses, and grapple with the ethical questions raised by modern genetic technology.',
    status: 'approved',
    teacher_email: 'jane.smith@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'NGSS MS-LS3-1, MS-LS4-4; MA 8.MS-LS3-1, 8.MS-LS4-4',
      vog_outcomes: 'Scientific Inquiry; Critical Thinking; Global Citizenship',
      transfer: 'Use a heredity model to predict and explain trait inheritance in unfamiliar organisms. Evaluate a news article about genetic technology (CRISPR, gene therapy, GMOs) for scientific accuracy and ethical implications.',
      enduring_understandings: 'DNA carries instructions for protein production; mutations to those instructions can be harmful, beneficial, or neutral. Variation among offspring drives natural selection.',
      essential_questions: 'How can two children of the same parents look so different? What does a "mutation" actually do at the molecular level? Should we use genetic technology to change human traits — and who decides?',
      knowledge: 'DNA, genes, chromosomes; dominant and recessive alleles; Punnett squares; mutations; the connection between mutations, proteins, and traits; genetic variation as the raw material of evolution.',
      skills: 'Use Punnett squares to predict offspring traits; analyze pedigree charts; develop models of inheritance (MS-LS3-1); construct evidence-based arguments about the role of variation in survival (MS-LS4-4); critically evaluate science journalism.',
    },
    stage2: {
      transfer_tasks: 'CRISPR position paper: students research a real or proposed genetic technology application (sickle cell therapy, mosquito gene drives, designer plants), then write a 750-word position paper that explains the science accurately and takes a defensible ethical stance.',
      formative_assessments: 'Punnett square practice sets; partner pedigree analyses; exit tickets on DNA-protein-trait connection.',
      summative_assessments: 'CRISPR position paper (60%); unit exam covering inheritance, mutations, and variation (40%).',
      other_evidence: 'Genetics journal with reflections on classroom discussions; peer review of position paper drafts.',
    },
    stage3: {
      learning_events: 'Week 1: From DNA to traits using paper models. Week 2: Punnett squares + dragon genetics activity. Week 3: Pedigrees and real-world cases. Week 4: Mutations and natural selection. Week 5-6: Position paper research, writing, and class symposium.',
      resources_materials: 'HHMI BioInteractive videos and case studies; Dragon Genetics simulation; PBS Newshour case studies on CRISPR; NIH Genetics Home Reference; position paper rubric.',
      differentiation: 'Visual models (paper DNA, beaded chromosomes) accessible to all. Multilingual case studies from HHMI. Sentence frames for ethical arguments. Choice in research topic. Advanced extension: students explore quantitative genetics.',
    },
  },

  // ====================================================================
  // GRADE 8 SOCIAL STUDIES — Revolution
  // ====================================================================
  {
    subject_area: 'Social Studies', grade: '8',
    unit_title: 'The American Revolution: Whose Story?',
    unit_summary: 'Students examine the political, economic, and ideological causes of the American Revolution while interrogating whose voices are included in — and excluded from — the traditional narrative.',
    status: 'approved',
    teacher_email: 'marcus.garcia@demo.curriclio.app',
    complete: [true, true, true],
    stage1: {
      learning_standards: 'MA HSS 8.T1.1, 8.T1.2; C3 D2.His.1.6-8, D2.His.3.6-8',
      vog_outcomes: 'Critical Thinking; Communication; Cultural Awareness; Global Citizenship',
      transfer: 'Analyze a modern independence movement (e.g., Catalonia, Kosovo, Hong Kong) using the same political, economic, and ideological framework applied to the American Revolution.',
      enduring_understandings: 'Revolutions arise from a mix of ideas, grievances, and leadership choices. The histories we choose to tell shape national identity and what citizens consider possible.',
      essential_questions: 'When is revolution justified? Whose voices are included in the story of independence — and whose are left out? What did "freedom" mean in 1776, and what does it mean now?',
      knowledge: 'Key events 1763-1783 (Stamp Act, Boston Tea Party, Lexington & Concord, Declaration); Enlightenment ideas (Locke, Rousseau); perspectives of women, enslaved people, Loyalists, and Indigenous nations; economic causes (mercantilism, taxation).',
      skills: 'Analyze primary sources (D2.His.1); construct evidence-based historical arguments (D2.His.3); take and defend perspectives different from one\'s own; synthesize multiple sources in writing.',
    },
    stage2: {
      transfer_tasks: 'Document-based question (DBQ): 5-paragraph essay using 6 primary sources answering "Whose Revolution was it?" Students must engage at least 3 perspectives from outside the traditional narrative.',
      formative_assessments: 'Weekly primary source analysis worksheets; Socratic seminar participation (rubric-scored); revision logs on essay drafts.',
      summative_assessments: 'DBQ essay (50%); Revolution-era newspaper project (30%) where students publish a 4-page paper from the perspective of a non-traditional voice; participation in mock Continental Congress simulation (20%).',
      other_evidence: 'Class discussion contributions; reflection journal; peer feedback on essay drafts.',
    },
    stage3: {
      learning_events: 'Week 1: Roots of revolution + Enlightenment ideas. Week 2: Causes and key events. Week 3: Multiple perspectives source dive (Indigenous, Black, women, Loyalist). Week 4: Continental Congress simulation. Week 5-6: DBQ writing and newspaper project.',
      resources_materials: 'Stanford History Education Group primary source sets; "1619 Project" Education Resources; Zinn Education Project Indigenous perspectives; Library of Congress primary documents; class set of Hamilton lyric annotations.',
      differentiation: 'Tiered source packets with vocabulary glosses. Choice in newspaper project perspective. Sentence stems for DBQ. Audio versions of primary sources. Extension: students compare to a contemporary independence movement.',
    },
  },
];

export async function POST() {
  try {
    const suffix = crypto.randomBytes(4).toString('hex');
    const slug = `demo-${suffix}`;
    const districtName = `Demo District (${suffix})`;

    const district = await queryOne<{ id: string; slug: string; name: string }>(
      `INSERT INTO districts (slug, name, subjects, grades, is_demo)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, true)
       RETURNING id, slug, name`,
      [slug, districtName, JSON.stringify(DEFAULT_SUBJECTS), JSON.stringify(DEFAULT_GRADES)]
    );
    if (!district) throw new Error('Could not create demo district');

    const adminEmail = `admin+${suffix}@demo.curriclio.app`;
    const adminPasswordHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

    const admin = await queryOne<{ id: string }>(
      `INSERT INTO users (district_id, email, password_hash, name, role, department)
       VALUES ($1, $2, $3, 'Demo Admin', 'admin', 'Curriculum Office')
       RETURNING id`,
      [district.id, adminEmail, adminPasswordHash]
    );
    if (!admin) throw new Error('Could not create demo admin');

    const teacherIds: Record<string, number> = {};
    for (const t of SAMPLE_TEACHERS) {
      const teacherHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
      const tRow = await queryOne<{ id: string }>(
        `INSERT INTO users (district_id, email, password_hash, name, role, department)
         VALUES ($1, $2, $3, $4, 'teacher', $5)
         RETURNING id`,
        [district.id, t.email, teacherHash, t.name, t.department]
      );
      if (tRow) teacherIds[t.email] = Number(tRow.id);
    }

    for (const doc of SAMPLE_DOCS) {
      const teacherId = teacherIds[doc.teacher_email];
      if (!teacherId) continue;
      const inserted = await queryOne<{ id: string }>(
        `INSERT INTO curriculum_docs
          (district_id, teacher_id, subject_area, unit_title, grade, unit_summary,
           stage1, stage2, stage3, stage1_complete, stage2_complete, stage3_complete, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13)
         RETURNING id`,
        [
          district.id, teacherId, doc.subject_area, doc.unit_title, doc.grade, doc.unit_summary,
          JSON.stringify(doc.stage1), JSON.stringify(doc.stage2), JSON.stringify(doc.stage3),
          doc.complete[0], doc.complete[1], doc.complete[2], doc.status,
        ]
      );
      if (inserted) {
        await query(
          `INSERT INTO doc_history (district_id, doc_id, user_id, action, note)
           VALUES ($1, $2, $3, 'created', 'Sample unit seeded by demo')`,
          [district.id, inserted.id, teacherId]
        );
      }
    }

    const jwt = createToken({
      userId: Number(admin.id),
      districtId: Number(district.id),
      districtSlug: district.slug,
      districtName: district.name,
      email: adminEmail,
      name: 'Demo Admin',
      role: 'admin',
    });

    const response = NextResponse.json({
      district: { slug: district.slug, name: district.name },
      redirect: '/admin',
    });

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('demo POST error:', err);
    return NextResponse.json({ error: 'Could not create demo district' }, { status: 500 });
  }
}
