import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const syllabus = {
  JEE_MAIN: {
    Physics: [
      "Units and Measurements",
      "Kinematics",
      "Laws of Motion",
      "Work, Energy and Power",
      "Rotational Motion",
      "Gravitation",
      "Properties of Solids and Liquids",
      "Thermodynamics",
      "Kinetic Theory of Gases",
      "Oscillations and Waves",
      "Electrostatics",
      "Current Electricity",
      "Magnetic Effects of Current and Magnetism",
      "Electromagnetic Induction and Alternating Current",
      "Electromagnetic Waves",
      "Optics",
      "Dual Nature of Matter and Radiation",
      "Atoms and Nuclei",
      "Electronic Devices"
    ],
    Chemistry: [
      "Some Basic Concepts in Chemistry",
      "Atomic Structure",
      "Chemical Bonding and Molecular Structure",
      "Chemical Thermodynamics",
      "Solutions",
      "Equilibrium",
      "Redox Reactions and Electrochemistry",
      "Chemical Kinetics",
      "Classification of Elements and Periodicity",
      "p-Block Elements",
      "d- and f-Block Elements",
      "Coordination Compounds",
      "Organic Chemistry: Basic Principles",
      "Hydrocarbons",
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
      "Practical Chemistry"
    ],
    Mathematics: [
      "Sets, Relations and Functions",
      "Complex Numbers and Quadratic Equations",
      "Matrices and Determinants",
      "Permutations and Combinations",
      "Binomial Theorem",
      "Sequences and Series",
      "Limits, Continuity and Differentiability",
      "Integral Calculus",
      "Differential Equations",
      "Coordinate Geometry",
      "Three Dimensional Geometry",
      "Vector Algebra",
      "Statistics and Probability",
      "Trigonometry"
    ]
  },

  JEE_ADVANCED: {
    Physics: [
      "General Physics",
      "Mechanics",
      "Thermal Physics",
      "Electromagnetic Waves",
      "Electrostatics",
      "Current Electricity",
      "Magnetic Effects",
      "Electromagnetic Induction",
      "Optics",
      "Modern Physics"
    ],
    Chemistry: [
      "General Topics",
      "States of Matter",
      "Atomic Structure",
      "Chemical Bonding",
      "Chemical Thermodynamics",
      "Chemical Equilibrium",
      "Electrochemistry",
      "Chemical Kinetics",
      "Solid State",
      "Solutions",
      "Surface Chemistry",
      "Inorganic Chemistry",
      "Organic Chemistry"
    ],
    Mathematics: [
      "Sets, Relations and Functions",
      "Algebra",
      "Complex Numbers",
      "Matrices and Determinants",
      "Probability and Statistics",
      "Trigonometry",
      "Analytical Geometry",
      "Differential Calculus",
      "Integral Calculus",
      "Vectors"
    ]
  },

  NEET: {
    Physics: [
      "Physics and Measurement",
      "Kinematics",
      "Laws of Motion",
      "Work, Energy and Power",
      "Rotational Motion",
      "Gravitation",
      "Properties of Solids and Liquids",
      "Thermodynamics",
      "Kinetic Theory",
      "Oscillations and Waves",
      "Electrostatics",
      "Current Electricity",
      "Magnetic Effects of Current",
      "Electromagnetic Induction and Alternating Current",
      "Electromagnetic Waves",
      "Optics",
      "Dual Nature of Matter",
      "Atoms and Nuclei",
      "Electronic Devices"
    ],
    Chemistry: [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements",
      "Chemical Bonding",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "Solutions",
      "Chemical Kinetics",
      "P-Block Elements",
      "D- and F-Block Elements",
      "Coordination Compounds",
      "Organic Chemistry Basics",
      "Hydrocarbons",
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
      "Practical Chemistry"
    ],
    Biology: [
      "Diversity in Living World",
      "Structural Organisation in Animals and Plants",
      "Cell Structure and Function",
      "Plant Physiology",
      "Human Physiology",
      "Reproduction",
      "Genetics and Evolution",
      "Biology and Human Welfare",
      "Ecology and Environment"
    ]
  },

  DSA_CODING: {
    "Data Structures": [
      "Arrays",
      "Strings",
      "Linked Lists",
      "Stacks",
      "Queues",
      "Hashing",
      "Trees",
      "Binary Search Trees",
      "Heaps",
      "Graphs",
      "Tries"
    ],
    Algorithms: [
      "Complexity Analysis",
      "Searching",
      "Sorting",
      "Two Pointers",
      "Sliding Window",
      "Recursion",
      "Backtracking",
      "Greedy Algorithms",
      "Divide and Conquer",
      "Dynamic Programming",
      "Graph Algorithms",
      "Bit Manipulation"
    ]
  }
};

async function main() {
  for (const [builtInKey, subjects] of Object.entries(syllabus)) {
    const trackNames = {
      JEE_MAIN: "JEE Main",
      JEE_ADVANCED: "JEE Advanced",
      NEET: "NEET",
      DSA_CODING: "DSA / Coding",
    };

    const track = await prisma.track.upsert({
      where: { builtInKey },
      update: { name: trackNames[builtInKey], archivedAt: null },
      create: { builtInKey, name: trackNames[builtInKey] },
    });

    for (const [subjectIndex, [subjectName, topics]] of Object.entries(subjects).entries()) {
      const slug = subjectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const subject = await prisma.subject.upsert({
        where: {
          trackId_slug: {
            trackId: track.id,
            slug,
          },
        },
        update: {
          name: subjectName,
          sortOrder: subjectIndex + 1,
        },
        create: {
          trackId: track.id,
          name: subjectName,
          slug,
          sortOrder: subjectIndex + 1,
        },
      });

      for (let i = 0; i < topics.length; i++) {
        const name = topics[i];

        await prisma.topic.upsert({
          where: {
            subjectId_slug: {
              subjectId: subject.id,
              slug: name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            },
          },
          update: {
            name,
            sortOrder: i + 1,
            isActive: true,
          },
          create: {
            subjectId: subject.id,
            name,
            slug: name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
            sortOrder: i + 1,
            isActive: true,
          },
        });
      }
    }

    console.log(`Topics seeded: ${track.name}`);
  }

  console.log("✅ Topics seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });