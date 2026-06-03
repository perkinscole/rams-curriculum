// Curated starter sets of curriculum standards for the v1 of Curriclio's
// Standards Coverage tool. These are NOT exhaustive — they're the most
// commonly-cited codes for grades 6-8 that any UBD unit in that band is
// likely to touch. Districts can add more standards manually.
//
// Code formats follow the official conventions:
//  - Common Core ELA: RL.6.1, W.7.2, etc.
//  - Common Core Math: 6.RP.A.1, 7.NS.A.3, etc.
//  - MA STE: 6.MS-PS1-1, 7.MS-LS1-2, etc.
//  - NGSS: MS-PS1-1, MS-LS1-2, etc.

export interface FrameworkSeed {
  slug: string;
  name: string;
  state: string | null;
  subject: string;
  grade_band: string;
  description: string;
  standards: StandardSeed[];
}

export interface StandardSeed {
  code: string;
  grade: string;
  domain: string;
  description: string;
}

export const FRAMEWORK_SEEDS: FrameworkSeed[] = [
  {
    slug: 'ccss-ela-6-8',
    name: 'Common Core ELA & Literacy (Grades 6-8)',
    state: null,
    subject: 'English Language Arts',
    grade_band: '6-8',
    description: 'Common Core State Standards for English Language Arts & Literacy in Grades 6-8.',
    standards: [
      { code: 'RL.6.1', grade: '6', domain: 'Reading: Literature', description: 'Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.' },
      { code: 'RL.6.2', grade: '6', domain: 'Reading: Literature', description: 'Determine a theme or central idea of a text and how it is conveyed through particular details.' },
      { code: 'RL.6.3', grade: '6', domain: 'Reading: Literature', description: 'Describe how a particular story\'s or drama\'s plot unfolds in a series of episodes as well as how the characters respond or change.' },
      { code: 'RI.6.1', grade: '6', domain: 'Reading: Informational Text', description: 'Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.' },
      { code: 'RI.6.2', grade: '6', domain: 'Reading: Informational Text', description: 'Determine a central idea of a text and how it is conveyed through particular details.' },
      { code: 'W.6.1', grade: '6', domain: 'Writing', description: 'Write arguments to support claims with clear reasons and relevant evidence.' },
      { code: 'W.6.2', grade: '6', domain: 'Writing', description: 'Write informative/explanatory texts to examine a topic and convey ideas through the selection and analysis of relevant content.' },
      { code: 'W.6.3', grade: '6', domain: 'Writing', description: 'Write narratives to develop real or imagined experiences using effective technique, relevant descriptive details, and well-structured event sequences.' },
      { code: 'SL.6.1', grade: '6', domain: 'Speaking & Listening', description: 'Engage effectively in a range of collaborative discussions with diverse partners on grade 6 topics, texts, and issues.' },
      { code: 'L.6.1', grade: '6', domain: 'Language', description: 'Demonstrate command of the conventions of standard English grammar and usage when writing or speaking.' },

      { code: 'RL.7.1', grade: '7', domain: 'Reading: Literature', description: 'Cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.' },
      { code: 'RL.7.2', grade: '7', domain: 'Reading: Literature', description: 'Determine a theme or central idea of a text and analyze its development over the course of the text.' },
      { code: 'RI.7.1', grade: '7', domain: 'Reading: Informational Text', description: 'Cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences.' },
      { code: 'W.7.1', grade: '7', domain: 'Writing', description: 'Write arguments to support claims with clear reasons and relevant evidence.' },
      { code: 'W.7.2', grade: '7', domain: 'Writing', description: 'Write informative/explanatory texts to examine a topic and convey ideas, concepts, and information through analysis.' },
      { code: 'SL.7.1', grade: '7', domain: 'Speaking & Listening', description: 'Engage effectively in a range of collaborative discussions on grade 7 topics, texts, and issues.' },

      { code: 'RL.8.1', grade: '8', domain: 'Reading: Literature', description: 'Cite the textual evidence that most strongly supports an analysis of what the text says explicitly as well as inferences drawn from the text.' },
      { code: 'RL.8.2', grade: '8', domain: 'Reading: Literature', description: 'Determine a theme or central idea of a text and analyze its development; provide an objective summary.' },
      { code: 'RI.8.1', grade: '8', domain: 'Reading: Informational Text', description: 'Cite the textual evidence that most strongly supports analysis of what the text says explicitly as well as inferences.' },
      { code: 'W.8.1', grade: '8', domain: 'Writing', description: 'Write arguments to support claims with clear reasons and relevant evidence.' },
      { code: 'W.8.2', grade: '8', domain: 'Writing', description: 'Write informative/explanatory texts to examine a topic and convey ideas, concepts, and information.' },
      { code: 'SL.8.1', grade: '8', domain: 'Speaking & Listening', description: 'Engage effectively in a range of collaborative discussions on grade 8 topics, texts, and issues.' },
    ],
  },
  {
    slug: 'ccss-math-6-8',
    name: 'Common Core Mathematics (Grades 6-8)',
    state: null,
    subject: 'Mathematics',
    grade_band: '6-8',
    description: 'Common Core State Standards for Mathematics, Grades 6-8.',
    standards: [
      { code: '6.RP.A.1', grade: '6', domain: 'Ratios & Proportional Relationships', description: 'Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.' },
      { code: '6.RP.A.3', grade: '6', domain: 'Ratios & Proportional Relationships', description: 'Use ratio and rate reasoning to solve real-world and mathematical problems.' },
      { code: '6.NS.A.1', grade: '6', domain: 'The Number System', description: 'Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions.' },
      { code: '6.NS.C.5', grade: '6', domain: 'The Number System', description: 'Understand that positive and negative numbers are used together to describe quantities having opposite directions or values.' },
      { code: '6.EE.A.2', grade: '6', domain: 'Expressions & Equations', description: 'Write, read, and evaluate expressions in which letters stand for numbers.' },
      { code: '6.G.A.1', grade: '6', domain: 'Geometry', description: 'Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles or decomposing into triangles.' },
      { code: '6.SP.A.1', grade: '6', domain: 'Statistics & Probability', description: 'Recognize a statistical question as one that anticipates variability in the data.' },

      { code: '7.RP.A.2', grade: '7', domain: 'Ratios & Proportional Relationships', description: 'Recognize and represent proportional relationships between quantities.' },
      { code: '7.NS.A.1', grade: '7', domain: 'The Number System', description: 'Apply and extend previous understandings of addition and subtraction to add and subtract rational numbers.' },
      { code: '7.NS.A.3', grade: '7', domain: 'The Number System', description: 'Solve real-world and mathematical problems involving the four operations with rational numbers.' },
      { code: '7.EE.B.4', grade: '7', domain: 'Expressions & Equations', description: 'Use variables to represent quantities in a real-world or mathematical problem, and construct simple equations and inequalities to solve problems.' },
      { code: '7.G.B.4', grade: '7', domain: 'Geometry', description: 'Know the formulas for the area and circumference of a circle and use them to solve problems.' },
      { code: '7.SP.C.5', grade: '7', domain: 'Statistics & Probability', description: 'Understand that the probability of a chance event is a number between 0 and 1 that expresses the likelihood of the event occurring.' },

      { code: '8.NS.A.1', grade: '8', domain: 'The Number System', description: 'Know that numbers that are not rational are called irrational. Understand informally that every number has a decimal expansion.' },
      { code: '8.EE.C.7', grade: '8', domain: 'Expressions & Equations', description: 'Solve linear equations in one variable.' },
      { code: '8.F.A.1', grade: '8', domain: 'Functions', description: 'Understand that a function is a rule that assigns to each input exactly one output.' },
      { code: '8.F.B.4', grade: '8', domain: 'Functions', description: 'Construct a function to model a linear relationship between two quantities.' },
      { code: '8.G.B.7', grade: '8', domain: 'Geometry', description: 'Apply the Pythagorean Theorem to determine unknown side lengths in right triangles in real-world and mathematical problems in two and three dimensions.' },
      { code: '8.SP.A.1', grade: '8', domain: 'Statistics & Probability', description: 'Construct and interpret scatter plots for bivariate measurement data to investigate patterns of association between two quantities.' },
    ],
  },
  {
    slug: 'ma-ste-6-8',
    name: 'Massachusetts Science & Technology/Engineering (Grades 6-8)',
    state: 'MA',
    subject: 'Science',
    grade_band: '6-8',
    description: 'Massachusetts Science and Technology/Engineering Curriculum Framework, Grades 6-8 (2016).',
    standards: [
      { code: '6.MS-PS1-1', grade: '6', domain: 'Physical Science: Matter', description: 'Develop models to describe the atomic composition of simple molecules and extended structures.' },
      { code: '6.MS-PS1-4', grade: '6', domain: 'Physical Science: Matter', description: 'Develop a model that predicts and describes changes in particle motion, temperature, and state of a pure substance when thermal energy is added or removed.' },
      { code: '6.MS-LS1-1', grade: '6', domain: 'Life Science: Structure & Function', description: 'Provide evidence that organisms (unicellular and multicellular) are made of cells and that a single cell must carry out all the basic functions of life.' },
      { code: '6.MS-LS1-3', grade: '6', domain: 'Life Science: Structure & Function', description: 'Use argument supported by evidence for how the body is a system of interacting subsystems composed of groups of cells.' },
      { code: '6.MS-ESS2-4', grade: '6', domain: 'Earth & Space Science', description: 'Develop a model to explain how the energy of the Sun and Earth\'s gravity drive the cycling of water.' },
      { code: '6.MS-ETS3-1', grade: '6', domain: 'Technology/Engineering', description: 'Use informational text to illustrate that energy can be generated from renewable or nonrenewable sources.' },

      { code: '7.MS-PS2-1', grade: '7', domain: 'Physical Science: Motion & Stability', description: 'Apply Newton\'s Third Law of Motion to relate forces to explain the motion of objects.' },
      { code: '7.MS-PS2-3', grade: '7', domain: 'Physical Science: Motion & Stability', description: 'Analyze data to support the claim that Newton\'s second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration.' },
      { code: '7.MS-LS2-1', grade: '7', domain: 'Life Science: Ecosystems', description: 'Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations.' },
      { code: '7.MS-LS2-4', grade: '7', domain: 'Life Science: Ecosystems', description: 'Construct an argument supported by evidence that the stability of populations in an ecosystem is affected by changes to components of the ecosystem.' },
      { code: '7.MS-ESS2-2', grade: '7', domain: 'Earth & Space Science', description: 'Construct an explanation based on evidence for how Earth\'s surface has changed over scales that range from local to global.' },

      { code: '8.MS-PS4-1', grade: '8', domain: 'Physical Science: Waves', description: 'Use diagrams of a simple wave to explain that amplitude is related to energy, and that wavelength and frequency are inversely related.' },
      { code: '8.MS-LS3-1', grade: '8', domain: 'Life Science: Heredity', description: 'Develop and use a model to describe why structural changes to genes (mutations) located on chromosomes may affect proteins and may result in harmful, beneficial, or neutral effects.' },
      { code: '8.MS-LS4-4', grade: '8', domain: 'Life Science: Evolution', description: 'Use a model to demonstrate that genetic variations between parent and offspring contribute to variations in survival and reproduction.' },
      { code: '8.MS-ESS1-2', grade: '8', domain: 'Earth & Space Science', description: 'Explain the role of gravity in the motions within galaxies and the solar system.' },
      { code: '8.MS-ETS1-4', grade: '8', domain: 'Technology/Engineering', description: 'Develop a model to generate data for iterative testing and modification of a proposed object, tool, or process such that an optimal design can be achieved.' },
    ],
  },
  {
    slug: 'ngss-ms',
    name: 'Next Generation Science Standards (Middle School)',
    state: null,
    subject: 'Science',
    grade_band: '6-8',
    description: 'Next Generation Science Standards — Middle School performance expectations.',
    standards: [
      { code: 'MS-PS1-1', grade: '6-8', domain: 'Matter & Its Interactions', description: 'Develop models to describe the atomic composition of simple molecules and extended structures.' },
      { code: 'MS-PS2-1', grade: '6-8', domain: 'Motion & Stability', description: 'Apply Newton\'s Third Law to design a solution to a problem involving the motion of two colliding objects.' },
      { code: 'MS-PS2-2', grade: '6-8', domain: 'Motion & Stability', description: 'Plan an investigation to provide evidence that the change in an object\'s motion depends on the sum of the forces on the object and the mass of the object.' },
      { code: 'MS-PS3-1', grade: '6-8', domain: 'Energy', description: 'Construct and interpret graphical displays of data to describe the relationships of kinetic energy to the mass and speed of an object.' },
      { code: 'MS-PS4-1', grade: '6-8', domain: 'Waves', description: 'Use mathematical representations to describe a simple model for waves.' },
      { code: 'MS-LS1-1', grade: '6-8', domain: 'From Molecules to Organisms', description: 'Conduct an investigation to provide evidence that living things are made of cells.' },
      { code: 'MS-LS2-1', grade: '6-8', domain: 'Ecosystems', description: 'Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations.' },
      { code: 'MS-LS2-3', grade: '6-8', domain: 'Ecosystems', description: 'Develop a model to describe the cycling of matter and flow of energy among living and nonliving parts of an ecosystem.' },
      { code: 'MS-LS3-1', grade: '6-8', domain: 'Heredity', description: 'Develop and use a model to describe why structural changes to genes may affect proteins.' },
      { code: 'MS-LS4-4', grade: '6-8', domain: 'Biological Evolution', description: 'Construct an explanation based on evidence that describes how genetic variations contribute to variations in survival and reproduction.' },
      { code: 'MS-ESS1-2', grade: '6-8', domain: 'Earth\'s Place in the Universe', description: 'Develop and use a model to describe the role of gravity in the motions within galaxies and the solar system.' },
      { code: 'MS-ESS2-4', grade: '6-8', domain: 'Earth\'s Systems', description: 'Develop a model to explain how the energy of the Sun and Earth\'s gravity drive the cycling of water.' },
      { code: 'MS-ESS3-3', grade: '6-8', domain: 'Earth & Human Activity', description: 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment.' },
      { code: 'MS-ETS1-1', grade: '6-8', domain: 'Engineering Design', description: 'Define the criteria and constraints of a design problem with sufficient precision to ensure a successful solution.' },
      { code: 'MS-ETS1-4', grade: '6-8', domain: 'Engineering Design', description: 'Develop a model to generate data for iterative testing and modification of a proposed object, tool, or process.' },
    ],
  },
];
