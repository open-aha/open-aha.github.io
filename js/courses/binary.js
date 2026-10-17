import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v) => fix(v, 3);
const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, '0');
const H = (p) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));

// Hamming(7,4): positions 1..7 left to right; parity bits at 1, 2, 4.
const HAM_CHECKS = [
  { name: 'A', pos: [1, 3, 5, 7], color: 'blue' },
  { name: 'B', pos: [2, 3, 6, 7], color: 'coral' },
  { name: 'C', pos: [4, 5, 6, 7], color: 'teal' },
];
const hamReadout = (v, b) =>
  HAM_CHECKS.map(({ name, pos }) => {
    const sum = pos.reduce((a, p) => a + b[p - 1], 0);
    return `check ${name} (${pos.join(',')}): ${sum % 2 ? '**odd ✗**' : 'even ✓'}`;
  }).join(' · ');

// two's complement: 8-bit pattern v as a signed number
const signed8 = (v) => (v >= 128 ? v - 256 : v);
// prefix code for symbols with probabilities ½, ¼, ⅛, ⅛
const CODE_P = [0.5, 0.25, 0.125, 0.125];
const kraft = (p) => [p.a, p.b, p.c, p.d].reduce((s, l) => s + 2 ** -l, 0);
const avgLen = (p) => [p.a, p.b, p.c, p.d].reduce((s, l, i) => s + l * CODE_P[i], 0);

export default {
  id: 'binary',
  subject: 'math',
  title: 'Binary & Information',
  level: 'Intermediate',
  cover: 'binary',
  tagline: 'Bits, bytes, hex colours, entropy, error-correcting codes, negative numbers and compression.',
  description: r`Everything a computer stores, from photos to this sentence, is made of 0s and 1s. Learn to count in binary, see how text and colours become numbers, measure information in bits like Claude Shannon did, discover codes that fix their own errors, see how computers store negative numbers, and design codes that compress data.`,
  prereq: 'Powers & Roots',
  chapters: [
    {
      title: 'Thinking in Binary',
      summary: 'Two digits are enough.',
      lessons: [
        {
          id: 'counting',
          title: 'Counting in Binary',
          summary: 'Place value with powers of two',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Place value, again',
              body: r`In ordinary (decimal) numbers, each place is worth **10 times** the one to its right: $347 = 3 \times 100 + 4 \times 10 + 7 \times 1$.

**Binary** uses the same idea with only two digits, 0 and 1, and each place is worth **twice** the one to its right:
$$1011_2 = 1 \times 8 + 0 \times 4 + 1 \times 2 + 1 \times 1 = 11$$
Each binary digit is called a **bit**. Computers use binary because a switch, a transistor or a magnetic spot is easy to build with just two states: on or off.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make 42',
              prompt: r`Click the bits to switch them on and off. Make the number **42**.`,
              widget: { kind: 'bits', n: 8, value: 0, goal: (v) => v === 42, hint: 'Start with the largest place value that fits: 32. What’s left?', solution: 42 },
              explain: r`$42 = 32 + 8 + 2$, so $42 = 00101010_2$. A good strategy is to take the biggest power of two that fits, subtract it, and repeat.`,
            },
            {
              type: 'numeric',
              title: 'Read it',
              prompt: r`What is $110101_2$ in decimal?`,
              answer: 53,
              wrong: [{ v: 43, why: r`Place values from the right: 1, 2, 4, 8, 16, 32. So $32 + 16 + 4 + 1$.` }, { v: 110101, why: 'Read it as binary: each place is a power of two.' }],
              explain: r`$110101_2 = 32 + 16 + 0 + 4 + 0 + 1 = 53$.`,
            },
            {
              type: 'mcq',
              title: 'Doubling',
              prompt: r`What happens to a binary number when you add a 0 on the right, like $101_2 \to 1010_2$?`,
              cols: 2,
              choices: [
                { t: 'It doubles', ok: true },
                { t: 'It multiplies by 10', why: r`In decimal, appending 0 multiplies by 10. In binary every place is worth 2× the one to its right, so it doubles: $5 \to 10$.` },
                { t: 'Nothing changes', why: r`$101_2 = 5$, but $1010_2 = 10$.` },
              ],
              explain: r`Every digit shifts one place left, so each is worth twice as much: $101_2 = 5$ becomes $1010_2 = 10$. Computers use this **shift** to multiply by 2 very quickly.`,
            },
            {
              type: 'numeric',
              title: 'Read a longer one',
              prompt: r`What is $101101_2$ in decimal?`,
              answer: 45,
              explain: r`$32 + 8 + 4 + 1 = 45$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The biggest byte',
              prompt: r`What is the largest number you can write with 8 bits?`,
              answer: 255,
              wrong: [{ v: 256, why: r`8 bits give 256 different patterns, but one of them is 0, so the largest is 255.` }, { v: 128, why: r`128 is the value of the top bit alone. Switch all 8 on: $128 + 64 + \dots + 1$.` }, { v: 11111111, why: 'That’s the binary pattern. What is it in decimal?' }],
              explain: r`$11111111_2 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255$. A neat trick: it's one less than the next place value, $256 - 1$, just as $999 = 1000 - 1$ in decimal.`,
            },
          ],
          recap: [
            'Binary uses digits 0 and 1. Each place is worth twice the one to its right.',
            'To convert to binary, take the largest power of two that fits and repeat.',
            r`$n$ bits can count from 0 up to $2^n - 1$.`,
          ],
        },
        {
          id: 'bytes',
          title: 'Bits, Bytes & Text',
          summary: 'How many patterns?',
          icon: 'book',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'How many patterns?',
              prompt: r`How many different patterns can 5 bits make?`,
              answer: 32,
              wrong: [{ v: 10, why: r`Each bit doubles the number of patterns: $2 \times 2 \times 2 \times 2 \times 2$.` }, { v: 25, why: r`That's $5^2$. You need $2^5$: two choices for each of five bits.` }, { v: 31, why: 'That’s the largest value. Including 0, there are 32 patterns.' }],
              explain: r`Each bit has 2 choices, so 5 bits give $2^5 = 32$ patterns. With $n$ bits: $2^n$.`,
            },
            {
              type: 'explain',
              title: 'Text as numbers',
              body: r`To store text, computers give every character a number. The classic **ASCII** code (1963) uses 7 bits, enough for $2^7 = 128$ characters: letters, digits, punctuation and control codes.

| Character | Decimal | Binary |
|---|---|---|
| A | 65 | 1000001 |
| B | 66 | 1000010 |
| a | 97 | 1100001 |
| 0 | 48 | 0110000 |

Today, **Unicode** extends this to well over 100,000 characters, covering the world's writing systems and emoji. Bits are grouped in eights, called **bytes**.`,
            },
            {
              type: 'interactive',
              title: 'Spell a letter',
              prompt: r`In ASCII, "A" is 65, "B" is 66, and so on. Set the bits to the code for **"J"**.`,
              widget: { kind: 'bits', n: 8, value: 65, goal: (v) => v === 74, hint: 'J is the 10th letter, so its code is 65 + 9.', solution: 74, readout: (v) => `$= ${v}$ → ${v >= 32 && v < 127 ? `**"${String.fromCharCode(v)}"**` : 'not a printable character'}` },
              explain: r`J is 9 letters after A, so its code is $65 + 9 = 74 = 64 + 8 + 2 = 01001010_2$.`,
            },
            {
              type: 'numeric',
              title: 'Enough bits',
              prompt: r`A school wants a different ID code for each of its 1,000 students, using as few bits as possible. How many bits are needed?`,
              unit: 'bits',
              answer: 10,
              wrong: [{ v: 9, why: r`$2^9 = 512$: not enough for 1,000 students.` }, { v: 1000, why: 'Each extra bit doubles the number of codes, so far fewer bits are needed.' }, { v: 11, why: r`$2^{10} = 1024$ is already enough.` }],
              explain: r`$2^9 = 512$ is too few, but $2^{10} = 1024 \geq 1000$. So **10 bits**. In general, you need $\lceil \log_2 N \rceil$ bits to label $N$ things.`,
            },
            {
              type: 'numeric',
              title: 'Room for every character',
              prompt: r`Unicode has room for 1,114,112 code points. What is the smallest number of bits that can give every one of them a different pattern?`,
              answer: 21,
              explain: r`$2^{20} = 1{,}048{,}576$ is too few; $2^{21} = 2{,}097{,}152$ is enough. In practice UTF-8 stores characters in 1 to 4 bytes, using short codes for common characters.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Kilo, or kibi?',
              prompt: r`A file is 2 MB. Strictly, by the SI definition, how many bytes is that?`,
              choices: [
                { t: '2,000,000 bytes', ok: true },
                { t: '2,097,152 bytes', why: r`That's 2 **MiB** (mebibytes), using $2^{20}$. Some software still calls this "MB", which causes confusion.` },
                { t: '16,000,000 bytes', why: 'That’s the number of bits (8 bits per byte).' },
              ],
              explain: r`SI prefixes are powers of 10, so 1 MB $= 10^6$ bytes. Binary-based units have their own names: 1 KiB $= 2^{10} = 1024$ bytes and 1 MiB $= 2^{20} = 1{,}048{,}576$ bytes. That's why a "500 GB" drive shows up as about 466 "GB" on some computers: they're really counting GiB.`,
            },
          ],
          recap: [
            r`$n$ bits make $2^n$ patterns.`,
            'Text is stored as numbers: ASCII gives "A" the code 65.',
            r`Labelling $N$ things takes $\lceil \log_2 N \rceil$ bits. 1 byte = 8 bits.`,
          ],
        },
        {
          id: 'hex',
          title: 'Hexadecimal & Colour',
          summary: 'Base 16 and screen pixels',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Base 16',
              body: r`Long binary strings are hard to read, so programmers use **hexadecimal** (base 16). It needs 16 digits: $0$–$9$, then $\text{A} = 10$, $\text{B} = 11$, up to $\text{F} = 15$.

The trick: one hex digit is exactly **4 bits**, so conversion is easy:
$$\underbrace{1101}_{\text{D}}\ \underbrace{0110}_{6}{}_2 = \text{D6}_{16} = 13 \times 16 + 6 = 214$$`,
            },
            {
              type: 'numeric',
              title: 'Read hex',
              prompt: r`What is $\text{FF}_{16}$ in decimal?`,
              answer: 255,
              wrong: [{ v: 30, why: r`The first F is in the sixteens place: $15 \times 16 + 15$.` }, { v: 1515, why: r`F means 15, but the places are worth 16 and 1: $15 \times 16 + 15$.` }],
              explain: r`$\text{FF}_{16} = 15 \times 16 + 15 = 255 = 11111111_2$: one byte with every bit on.`,
            },
            {
              type: 'interactive',
              kicker: 'Explore',
              title: 'Mixing light',
              prompt: r`Each pixel on a screen mixes red, green and blue light, each from 0 to 255 (one byte each). Colours are often written as hex codes like #FF8800. Mix pure **yellow**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 220,
                params: {
                  R: { min: 0, max: 255, step: 17, value: 0, label: 'red', color: 'coral', format: (v) => `${v} (${hex2(v)})` },
                  G: { min: 0, max: 255, step: 17, value: 0, label: 'green', color: 'teal', format: (v) => `${v} (${hex2(v)})` },
                  B: { min: 0, max: 255, step: 17, value: 0, label: 'blue', color: 'blue', format: (v) => `${v} (${hex2(v)})` },
                },
                extra: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0.5), y: plot.Y(3.7), width: plot.X(9.5) - plot.X(0.5), height: plot.Y(0.3) - plot.Y(3.7), rx: 18, fill: `rgb(${p.R},${p.G},${p.B})`, stroke: 'var(--line-2)', 'stroke-width': 2 }),
                  s('text', { x: plot.X(5), y: plot.Y(2) + 10, 'text-anchor': 'middle', style: `font-family:var(--font-mono);font-size:30px;font-weight:600;fill:${p.R * 0.3 + p.G * 0.59 + p.B * 0.11 > 140 ? '#000' : '#fff'}`, text: `#${hex2(p.R)}${hex2(p.G)}${hex2(p.B)}` }),
                ],
                goal: (p) => p.R === 255 && p.G === 255 && p.B === 0,
                hint: 'Screens mix light, not paint. Which two colours of light make yellow?',
                solution: { R: 255, G: 255, B: 0 },
              },
              explain: r`Red light + green light = **yellow**: #FFFF00. Mixing light is **additive**: all three at full strength make white (#FFFFFF), and none makes black (#000000). That's different from mixing paint.`,
            },
            {
              type: 'numeric',
              title: 'Hex to decimal',
              prompt: r`What is $\text{2A}_{16}$ in decimal?`,
              answer: 42,
              wrong: [{ v: 210, why: r`A is a single hex digit worth 10, not "1" and "0": $2 \times 16 + 10$.` }, { v: 12, why: r`The 2 is in the sixteens place: $2 \times 16 + 10 = 42$.` }],
              explain: r`$\text{2A}_{16} = 2 \times 16 + 10 = 42 = 00101010_2$, the number you built in the first lesson. Each hex digit is one group of 4 bits: 2 is $0010$ and A is $1010$.`,
            },
            {
              type: 'numeric',
              title: 'Orange',
              prompt: r`The colour #FF8000 has red FF, green 80 and blue 00. What is the green value in decimal?`,
              answer: 128,
              explain: r`$80_{16} = 8 \times 16 = 128$, half of the maximum 255. Full red plus half green makes orange.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How many colours?',
              prompt: r`With 8 bits each for red, green and blue, how many different colours can a pixel show?`,
              answer: 16777216,
              tol: 1,
              wrong: [{ v: 768, why: r`That's $3 \times 256$. Every red value combines with every green and every blue: multiply.` }, { v: 24, why: r`24 is the number of bits. The number of colours is $2^{24}$.` }, { v: 765, why: 'Multiply the choices together: 256 × 256 × 256.' }],
              explain: r`$256 \times 256 \times 256 = 2^{24} = 16{,}777{,}216$: the "16.7 million colours" in screen specifications.`,
            },
          ],
          recap: [
            'Hexadecimal uses 0–9 and A–F. One hex digit is exactly 4 bits.',
            'Screen colours mix red, green and blue light, one byte each (#RRGGBB).',
            r`24-bit colour gives $2^{24} \approx 16.7$ million colours.`,
          ],
        },
      ],
    },
    {
      title: 'Information',
      summary: 'Measuring surprise, fixing errors.',
      lessons: [
        {
          id: 'information',
          title: 'Information & Entropy',
          summary: 'Shannon’s measure of surprise',
          icon: 'question',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Twenty questions',
              prompt: r`I'm thinking of a whole number from 1 to 1,000,000. You may ask yes/no questions. With the best strategy, how many questions guarantee you find it?`,
              answer: 20,
              wrong: [{ v: 1000000, why: 'You can do far better than guessing one number at a time: halve the range with each question.' }, { v: 19, why: r`$2^{19} = 524{,}288$: not enough to separate a million possibilities.` }, { v: 500000, why: 'Ask questions that split the possibilities in half, like “Is it more than 500,000?”' }],
              explain: r`Each answer can at best **halve** the possibilities. After $q$ questions you can tell apart $2^q$ numbers, and $2^{20} = 1{,}048{,}576 \geq 1{,}000{,}000$. So 20 questions suffice (and 19 can't).`,
            },
            {
              type: 'explain',
              title: 'Information is surprise',
              body: r`In 1948, **Claude Shannon** defined information precisely. One **bit** is the information in the answer to a fair yes/no question. More generally, learning that an event of probability $p$ happened gives
$$I = \log_2 \frac{1}{p}\ \text{bits}$$
Unlikely events are **surprising**, so they carry more information. "The sun rose today" tells you almost nothing ($p \approx 1$, so $I \approx 0$).`,
            },
            {
              type: 'numeric',
              title: 'One card',
              prompt: r`A card is drawn from a well-shuffled 32-card deck. How many bits of information does learning **which** card it is give you?`,
              unit: 'bits',
              answer: 5,
              wrong: [{ v: 32, why: r`Information is $\log_2(1/p) = \log_2 32$.` }, { v: 0.03125, tol: 0.001, why: r`That's the probability $p = 1/32$. Information is $\log_2(1/p)$.` }],
              explain: r`$p = \tfrac{1}{32}$, so $I = \log_2 32 = 5$ bits. That matches intuition: 5 well-chosen yes/no questions identify one card out of 32.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Entropy',
              body: r`**Entropy** $H$ is the **average** information per outcome. For a coin that lands heads with probability $p$:
$$H = p\log_2\frac1p + (1-p)\log_2\frac{1}{1-p}$$
Adjust how biased the coin is.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1.15, grid: 0.1, gridY: 0.25, height: 300, axes: { xlabel: 'p (heads)', ylabel: 'H (bits)' },
                params: { p: { min: 0, max: 1, step: 0.01, value: 0.9, label: '$p$', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => H(x), color: 'violet' }],
                points: [{ x: (p) => p.p, y: (p) => H(p.p), color: 'coral' }],
                readout: (p) => r`$p = ${p.p.toFixed(2)}$: $\;H = ${f3(H(p.p))}$ bits per flip`,
              },
              after: r`A fair coin ($p = 0.5$) is the most unpredictable: exactly 1 bit per flip. A heavily biased coin is predictable, so each flip tells you less on average. At $p = 0$ or $1$ there's no surprise at all: $H = 0$.`,
            },
            {
              type: 'numeric',
              title: 'A fair die',
              prompt: r`How many bits of information does one roll of a fair six-sided die give? (3 decimal places.)`,
              answer: Math.log2(6),
              tol: 0.001,
              explain: r`$\log_2 6 \approx 2.585$ bits. You can’t use a fraction of a bit for one roll, but by encoding many rolls together you can approach 2.585 bits per roll (5 rolls fit in 13 bits, since $6^5 = 7776 < 8192$).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why compression works',
              prompt: r`English has 26 letters, and $\log_2 26 \approx 4.7$. Yet good compression stores English text in **far less** than 4.7 bits per letter. Why?`,
              choices: [
                { t: 'English is predictable: letters aren’t equally likely, and context helps guess the next one', ok: true },
                { t: 'Compression throws away some letters', why: 'Lossless compression (like ZIP) gives back every letter exactly.' },
                { t: 'Computers use base 26 internally', why: 'Computers work in binary. The saving comes from the patterns in the text.' },
              ],
              explain: r`4.7 bits per letter would be the entropy if every letter were equally likely and independent. But "e" is common, "q" is almost always followed by "u", and context makes the next letter fairly guessable. Shannon estimated English carries only around **1 bit per letter**. Compression algorithms exploit exactly that redundancy.`,
            },
          ],
          recap: [
            r`An event with probability $p$ carries $\log_2(1/p)$ bits of information.`,
            'Entropy is the average information. It is highest when outcomes are equally likely.',
            'Predictable data has low entropy, which is why it compresses well.',
          ],
        },
        {
          id: 'error-correction',
          title: 'Error-Correcting Codes',
          summary: 'Messages that fix themselves',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'Noise happens',
              body: r`Cosmic rays flip bits in memory. Scratches damage discs. Radio signals from space probes arrive faint and noisy. How can a receiver tell whether a bit was flipped? The answer is to add a few **extra bits**, cleverly chosen.

The simplest is a **parity bit**: add one bit so that the total number of 1s is **even**. If a single bit flips on the way, the count becomes odd, and the receiver knows something went wrong.`,
            },
            {
              type: 'interactive',
              title: 'Set the parity bit',
              prompt: r`The first 7 bits are data (locked). Set the last bit, the parity bit, so that the total number of 1s is **even**.`,
              widget: {
                kind: 'bits', n: 8, value: 0b10110110, places: false, lock: [0, 1, 2, 3, 4, 5, 6],
                labels: ['d', 'd', 'd', 'd', 'd', 'd', 'd', 'parity'], colors: [null, null, null, null, null, null, null, 'coral'],
                readout: (v, b) => `number of 1s: **${b.reduce((a, x) => a + x, 0)}** (${b.reduce((a, x) => a + x, 0) % 2 ? 'odd' : 'even'})`,
                goal: (v) => v === 0b10110111, hint: 'Count the 1s in the data bits first.', solution: 0b10110111,
              },
              explain: r`The data $1011011$ has five 1s (odd), so the parity bit must be **1** to make the total even (six).`,
            },
            {
              type: 'mcq',
              title: 'Limits of parity',
              prompt: r`A receiver gets a byte with an **odd** number of 1s. What can it conclude?`,
              choices: [
                { t: 'An odd number of bits flipped, but it can’t tell which', ok: true },
                { t: 'Exactly which bit flipped', why: 'Any flipped bit makes the count odd, so parity alone can’t point to the culprit.' },
                { t: 'Nothing went wrong', why: 'With even parity, an odd count means at least one bit flipped.' },
              ],
              explain: r`Parity **detects** a single error but can't **locate** it, so the receiver must ask for the data again. And if two bits flip, the count is even again and the error slips through unnoticed.`,
            },
            {
              type: 'explain',
              title: 'Hamming’s trick',
              body: r`In 1950, Richard Hamming found a way to **locate** and fix any single error. Send 7 bits: 4 data bits plus 3 parity bits, at positions 1, 2 and 4. Each parity bit makes a different group of positions even:

| Check | Positions |
|---|---|
| A | 1, 3, 5, 7 |
| B | 2, 3, 6, 7 |
| C | 4, 5, 6, 7 |

Every position belongs to a **different combination** of checks. So when one bit flips, the pattern of failed checks pinpoints it: **add up the failed checks' first positions** (A = 1, B = 2, C = 4) to get the position of the bad bit.`,
            },
            {
              type: 'numeric',
              title: 'The price of protection',
              prompt: r`The Hamming(7,4) code sends 7 bits for every 4 bits of data. What fraction of the transmitted bits carry data? (3 decimal places.)`,
              answer: 4 / 7,
              tol: 0.001,
              explain: r`$\frac47 \approx 0.571$: 43% of the bits are check bits, buying the ability to fix any single error. Modern codes (like LDPC codes in Wi-Fi and 5G) come much closer to Shannon’s theoretical limit.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Fix the message',
              prompt: r`This 7-bit Hamming codeword arrived with **one** bit flipped. Use the checks to find it, and click it to fix it.`,
              widget: {
                kind: 'bits', n: 7, value: 0b0110001, places: false,
                labels: ['1', '2', '3', '4', '5', '6', '7'],
                readout: hamReadout,
                goal: (v) => v === 0b0110011,
                hint: 'Checks B and C fail. Add their first positions: 2 + 4.',
                solution: 0b0110011,
              },
              explain: r`Checks B (first position 2) and C (first position 4) fail while A passes, so the error is at position $2 + 4 = 6$. Flipping it gives $0110011$, and all three checks pass. Variants of these ideas (Reed–Solomon codes and others) protect QR codes, Wi-Fi, computer memory and signals from deep-space probes.`,
            },
          ],
          recap: [
            'A parity bit detects a single flipped bit, but can’t locate it.',
            'Hamming(7,4) uses 3 parity bits to locate and fix any single error.',
            'Error-correcting codes protect QR codes, memory, Wi-Fi and space communication.',
          ],
        },
      ],
    },
    {
      title: 'Clever Encodings',
      summary: 'Negative numbers and compression.',
      lessons: [
        {
          id: 'negative',
          title: 'Negative Numbers',
          summary: 'Two’s complement',
          icon: 'left',
          steps: [
            {
              type: 'explain',
              title: 'Where’s the minus sign?',
              body: r`Computers store only bits, so how do they store $-5$? The method almost every computer uses is **two's complement**: in an 8-bit number, the leftmost bit is worth $-128$ instead of $+128$. The others keep their usual values.

So $11111111_2 = -128 + 127 = -1$, and $10000000_2 = -128$. Positive numbers from 0 to 127 look exactly as before.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make −5',
              prompt: r`The leftmost bit is worth $-128$. Set the bits to make **−5**.`,
              widget: {
                kind: 'bits', n: 8, value: 0, places: false,
                labels: ['−128', '64', '32', '16', '8', '4', '2', '1'],
                readout: (v) => `signed value: **${signed8(v)}**`,
                goal: (v) => signed8(v) === -5,
                hint: 'Turn on the −128 bit, then add 123 with the others: −128 + 123 = −5.',
                solution: 251,
              },
              explain: r`$-5 = -128 + 64 + 32 + 16 + 8 + 2 + 1 = 11111011_2$. Notice it's $5 = 00000101_2$ with every bit flipped (giving $11111010$), plus 1.`,
            },
            {
              type: 'mcq',
              title: 'Flip and add one',
              prompt: r`To negate a two's-complement number, you flip every bit and add 1. Why is this format so popular with chip designers?`,
              choices: [
                { t: 'Ordinary binary addition works unchanged for negative numbers, so the same circuit adds and subtracts', ok: true },
                { t: 'It saves memory', why: 'It uses the same 8 bits as other schemes. Its advantage is in the arithmetic.' },
                { t: 'It has two zeros, which is useful', why: 'It has only one zero, unlike "sign and magnitude", which wastefully has +0 and −0.' },
              ],
              explain: r`Add $5 + (-5)$: $00000101 + 11111011 = 1\,00000000$, and the 9th bit falls off the end, leaving 0. No special rules for signs: subtraction is just adding the negation.`,
            },
            {
              type: 'numeric',
              title: 'The range',
              prompt: r`What's the smallest (most negative) number an 8-bit two's-complement value can hold?`,
              answer: -128,
              wrong: [{ v: -127, why: '10000000 is −128 + 0 = −128.' }, { v: 0, why: 'Two’s complement holds negative numbers too.' }],
              explain: r`From $-128$ to $+127$: 256 values in total, slightly lopsided because zero takes one of the non-negative patterns.`,
            },
            {
              type: 'mcq',
              title: 'Overflow',
              prompt: r`An 8-bit signed counter holds 127 ($01111111_2$). What happens when the computer adds 1?`,
              choices: [
                { t: 'It becomes 10000000, which reads as −128', ok: true },
                { t: 'It becomes 128', why: '128 doesn’t fit in 8-bit signed: the pattern 10000000 means −128.' },
                { t: 'The computer refuses', why: 'Most processors just wrap around silently (though they set a flag that software can check).' },
              ],
              explain: r`The count **overflows** and wraps to the most negative value. Overflow bugs have caused real disasters: the first Ariane 5 rocket (1996) self-destructed after a 64-bit number was squeezed into 16 bits.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Gangnam Style',
              prompt: r`In 2014, the "Gangnam Style" video's view count approached the largest value a 32-bit signed integer can hold, and YouTube had to upgrade its counter. What is that value? (It's $2^{31} - 1$.)`,
              answer: 2 ** 31 - 1,
              wrong: [{ v: 2 ** 32 - 1, why: 'That’s for unsigned 32-bit. Signed loses one bit to the sign.' }, { v: 2 ** 31, why: 'The largest positive value is one less, since zero takes a pattern.' }],
              explain: r`$2^{31} - 1 = 2{,}147{,}483{,}647$. YouTube switched to 64-bit counters, whose limit is about $9.2 \times 10^{18}$, more than a billion views for every person alive.`,
            },
          ],
          recap: [
            'Two’s complement: the top bit is worth −2ⁿ⁻¹.',
            'Negate by flipping all bits and adding 1; addition works unchanged.',
            'Exceeding the range overflows and wraps around.',
          ],
        },
        {
          id: 'compression',
          title: 'Compression Codes',
          summary: 'Short codes for common symbols',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Not every letter is equal',
              body: r`ASCII uses 8 bits for every character, but some letters are far more common than others. **Morse code** already exploited this in the 1830s: E, the most common letter in English, is a single dot, while Q is dash-dash-dot-dash.

A **variable-length code** gives short codewords to common symbols and longer ones to rare symbols, saving bits on average.`,
            },
            {
              type: 'mcq',
              title: 'Prefix-free',
              prompt: r`Suppose A = 0, B = 01, C = 1. A receiver gets the bits 01. What's the problem?`,
              choices: [
                { t: 'It could be “B” or “A then C”: the code is ambiguous because 0 is the start of 01', ok: true },
                { t: 'There’s no problem', why: 'Try decoding 01 two different ways.' },
                { t: 'Bits can’t be grouped into symbols at all', why: 'They can, if no codeword is the beginning of another (a prefix-free code).' },
              ],
              explain: r`In a **prefix-free** code, no codeword begins another, so the receiver can split the stream unambiguously. Such codes exist exactly when the code lengths satisfy the **Kraft inequality**: $\sum 2^{-\ell_i} \le 1$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design the code',
              prompt: r`Four symbols occur with probabilities $\frac12, \frac14, \frac18, \frac18$. Choose a codeword length for each, keeping the code decodable (Kraft sum ≤ 1), to make the **average** number of bits per symbol as small as possible.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: -0.5, ymax: 4.6, grid: false, axes: false, height: 210,
                params: {
                  a: { min: 1, max: 4, step: 1, value: 2, label: 'A (½)', color: 'blue' },
                  b: { min: 1, max: 4, step: 1, value: 2, label: 'B (¼)', color: 'coral' },
                  c: { min: 1, max: 4, step: 1, value: 2, label: 'C (⅛)', color: 'teal' },
                  d: { min: 1, max: 4, step: 1, value: 2, label: 'D (⅛)', color: 'amber' },
                },
                extra: ({ plot, p, s }) => [p.a, p.b, p.c, p.d].flatMap((l, i) => {
                  const x = 0.5 + i, els = [s('text', { x: plot.X(x), y: plot.Y(-0.12), 'text-anchor': 'middle', class: 'lbl', text: 'ABCD'[i] })];
                  for (let k = 0; k < l; k++) els.push(s('rect', { x: plot.X(x - 0.3), y: plot.Y(0.55 + k + 0.85), width: plot.X(0.6) - plot.X(0), height: plot.Y(0) - plot.Y(0.85), rx: 5, class: ['fl-blue', 'fl-coral', 'fl-teal', 'fl-amber'][i] }));
                  return els;
                }),
                readout: (p) => {
                  const k = kraft(p);
                  return k > 1 + 1e-9 ? `Kraft sum ${k.toFixed(3)} > 1: **not decodable** (too many short codewords)` : `Kraft sum ${k.toFixed(3)} ✓ · average **${avgLen(p).toFixed(3)} bits** per symbol`;
                },
                goal: (p) => kraft(p) <= 1 + 1e-9 && Math.abs(avgLen(p) - 1.75) < 1e-9,
                hint: 'Give the most common symbol a 1-bit code. What’s left for the others?',
                solution: { a: 1, b: 2, c: 3, d: 3 },
              },
              explain: r`Lengths 1, 2, 3, 3 (for example A = 0, B = 10, C = 110, D = 111) give $\frac12 + \frac24 + \frac38 + \frac38 = 1.75$ bits. That's exactly the **entropy** of these probabilities: no code can do better on average. A fixed 2-bit code would need 2 bits.`,
            },
            {
              type: 'numeric',
              title: 'The saving',
              prompt: r`By what percentage does the 1.75-bit code shrink a long message, compared with the fixed 2-bit code?`,
              unit: '%',
              answer: 12.5,
              wrong: [{ v: 25, why: r`The saving is $\frac{2 - 1.75}{2}$.` }],
              explain: r`$\frac{0.25}{2} = 12.5\%$. With more skewed probabilities, the saving is larger. English text compresses to roughly a third of its ASCII size using such ideas.`,
            },
            {
              type: 'explain',
              title: 'Huffman’s algorithm',
              body: r`In 1952, MIT student David Huffman found how to build the best prefix code for any set of probabilities, in a term paper (his professor had offered it as an alternative to the final exam):
1. Take the two **least likely** symbols and merge them into one, adding their probabilities.
2. Repeat until one symbol remains.
3. Each merge is a branch in a tree; reading 0s and 1s down the tree gives the codewords.

Huffman codes are used inside ZIP files, JPEG images and MP3 audio.`,
            },
            {
              type: 'numeric',
              title: 'Build a Huffman code',
              prompt: r`Symbols have probabilities 0.4, 0.3, 0.2 and 0.1. Huffman's algorithm gives them codeword lengths 1, 2, 3 and 3. What's the average length in bits?`,
              answer: 1.9,
              tol: 0.001,
              wrong: [{ v: 2, why: 'That’s a fixed 2-bit code. Weight each length by its probability.' }, { v: 2.25, tol: 0.001, why: 'That’s the plain average of the lengths. Weight them by probability.' }],
              explain: r`$0.4 \times 1 + 0.3 \times 2 + 0.2 \times 3 + 0.1 \times 3 = 1.9$ bits. (The entropy here is about 1.85 bits: Huffman codes come within 1 bit of it, often much closer.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Compressing everything?',
              prompt: r`Could a clever program shrink **every** possible 1,000-bit file to fewer bits?`,
              choices: [
                { t: 'No: there are 2¹⁰⁰⁰ such files but fewer shorter bit strings, so some files must stay the same size or grow', ok: true },
                { t: 'Yes, with a good enough algorithm', why: 'Count: there are more 1,000-bit files than all shorter files put together.' },
                { t: 'Only if the files are text', why: 'The question is about every possible file, which includes random-looking ones.' },
              ],
              explain: r`All bit strings shorter than 1,000 bits number $2^{1000} - 1$: one fewer than the files to compress. By the pigeonhole principle, two files would get the same output, so decompression couldn't tell them apart. Compression only works because real data has patterns; random data can't be compressed.`,
            },
          ],
          recap: [
            'Variable-length prefix codes give short codes to common symbols.',
            r`Decodable lengths satisfy Kraft: $\sum 2^{-\ell} \le 1$; the average can't beat the entropy.`,
            'Huffman’s algorithm builds an optimal code; random data can’t be compressed.',
          ],
        },
      ],
    },
  ],
};
