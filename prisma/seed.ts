import { db as prisma } from "../lib/db";

async function main() {
  // Clean existing database
  await prisma.problem.deleteMany({});
  await prisma.subTopic.deleteMany({});
  await prisma.topic.deleteMany({});

  const topics = [
    {
      name: "Graphs",
      order: 1,
      subTopics: ["DFS & BFS", "DSU", "SCC", "Shortest Path", "Trees & LCA"],
    },
    {
      name: "Dynamic Programming",
      order: 2,
      subTopics: ["Introduction to DP", "Knapsack & Coin Change", "Range DP", "Digit DP", "Bitmask DP"],
    },
    {
      name: "Greedy",
      order: 3,
      subTopics: ["Sorting & Scheduling", "Two Pointers", "Binary Search", "Constructive Algorithms"],
    },
    {
      name: "Math & Number Theory",
      order: 4,
      subTopics: ["GCD & LCM", "Prime Sieve & Factorization", "Modular Arithmetic", "Combinatorics"],
    },
    {
      name: "Strings",
      order: 5,
      subTopics: ["KMP Algorithm", "String Hashing", "Trie"],
    },
  ];

  for (const t of topics) {
    const topic = await prisma.topic.create({
      data: {
        name: t.name,
        order: t.order,
      },
    });

    for (let i = 0; i < t.subTopics.length; i++) {
      await prisma.subTopic.create({
        data: {
          topicId: topic.id,
          name: t.subTopics[i],
          order: i + 1,
        },
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
export {};
