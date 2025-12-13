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
    date: "December 31, 2025",
    category: "Cultural Tradition",
    title: "New Year's Eve Traditions",
    titleChinese: "除夕 (Chú Xī)",
    summary: "Learn about the differences between Western and Chinese New Year celebrations.",
    content: `While December 31st marks the Western New Year, Chinese communities celebrate the Lunar New Year (春节 Chūn Jié) which falls between January 21 and February 20. However, modern Chinese and Taiwanese people often celebrate both!

On Western New Year's Eve, many young people in Taiwan and China gather at shopping districts, attend countdown parties, or watch fireworks displays. Taipei 101's famous fireworks show is one of the world's most spectacular New Year's Eve celebrations.

Traditional Chinese New Year (usually in late January or February) remains the more significant holiday, featuring family reunions, red envelopes, and symbolic foods for luck. The difference reflects how Chinese culture embraces both traditional and modern celebrations.

Interestingly, the Western New Year on January 1st (元旦 Yuán Dàn) became an official holiday in China in 1949, showing the blend of Eastern and Western cultural influences in modern Chinese society.`,
    readTime: 4,
    lessonLearned: "Cultural celebrations can coexist, each bringing unique meaning and joy.",
  },
  {
    date: "December 30, 2025",
    category: "Language Lesson",
    title: "Colors and Their Cultural Meanings",
    titleChinese: "颜色 (Yán Sè)",
    summary: "Explore how colors carry deep symbolic meanings in Chinese culture.",
    content: `In Chinese culture, colors aren't just visual—they carry profound symbolic meanings:

红色 (Hóng Sè) - Red: The most auspicious color, representing luck, happiness, and prosperity. Used for weddings, festivals, and celebrations. Red envelopes (红包) contain money gifts.

金色/黄色 (Jīn Sè/Huáng Sè) - Gold/Yellow: Symbolizes wealth, power, and royalty. Historically, only emperors could wear bright yellow.

白色 (Bái Sè) - White: Associated with death and mourning, worn at funerals. Avoid giving white flowers or wrapping gifts in white.

黑色 (Hēi Sè) - Black: Represents water in five elements theory. Can mean mystery or sophistication, but also mourning.

绿色 (Lǜ Sè) - Green: Symbolizes health and harmony, though "wearing a green hat" (戴绿帽) idiomatically means being cuckolded!

Understanding color symbolism helps navigate social situations and appreciate cultural traditions more deeply.`,
    readTime: 4,
    lessonLearned: "Colors carry cultural meanings that go beyond visual aesthetics.",
  },
  {
    date: "December 29, 2025",
    category: "Chinese History",
    title: "The Terracotta Army Discovery",
    titleChinese: "兵马俑 (Bīng Mǎ Yǒng)",
    summary: "The accidental discovery of 8,000 life-sized clay soldiers guarding Emperor Qin's tomb.",
    content: `In March 1974, farmers digging a well near Xi'an stumbled upon one of the greatest archaeological discoveries of the 20th century—the Terracotta Army.

Created around 210 BCE to accompany Emperor Qin Shi Huang in the afterlife, this underground army consists of over 8,000 soldiers, 130 chariots, 520 horses, and 150 cavalry horses. Each figure is unique, with distinct facial features, hairstyles, and expressions.

The craftsmanship is extraordinary. Originally, the figures were painted in bright colors, though most paint has faded over time. They were positioned in battle formation, equipped with real bronze weapons that remained sharp after 2,000 years due to chromium coating—a technology the West wouldn't discover until the 20th century.

This discovery revealed the sophisticated artistry and military organization of ancient China. The site is now a UNESCO World Heritage Site and one of the most significant archaeological finds in human history.`,
    readTime: 5,
    lessonLearned: "Ancient Chinese craftsmanship and organization were remarkably advanced.",
  },
  {
    date: "December 28, 2025",
    category: "Chinese Idiom",
    title: "Adding Feet to a Snake",
    titleChinese: "画蛇添足 (Huà Shé Tiān Zú)",
    summary: "Why doing too much can ruin something perfectly good.",
    content: `This idiom comes from an ancient story about a group of people who received a pot of wine to share. They decided whoever could draw a snake fastest would drink the whole pot.

One man finished first and began drinking, but seeing he still had time, he started adding feet to his snake. Another man finished his snake and said, "Snakes don't have feet! Your drawing is no longer a snake, so the wine is mine!"

The phrase "画蛇添足" literally means "drawing feet on a snake" and refers to unnecessary additions that actually ruin something. In modern usage, it warns against over-embellishment, over-explanation, or adding features that make things worse rather than better.

This idiom is especially relevant in design, writing, and communication—sometimes, knowing when to stop is just as important as knowing what to do. Simplicity often beats complexity.`,
    readTime: 4,
    lessonLearned: "Knowing when to stop is as important as knowing what to do.",
  },
  {
    date: "December 27, 2025",
    category: "Taiwanese History",
    title: "The Constitutional Era Begins",
    titleChinese: "行憲紀念日 (Xíng Xiàn Jì Niàn Rì)",
    summary: "December 25, 1947 marked the adoption of the ROC Constitution in Taiwan.",
    content: `On December 25, 1947, the Constitution of the Republic of China went into effect, establishing the constitutional framework that still governs Taiwan today.

The constitution was drafted in Nanjing before the ROC government relocated to Taiwan in 1949. Despite being written for all of China, it has adapted over decades through amendments to reflect Taiwan's democratic evolution.

Major constitutional reforms came in the 1990s during Taiwan's democratization. The direct presidential elections began in 1996, transforming Taiwan from an authoritarian state into a vibrant democracy. These changes were achieved peacefully, earning Taiwan recognition as a model for democratic transition.

December 25 was observed as Constitution Day (a public holiday) until 2001. Though no longer an official holiday, the date remains significant in Taiwan's constitutional history, representing the legal foundation of its democratic governance system.`,
    readTime: 4,
    lessonLearned: "Constitutional frameworks can evolve peacefully to reflect democratic values.",
  },
  {
    date: "December 26, 2025",
    category: "Language Lesson",
    title: "Understanding Chinese Tones",
    titleChinese: "声调 (Shēng Diào)",
    summary: "Master the four tones that completely change meaning in Mandarin Chinese.",
    content: `Mandarin Chinese is a tonal language, meaning the pitch contour changes a word's meaning entirely. There are four main tones plus a neutral tone:

First Tone (ˉ): High and level, like singing a high note. Example: 妈 (mā) = mother

Second Tone (ˊ): Rising, like asking a question in English. Example: 麻 (má) = hemp/numb

Third Tone (ˇ): Dips down then rises, a low, curved tone. Example: 马 (mǎ) = horse

Fourth Tone (ˋ): Sharp falling tone, like firmly saying "No!" Example: 骂 (mà) = to scold

Neutral Tone: Light and short, no mark. Example: 吗 (ma) = question particle

A classic example: "妈妈骑马，马慢，妈妈骂马" (Māma qí mǎ, mǎ màn, māma mà mǎ) means "Mother rides a horse, the horse is slow, mother scolds the horse." Same "ma" sound, five different meanings!

Tones are crucial—getting them wrong can change "I want to ask" (我想问 wǒ xiǎng wèn) to "I want to kiss" (我想吻 wǒ xiǎng wěn)!`,
    readTime: 5,
    lessonLearned: "In tonal languages, how you say something is as important as what you say.",
  },
  {
    date: "December 25, 2025",
    category: "Cultural Tradition",
    title: "Christmas in Chinese Culture",
    titleChinese: "圣诞节 (Shèng Dàn Jié)",
    summary: "How Christmas is celebrated in modern Chinese and Taiwanese society.",
    content: `While Christmas isn't a traditional Chinese holiday, it has been adopted as a secular celebration in modern Taiwan and China, especially among young people.

In Taiwan, Christmas is widely celebrated with decorations, gift-giving, and romantic dates. Department stores feature elaborate displays, and Christmas Eve is one of the busiest nights for restaurants. The holiday has become commercialized but festive.

An interesting tradition is giving apples on Christmas Eve (平安夜 Píng'ān Yè). In Chinese, "apple" (苹果 píngguǒ) sounds like "peace" (平安 píng'ān), so wrapped apples symbolize wishing someone peace. This is a uniquely Chinese adaptation!

Christianity represents a small but growing population in China and Taiwan, so for some, Christmas retains its religious significance. However, for most, it's a fun, modern celebration focused on gathering with friends, exchanging gifts, and enjoying festive atmosphere—showing how cultures can adopt and adapt foreign traditions in meaningful ways.`,
    readTime: 4,
    lessonLearned: "Cultures creatively adapt foreign traditions to create new, meaningful celebrations.",
  },
  {
    date: "December 24, 2025",
    category: "Chinese Idiom",
    title: "Carving a Boat to Find a Sword",
    titleChinese: "刻舟求剑 (Kè Zhōu Qiú Jiàn)",
    summary: "A warning against rigid thinking and failure to adapt to changing circumstances.",
    content: `During the Warring States period, a man was crossing a river when his sword fell into the water. Instead of jumping in immediately, he carved a mark on the side of the boat and said, "This is where my sword fell."

When the boat reached shore, he jumped into the water at the marked spot to retrieve his sword. Of course, he couldn't find it—the boat had moved, but the sword had stayed where it fell.

This idiom "刻舟求剑" criticizes inflexible thinking and failure to adapt to changing circumstances. It's used when someone stubbornly follows outdated methods, ignoring that situations have evolved.

In modern contexts, this idiom applies to businesses using obsolete strategies, teachers using outdated methods, or anyone refusing to adapt to new realities. It reminds us that what worked yesterday may not work today—we must remain flexible and responsive to change.`,
    readTime: 4,
    lessonLearned: "Rigid thinking in a changing world leads to failure; adaptability is essential.",
  },
  {
    date: "December 23, 2025",
    category: "Chinese History",
    title: "The Long March",
    titleChinese: "长征 (Cháng Zhēng)",
    summary: "The epic 6,000-mile retreat that became a legendary journey in Chinese history.",
    content: `From October 1934 to October 1935, the Red Army undertook one of military history's most remarkable journeys—the Long March. Facing Nationalist attacks, Communist forces retreated over 6,000 miles across some of China's most treacherous terrain.

The marchers crossed 24 rivers, 18 mountain ranges, and 12 provinces. They endured freezing temperatures in snowy mountains, crossed dangerous swamplands, and fought constant battles. Of the 86,000 who began, only about 8,000 completed the full journey.

Despite its devastating losses, the Long March became a powerful symbol of determination, sacrifice, and revolutionary spirit. It's celebrated in Chinese culture through poems, songs, and stories. The journey also solidified leadership structures that would shape modern China.

The March demonstrated extraordinary endurance and is studied worldwide as an example of human perseverance against overwhelming odds. It shows how narratives of struggle can become foundational to national identity.`,
    readTime: 5,
    lessonLearned: "Extraordinary perseverance can transform defeat into legendary inspiration.",
  },
  {
    date: "December 22, 2025",
    category: "Cultural Tradition",
    title: "Winter Solstice Festival",
    titleChinese: "冬至 (Dōng Zhì)",
    summary: "One of the most important traditional festivals celebrating family reunion.",
    content: `The Winter Solstice (冬至 Dōng Zhì), usually around December 21-22, is one of the most important festivals in Chinese culture. In ancient times, it was as significant as Chinese New Year!

The festival celebrates the longest night and shortest day of the year. According to Chinese philosophy, this marks the peak of yin energy and the beginning of yang's return—symbolizing hope and renewal.

In Taiwan and southern China, families traditionally eat tangyuan (汤圆), sweet glutinous rice balls in soup. The round shape symbolizes family reunion and completeness. There's a saying: "吃了汤圆大一岁" (After eating tangyuan, you're one year older), as the winter solstice traditionally marked an age increment.

In northern China, dumplings (饺子) are the traditional food, with a legend that eating dumplings prevents your ears from freezing! The festival emphasizes family gathering, ancestral worship, and looking forward to spring's return. It's a reminder that even in the darkest time, light is returning.`,
    readTime: 5,
    lessonLearned: "In darkness, we can find hope by celebrating renewal and family bonds.",
  },
  {
    date: "December 21, 2025",
    category: "Language Lesson",
    title: "Chinese Radicals: The Building Blocks",
    titleChinese: "部首 (Bù Shǒu)",
    summary: "Learn how radicals help you understand and remember Chinese characters.",
    content: `Chinese characters might seem impossibly complex, but they're built from about 200 radicals (部首 bù shǒu)—component parts that provide clues to meaning or pronunciation.

Understanding radicals is like having a decoder ring for Chinese! For example:

Water radical 氵(three drops): 河 (river), 海 (sea), 湖 (lake), 泪 (tears) - all water-related!

Heart radical 心 (heart): 想 (think), 忘 (forget), 忙 (busy), 怕 (fear) - all related to emotions or mental states.

Hand radical 扌(hand): 打 (hit), 拉 (pull), 推 (push), 抓 (grab) - all actions done with hands.

Word radical 讠(speech): 说 (speak), 语 (language), 话 (words), 讨 (discuss) - all related to speaking.

Learning radicals helps you:
• Guess the meaning of unfamiliar characters
• Organize characters in your memory
• Use dictionaries (characters are sorted by radical)
• See patterns and connections

It transforms Chinese from random symbols into a logical, interconnected system!`,
    readTime: 5,
    lessonLearned: "Understanding the building blocks makes complex systems manageable.",
  },
  {
    date: "December 20, 2025",
    category: "Taiwanese History",
    title: "The Formosa Incident",
    titleChinese: "美丽岛事件 (Měi Lì Dǎo Shì Jiàn)",
    summary: "The December 10, 1979 protest that catalyzed Taiwan's democracy movement.",
    content: `On December 10, 1979, pro-democracy activists organized a rally in Kaohsiung to commemorate International Human Rights Day. The event, organized by Formosa Magazine, attracted thousands calling for political freedom during Taiwan's martial law period.

The rally ended in violent clashes between protesters and police. The government arrested the leaders and conducted military trials, sentencing many to lengthy prison terms. This became known as the Formosa (Kaohsiung) Incident (美丽岛事件).

Rather than suppressing the democracy movement, the trials had the opposite effect. The defense lawyers—including future president Chen Shui-bian—gained public prominence. The incident galvanized opposition to authoritarian rule and became a catalyst for Taiwan's democratization.

Many arrested leaders later became important political figures after martial law ended in 1987. The Formosa Incident is remembered as a turning point—a moment when citizens demanded rights despite severe consequences, ultimately helping transform Taiwan into the thriving democracy it is today.`,
    readTime: 5,
    lessonLearned: "Courageous stands for rights, even when suppressed, can catalyze lasting change.",
  },
  {
    date: "December 19, 2025",
    category: "Chinese Idiom",
    title: "Three People Make a Tiger",
    titleChinese: "三人成虎 (Sān Rén Chéng Hǔ)",
    summary: "How repeated lies can become accepted as truth.",
    content: `This idiom comes from a story about a minister asking the king: "If one person told you there's a tiger in the marketplace, would you believe it?" The king said no. "What if two people said it?" Still no. "What if three people said it?" The king admitted he would believe it.

The minister used this to warn that during his absence, people would spread false rumors about him. If enough people repeat a lie, others start believing it, even though there couldn't possibly be a tiger in a busy marketplace!

"三人成虎" warns about the power of repeated misinformation. It's remarkably relevant today in our age of social media, where false stories can spread rapidly. Just because many people repeat something doesn't make it true.

This idiom teaches critical thinking—question claims even when they're widespread, verify information from reliable sources, and resist the bandwagon effect. Truth isn't determined by popularity but by evidence.`,
    readTime: 4,
    lessonLearned: "Widespread repetition doesn't make falsehoods true; verify before believing.",
  },
  {
    date: "December 18, 2025",
    category: "Chinese History",
    title: "The Silk Road's Golden Age",
    titleChinese: "丝绸之路 (Sī Chóu Zhī Lù)",
    summary: "How ancient trade routes connected East and West, exchanging goods and ideas.",
    content: `The Silk Road wasn't a single road but a network of trade routes connecting China with Central Asia, the Middle East, and Europe. During the Tang Dynasty (618-907 CE), it experienced its golden age.

Chinese merchants traded silk, porcelain, tea, and paper westward. In return, they brought back glassware, precious metals, spices, and exotic foods like grapes and walnuts. But more importantly, the Silk Road facilitated exchange of ideas, religions, art, and technology.

Buddhism traveled from India to China via these routes, profoundly influencing Chinese culture. Arabic numerals, Persian art, and Greek philosophy also made their way east. Meanwhile, Chinese inventions like paper-making and gunpowder gradually spread west, revolutionizing other civilizations.

The cosmopolitan Tang capital Chang'an (modern Xi'an) hosted merchants, monks, and travelers from across Asia. This cultural exchange enriched all civilizations involved, showing that prosperity comes not from isolation but from openness to new ideas and mutual exchange.`,
    readTime: 5,
    lessonLearned: "Cultural exchange and openness to new ideas enrich all civilizations.",
  },
  {
    date: "December 17, 2025",
    category: "Language Lesson",
    title: "False Friends: Similar but Different",
    titleChinese: "易混淆的词 (Yì Hùn Xiáo De Cí)",
    summary: "Chinese words that sound similar but mean completely different things.",
    content: `Chinese has many words that sound similar but have completely different meanings—these can lead to hilarious or embarrassing mistakes!

亲 (qīn) vs 青 (qīng): "Qīn" means "kiss" or "relative," while "qīng" means "green" or "young." Confusing these could turn "green vegetables" into "kissing vegetables"!

四 (sì) vs 十 (shí): "Four" vs "ten." Mispronouncing these in prices could be costly! Practice: 四十四 (sì shí sì) = 44.

买 (mǎi) vs 卖 (mài): "Buy" vs "sell"—these are tone opposites (3rd vs 4th tone). Getting this wrong could lead to opposite transactions!

鸡 (jī) vs 机 (jī): "Chicken" vs "machine/opportunity." Same sound, different tones and meanings.

问 (wèn) vs 吻 (wěn): "Ask" vs "kiss." The difference between "I want to ask you" and "I want to kiss you" is just one tone!

The key is careful pronunciation and context clues. Native speakers use context to disambiguate, but learners should practice tones carefully!`,
    readTime: 4,
    lessonLearned: "Small pronunciation differences can create completely different meanings.",
  },
  {
    date: "December 16, 2025",
    category: "Cultural Tradition",
    title: "Chinese Zodiac Animals",
    titleChinese: "生肖 (Shēng Xiào)",
    summary: "The 12-year cycle of animals and their cultural significance.",
    content: `The Chinese zodiac assigns an animal to each year in a 12-year cycle: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, and Pig. Your birth year determines your zodiac animal, believed to influence your personality and destiny.

Each animal has distinct characteristics:
• Dragon (龙): Most auspicious, symbolizes power and good fortune
• Rat (鼠): Clever, resourceful, and quick-witted
• Ox (牛): Hardworking, reliable, and strong
• Tiger (虎): Brave, competitive, and confident

Beyond personality, zodiac animals affect compatibility. Some animals are considered harmonious pairs (like Rat and Ox), while others clash (like Rat and Horse). Many people consider zodiac compatibility in relationships and business partnerships!

The zodiac also relates to the twelve Earthly Branches and combines with five elements (wood, fire, earth, metal, water) for a 60-year cycle. This creates a complex system of fortune-telling and self-understanding that remains popular throughout Chinese culture.`,
    readTime: 5,
    lessonLearned: "Ancient systems of understanding personality still influence modern decisions.",
  },
  {
    date: "December 15, 2025",
    category: "Chinese Idiom",
    title: "Waiting by a Tree for Rabbits",
    titleChinese: "守株待兔 (Shǒu Zhū Dài Tù)",
    summary: "Why relying on luck instead of effort leads to disappointment.",
    content: `A farmer once saw a rabbit running so fast it crashed into a tree stump and died. Happy with his easy meal, the farmer abandoned his work and sat by the stump every day, waiting for another rabbit to crash.

Of course, no more rabbits came. His fields became overgrown with weeds, and he became the laughingstock of his village. The idiom "守株待兔" now means passively waiting for good fortune instead of taking action.

This saying criticizes:
• Lazy people hoping for lucky breaks
• Relying on past success without continued effort  
• Waiting for opportunities instead of creating them
• Wishful thinking over practical work

In modern business and life, this idiom warns against complacency. One lucky break doesn't guarantee future success. Sustainable achievement requires consistent effort, adaptation, and active pursuit of goals—not passive waiting for fortune to repeat itself.`,
    readTime: 4,
    lessonLearned: "Success requires consistent effort, not passive waiting for lucky breaks.",
  },
  {
    date: "December 14, 2025",
    category: "Taiwanese History",
    title: "Taiwan's Japanese Era",
    titleChinese: "日治時期 (Rì Zhì Shí Qī)",
    summary: "The 50-year period that shaped modern Taiwan's infrastructure and culture.",
    content: `From 1895 to 1945, Taiwan was under Japanese rule following the First Sino-Japanese War. This period profoundly shaped modern Taiwan, leaving complex legacies still debated today.

The Japanese modernized infrastructure extensively: building railways, roads, schools, and hospitals. They introduced modern agriculture, including rice and sugar cultivation systems. Public health campaigns and sanitation improvements dramatically increased life expectancy.

However, colonial rule also meant cultural suppression. The Japanese promoted their language and culture while restricting Taiwanese and Chinese expressions. Many Taiwanese were forced to adopt Japanese names and customs.

Despite—or perhaps because of—this complexity, many older Taiwanese who lived through this era maintain mixed feelings: appreciating the infrastructure development and order while recognizing the loss of cultural autonomy. This nuanced historical perspective influences Taiwan's unique identity today, distinct from both mainland China and Japan, yet influenced by both.`,
    readTime: 5,
    lessonLearned: "Colonial histories are complex, with legacies both positive and painful.",
  },
  {
    date: "December 13, 2025",
    category: "Chinese History",
    title: "The Nanjing Massacre Remembrance",
    titleChinese: "南京大屠杀 (Nánjīng Dà Túshā)",
    summary: "Remembering a tragic chapter in history to honor victims and promote peace.",
    content: `On December 13, 1937, the Japanese Imperial Army occupied Nanjing, then China's capital. What followed was one of World War II's most horrific atrocities—the Nanjing Massacre, lasting six weeks.

Historians estimate hundreds of thousands of civilians and disarmed soldiers were killed, and widespread atrocities were committed. This tragedy is remembered annually on December 13th as National Memorial Day in China, a day to honor victims and reflect on the horrors of war.

The event remains sensitive in East Asian relations. China established the Nanjing Massacre Memorial Hall to preserve historical memory and promote peace education. UNESCO recognized documents about the massacre as part of the Memory of the World Register.

Remembering such tragedies serves important purposes: honoring victims, educating future generations about war's consequences, and promoting reconciliation and peace. It reminds us that protecting human rights and dignity must be constant priorities.`,
    readTime: 5,
    lessonLearned: "Remembering historical tragedies helps us honor victims and prevent future atrocities.",
  },
  {
    date: "December 12, 2025",
    category: "Taiwanese History",
    title: "The Xi'an Incident",
    titleChinese: "西安事变 (Xī'ān Shì Biàn)",
    summary: "On December 12, 1936, the Xi'an Incident occurred, changing the course of Chinese history.",
    content: `The Xi'an Incident (西安事变) was a pivotal moment in modern Chinese history. On December 12, 1936, Generalissimo Chiang Kai-shek was detained in Xi'an by his subordinate generals Zhang Xueliang and Yang Hucheng.

The two generals hoped to end the Chinese Civil War and force Chiang to focus on resisting Japanese aggression instead of fighting the Communists. This event marked a turning point that eventually led to the Second United Front between the Nationalists and Communists against Japan.

The incident demonstrated the power of unity in the face of external threats and showed how internal conflicts can be set aside for the greater good of the nation. It's a reminder that sometimes the most unlikely alliances form in times of crisis.

Today, this event is remembered as a crucial moment that shaped the resistance against Japanese invasion and influenced the trajectory of both mainland China and Taiwan.`,
    readTime: 4,
    lessonLearned: "Unity in the face of external threats can overcome internal divisions.",
  },
  {
    date: "December 11, 2025",
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
    date: "December 10, 2025",
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
    date: "December 9, 2025",
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
    date: "December 8, 2025",
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
  {
    date: "December 7, 2025",
    category: "Language Lesson",
    title: "Chinese Name Order and Meaning",
    titleChinese: "中文名字 (Zhōng Wén Míng Zi)",
    summary: "Understanding the structure and significance of Chinese names.",
    content: `Chinese names follow a different structure than Western names: family name (surname) comes first, followed by the given name. For example, in 李明 (Lǐ Míng), Li is the surname and Ming is the given name.

Most Chinese surnames are one character, though some rare ones use two. The given name is usually one or two characters carefully chosen for meaning. Parents spend considerable time selecting names with auspicious meanings, balanced elements, and pleasant sounds.

Common naming considerations:
• Five Elements (五行): Balancing wood, fire, earth, metal, water
• Meaning: Names often express hopes like 美 (měi - beautiful), 强 (qiáng - strong), 慧 (huì - wise)
• Gender: Certain characters are traditionally masculine or feminine
• Generation names: Siblings often share one character

In Taiwan, many people also have English names for international convenience, but their Chinese name remains their official identity. Understanding Chinese names reveals cultural values: family first (surname first), hope for the future (meaningful given names), and harmony with nature (five elements balance).`,
    readTime: 5,
    lessonLearned: "Names carry cultural values, family identity, and parental hopes for the future.",
  },
  {
    date: "December 6, 2025",
    category: "Chinese Idiom",
    title: "An Old Horse Knows the Way",
    titleChinese: "老马识途 (Lǎo Mǎ Shí Tú)",
    summary: "Why experience and wisdom should be valued and consulted.",
    content: `During the Spring and Autumn period, Duke Huan of Qi led his army into unfamiliar territory and got lost. His advisor Guan Zhong suggested: "Old horses have wisdom. Let them lead." They released the oldest horses, which led the army safely back.

This idiom "老马识途" literally means "an old horse knows the way" and celebrates the value of experience. It's used to describe:
• Experienced people who can guide others through difficult situations
• The wisdom that comes from years of practice
• Trusting veterans when facing unfamiliar challenges
• Respecting elders and their accumulated knowledge

In modern contexts, this applies to workplace mentorship, where seasoned professionals guide newcomers. It reminds younger generations to seek advice from those who've already traveled the path, rather than arrogantly assuming they know better.

The idiom also suggests that practical experience often outweighs theoretical knowledge. Sometimes, the best teacher isn't a book or classroom, but someone who's "been there, done that."`,
    readTime: 4,
    lessonLearned: "Experience and wisdom accumulated over time are invaluable guides.",
  },
  {
    date: "December 5, 2025",
    category: "Taiwanese History",
    title: "Taiwan's Economic Miracle",
    titleChinese: "台湾经济奇迹 (Táiwān Jīngjì Qíjì)",
    summary: "How Taiwan transformed from agriculture to high-tech powerhouse in decades.",
    content: `From the 1960s to 1990s, Taiwan achieved one of history's most remarkable economic transformations, known as the "Taiwan Miracle." The island went from primarily agricultural economy to global technology leader in just a few decades.

Key factors in this success:
• Land reform that created property-owning farmers and capital for investment
• Export-oriented industrialization starting with textiles and light manufacturing
• Heavy investment in education, creating a highly skilled workforce
• Strategic development of science parks, especially Hsinchu Science Park (1980)
• Government support for technology industries while maintaining private enterprise

By the 1990s, Taiwan became a global leader in semiconductor manufacturing, computer hardware, and electronics. Companies like TSMC (Taiwan Semiconductor Manufacturing Company) became world leaders, producing chips for Apple, AMD, and countless others.

This transformation lifted millions from poverty and created a prosperous middle class. Taiwan's success story is studied worldwide as a model of effective development strategy, showing how strategic planning, education, and adaptability can transform an economy.`,
    readTime: 5,
    lessonLearned: "Strategic investment in education and technology can rapidly transform economies.",
  },
  {
    date: "December 4, 2025",
    category: "Cultural Tradition",
    title: "Chinese Calligraphy as Art",
    titleChinese: "书法 (Shū Fǎ)",
    summary: "The ancient art of beautiful writing that reveals character and cultivates patience.",
    content: `Chinese calligraphy (书法 shū fǎ) is considered the highest form of visual art in Chinese culture—more revered than painting. It's not just beautiful writing, but a discipline that cultivates character, reveals personality, and connects the artist to thousands of years of tradition.

The practice requires the Four Treasures of the Study (文房四宝):
• Brush (笔 bǐ): Made from animal hair, requires delicate control
• Ink stick (墨 mò): Ground with water to create fresh ink
• Paper (纸 zhǐ): Absorbent rice paper that captures each stroke
• Inkstone (砚 yàn): For grinding and holding ink

Calligraphy demands complete focus. Each stroke must be executed with proper pressure, speed, and direction—there's no erasing or correcting. The process is meditative, teaching patience, discipline, and mindfulness.

Masters can read personality in someone's calligraphy: bold strokes suggest confidence, delicate lines indicate sensitivity. The saying goes: "字如其人" (zì rú qí rén) - "calligraphy reflects the person." Learning calligraphy connects you to this profound tradition of self-cultivation through art.`,
    readTime: 5,
    lessonLearned: "Artistic disciplines can cultivate character while connecting us to cultural heritage.",
  },
  {
    date: "December 3, 2025",
    category: "Chinese History",
    title: "The Grand Canal Construction",
    titleChinese: "大运河 (Dà Yùn Hé)",
    summary: "The world's longest canal, connecting China's north and south for over 1,400 years.",
    content: `The Grand Canal of China is the world's longest canal and oldest still in use, stretching over 1,100 miles from Beijing to Hangzhou. Its construction began in the 5th century BCE, with major expansions during the Sui Dynasty (581-618 CE).

Emperor Yang of Sui mobilized millions of workers to connect existing waterways into one grand system. The human cost was enormous—historians estimate hundreds of thousands died during construction. Despite this tragedy, the canal revolutionized Chinese civilization.

The Grand Canal enabled:
• Efficient transport of grain from fertile south to northern capitals
• Cultural exchange between different regions
• Economic integration of diverse areas
• Administrative control over vast territories

The canal facilitated the movement of ideas, people, and goods, helping unify diverse regions into a coherent empire. Cities along its route became prosperous trade centers. Today, sections remain operational for shipping and tourism.

In 2014, UNESCO recognized the Grand Canal as a World Heritage Site, acknowledging its engineering marvel and profound impact on Chinese civilization.`,
    readTime: 5,
    lessonLearned: "Massive infrastructure projects can unite regions and enable civilizations to flourish.",
  },
  {
    date: "December 2, 2025",
    category: "Language Lesson",
    title: "Chinese Homophones and Wordplay",
    titleChinese: "谐音 (Xié Yīn)",
    summary: "How Chinese uses sound-alike words for lucky meanings and clever puns.",
    content: `Chinese is rich with homophones—different words that sound the same—creating opportunities for wordplay, symbolism, and lucky associations called 谐音 (xié yīn).

Popular lucky homophones:
• 八 (bā) "eight" sounds like 发 (fā) "prosperity" → Number 8 is extremely lucky! Phone numbers and addresses with 8 are prized.
• 六 (liù) "six" sounds like 流 (liú) "flow/smooth" → Represents things going smoothly.
• 四 (sì) "four" sounds like 死 (sǐ) "death" → Number 4 is unlucky; buildings skip 4th floors!

Cultural examples:
• Giving clocks (钟 zhōng) is bad luck—sounds like "attending a funeral" (送终 sòng zhōng)
• Fish (鱼 yú) at New Year represents "surplus" (余 yú)
• Pineapples (凤梨 fèng lí) in Taiwan sound like "prosperity comes" (旺来 ōng lâi in Taiwanese)

This love of homophones influences business names, gift-giving, date selection (many weddings on 8/8!), and daily superstitions. It shows how Chinese culture finds meaning and symbolism through language's sounds, not just its meanings.`,
    readTime: 4,
    lessonLearned: "Sound symbolism deeply influences cultural practices and beliefs.",
  },
  {
    date: "December 1, 2025",
    category: "Chinese Idiom",
    title: "Pointing at a Deer, Calling It a Horse",
    titleChinese: "指鹿为马 (Zhǐ Lù Wéi Mǎ)",
    summary: "About powerful people distorting truth and forcing others to accept lies.",
    content: `During the Qin Dynasty, the powerful eunuch Zhao Gao wanted to test his control over the court. He presented a deer to Emperor Qin Er Shi and called it a horse. The emperor laughed, but Zhao Gao asked the assembled ministers: "Is this a horse or a deer?"

Some ministers, fearing Zhao Gao, said it was a horse. Others, maintaining integrity, insisted it was a deer. Zhao Gao later had those who spoke truth executed or dismissed. This incident demonstrated his absolute power—he could make people deny obvious reality.

"指鹿为马" now describes:
• Powerful people deliberately distorting facts
• Forcing others to accept obvious lies through intimidation
• Abuse of authority to manipulate truth
• The danger of speaking truth to corrupt power

This idiom is particularly relevant in discussions of propaganda, authoritarianism, and situations where people must choose between truth and safety. It reminds us to value intellectual integrity even when dangerous, and warns against societies where truth becomes whatever the powerful say it is.`,
    readTime: 5,
    lessonLearned: "Protecting truth requires courage, especially when power seeks to distort reality.",
  },
  {
    date: "December 12, 2025",
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
    date: "December 11, 2025",
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
    date: "December 10, 2025",
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
    date: "December 9, 2025",
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
    date: "December 8, 2025",
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
