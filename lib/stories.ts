export type Story = {
  date: string
  category: "Chinese History" | "Taiwanese History" | "Chinese Idiom" | "Language Lesson" | "Cultural Tradition"
  title: string
  titleChinese?: string
  summary: string
  content: string
  readTime: number
  lessonLearned?: string
}

const stories: Story[] = [
  {
    date: "December 12, 2024",
    category: "Taiwanese History",
    title: "The Double Tenth Day Revolution",
    titleChinese: "辛亥革命 (Xīnhài Gémìng)",
    summary: "On December 12, 1936, the Xi'an Incident occurred, changing the course of Chinese history.",
    content: `The Xi'an Incident (西安事变) was a pivotal moment in modern Chinese history. On December 12, 1936, Generalissimo Chiang Kai-shek was detained in Xi'an by his subordinate generals Zhang Xueliang and Yang Hucheng.

The two generals hoped to end the Chinese Civil War and force Chiang to focus on resisting Japanese aggression instead of fighting the Communists. This event marked a turning point that eventually led to the Second United Front between the Nationalists and Communists against Japan.

The incident demonstrated the power of unity in the face of external threats and showed how internal conflicts can be set aside for the greater good of the nation. It's a reminder that sometimes the most unlikely alliances form in times of crisis.

Today, this event is remembered as a crucial moment that shaped the resistance against Japanese invasion and influenced the trajectory of both mainland China and Taiwan.`,
    readTime: 4,
    lessonLearned: "Unity in the face of external threats can overcome internal divisions.",
  },
  {
    date: "December 11, 2024",
    category: "Chinese Idiom",
    title: "Break the Cauldrons and Sink the Boats",
    titleChinese: "破釜沉舟 (Pò Fǔ Chén Zhōu)",
    summary: "A powerful idiom about commitment and determination, dating back to ancient China.",
    content: `This famous idiom comes from a historical battle during the Qin Dynasty. General Xiang Yu was leading his troops against the Qin army. To show his soldiers there was no turning back, he ordered all cooking pots destroyed and boats sunk after crossing the river.

With no retreat possible, the soldiers fought with extraordinary courage and determination. They knew victory was their only option for survival. Against all odds, Xiang Yu's forces achieved a decisive victory.

The phrase "破釜沉舟" now means to commit oneself fully to a course of action, burning all bridges behind you. It's about showing complete determination and willingness to succeed at all costs.

In modern usage, this idiom is often used in business, education, and personal development contexts to describe someone taking a bold, irreversible step toward their goals.`,
    readTime: 3,
    lessonLearned: "Total commitment often leads to extraordinary results.",
  },
  {
    date: "December 10, 2024",
    category: "Language Lesson",
    title: "Understanding Measure Words in Chinese",
    titleChinese: "量词 (Liàng Cí)",
    summary: "Learn about the unique system of measure words (classifiers) in Chinese language.",
    content: `Chinese uses measure words (量词 liàng cí), also called classifiers, between numbers and nouns. This concept doesn't exist in English, making it one of the trickiest aspects for learners.

For example, you can't say "three books" directly. Instead, you must say "三本书" (sān běn shū), where 本 (běn) is the measure word for books. Different objects use different measure words based on their characteristics.

Common measure words include:
• 个 (gè) - general purpose, used for people and many objects
• 条 (tiáo) - for long, thin objects like rivers, fish, or pants
• 张 (zhāng) - for flat objects like paper, tables, or beds
• 只 (zhī) - for animals and some objects with handles
• 杯 (bēi) - for cups or glasses of liquid

Learning measure words helps you think about objects in terms of their physical characteristics and improves your understanding of Chinese classification systems.`,
    readTime: 3,
    lessonLearned: "Measure words reflect how Chinese speakers categorize the world around them.",
  },
  {
    date: "December 9, 2024",
    category: "Cultural Tradition",
    title: "The Art of Chinese Tea Ceremony",
    titleChinese: "茶道 (Chá Dào)",
    summary: "Explore the elegant tradition of Chinese tea ceremony and its philosophical foundations.",
    content: `The Chinese tea ceremony, known as 茶道 (chá dào) or "the way of tea," is more than just drinking tea—it's a meditative practice rooted in Daoist and Buddhist philosophy.

Dating back over a thousand years, the tea ceremony emphasizes harmony, respect, purity, and tranquility. The process involves carefully selected tea leaves, precise water temperature, proper brewing time, and mindful appreciation of each step.

Traditional tea ceremonies often use a Gongfu tea set, which includes a small teapot, tea cups, a tea tray, and various tools. The host prepares tea with deliberate, graceful movements, rinsing the tea leaves, controlling steeping time, and serving guests with both hands as a sign of respect.

In Taiwan, tea culture remains particularly strong, with oolong tea ceremonies being a cherished tradition. The practice teaches patience, mindfulness, and appreciation for life's simple pleasures. Many believe the ceremony helps one achieve mental clarity and inner peace.`,
    readTime: 4,
    lessonLearned: "Mindfulness in simple daily rituals can bring peace and connection.",
  },
  {
    date: "December 8, 2024",
    category: "Chinese History",
    title: "The Invention of Paper",
    titleChinese: "造纸术 (Zào Zhǐ Shù)",
    summary: "How the invention of paper by Cai Lun revolutionized human communication and knowledge.",
    content: `In 105 CE, Cai Lun, a court official during the Eastern Han Dynasty, invented paper-making. Before this, people wrote on bamboo strips, wooden tablets, and silk—all expensive and impractical.

Cai Lun's method used tree bark, hemp, old rags, and fishing nets, mixing them with water and pounding them into pulp. This pulp was then spread on screens to dry into thin sheets. The process was revolutionary—paper was cheaper, lighter, and easier to produce than any previous writing material.

This invention didn't just impact China; it changed the entire world. Paper-making spread along the Silk Road, reaching the Middle East by the 8th century and Europe by the 12th century. It enabled the preservation and spread of knowledge, contributing to scientific advances, religious texts, and cultural exchange.

Paper is considered one of China's "Four Great Inventions" (alongside the compass, gunpowder, and printing), and its impact on human civilization cannot be overstated.`,
    readTime: 4,
    lessonLearned: "Innovation in communication tools can transform entire civilizations.",
  },
]

export function getTodayStory(): Story {
  // Return the most recent story (first in array)
  return stories[0]
}

export function getStoryByDate(date: string): Story | undefined {
  return stories.find((story) => story.date === date)
}

export function getStoriesByMonth(year: number, month: number): Story[] {
  return stories.filter((story) => {
    const storyDate = new Date(story.date)
    return storyDate.getFullYear() === year && storyDate.getMonth() === month
  })
}

export function formatDateForUrl(year: number, month: number, day: number): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  return `${monthNames[month]} ${day}, ${year}`
}

export function isStoryAvailable(year: number, month: number, day: number): boolean {
  const dateStr = formatDateForUrl(year, month, day)
  return stories.some((story) => story.date === dateStr)
}
