const r = String.raw;

// English letter frequencies (%), A–Z
const ENG = [8.2, 1.5, 2.8, 4.3, 12.7, 2.2, 2.0, 6.1, 7.0, 0.15, 0.77, 4.0, 2.4, 6.7, 7.5, 1.9, 0.095, 6.0, 6.3, 9.1, 2.8, 0.98, 2.4, 0.15, 2.0, 0.074];
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shift = (txt, k) => txt.replace(/[A-Z]/g, (ch) => ABC[(ABC.indexOf(ch) + k + 26) % 26]);
const PLAIN = 'CRYPTOGRAPHY IS THE ART OF WRITING SECRET MESSAGES THAT ONLY THE INTENDED READER CAN UNDERSTAND FOR THOUSANDS OF YEARS GENERALS AND SPIES AND LOVERS HAVE HIDDEN THEIR WORDS BEHIND SIMPLE SHIFTS AND SUBSTITUTIONS BUT EVERY LANGUAGE LEAVES FINGERPRINTS IN THE WAY ITS LETTERS ARE USED AND A PATIENT CODEBREAKER CAN COUNT THEM TO REVEAL THE HIDDEN MESSAGE';
const KEY = 7;
const CIPHER = shift(PLAIN, KEY);
const CFREQ = (() => {
  const c = Array(26).fill(0);
  let n = 0;
  for (const ch of CIPHER) if (ch >= 'A' && ch <= 'Z') c[ABC.indexOf(ch)]++, n++;
  return c.map((v) => (100 * v) / n);
})();

// a paint "mixture" drawn as a pie of its ingredients
const pie = (s, cx, cy, rad, colors) => {
  if (colors.length === 1) return [s('circle', { cx, cy, r: rad, fill: `var(--${colors[0]})`, stroke: 'var(--ink)', 'stroke-width': 2 })];
  const els = colors.map((c, i) => {
    const a0 = (i / colors.length) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / colors.length) * 2 * Math.PI - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return s('path', { d: `M${cx} ${cy} L${cx + rad * Math.cos(a0)} ${cy + rad * Math.sin(a0)} A${rad} ${rad} 0 ${large} 1 ${cx + rad * Math.cos(a1)} ${cy + rad * Math.sin(a1)} Z`, fill: `var(--${c})` });
  });
  els.push(s('circle', { cx, cy, r: rad, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }));
  return els;
};

// modular exponentiation for small numbers
const powmod = (b, e, m) => { let r = 1; b %= m; while (e > 0) { if (e & 1) r = (r * b) % m; b = (b * b) % m; e >>= 1; } return r; };

export default {
  id: 'crypto',
  subject: 'math',
  title: 'Cryptography',
  level: 'Intermediate',
  cover: 'crypto',
  tagline: 'Crack ciphers with statistics, then build codes that even computers can’t break.',
  description: r`For most of history, secret codes were broken by clever counting. Crack a cipher with letter frequencies, see why the Vigenère cipher held out for centuries, meet the one-time pad (provably unbreakable), discover how two strangers can agree on a secret key while everyone listens in, and build RSA, the public-key system behind digital signatures and secure websites.`,
  prereq: 'Number Theory',
  chapters: [
    {
      title: 'Classical Ciphers',
      summary: 'Codes and how they fall.',
      lessons: [
        {
          id: 'frequency',
          title: 'Frequency Analysis',
          summary: 'Letters leave fingerprints',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Letters aren’t equal',
              body: r`In English text, the letter E makes up about 13% of all letters, T about 9%, and A, O, I and N about 7–8% each. Q, J, X and Z are rare. A shift (Caesar) cipher or any letter-for-letter substitution keeps these proportions: the letters change their names, but the **pattern** of frequencies survives.

The Arab scholar **al-Kindi** described this attack in the 9th century, the first known work on codebreaking.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Crack the shift',
              prompt: r`A message was encrypted by shifting every letter forward by an unknown amount. The coral bars show its letter frequencies, shifted back by your guess. The outlines show normal English. Line them up to read the message.`,
              widget: {
                kind: 'graph', xmin: -0.7, xmax: 25.7, ymin: -2.2, ymax: 16, grid: false, axes: false, height: 280,
                params: { k: { min: 0, max: 25, step: 1, value: 0, label: 'shift back by', color: 'coral', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(-0.6), x2: plot.X(25.6), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5 })];
                  const w = (plot.X(1) - plot.X(0)) * 0.36;
                  for (let i = 0; i < 26; i++) {
                    const c = CFREQ[(i + p.k) % 26];
                    els.push(s('rect', { x: plot.X(i) - w, y: plot.Y(c), width: 2 * w, height: plot.Y(0) - plot.Y(c), rx: 2, class: 'fl-coral', opacity: 0.85 }));
                    els.push(s('rect', { x: plot.X(i) - w, y: plot.Y(ENG[i]), width: 2 * w, height: plot.Y(0) - plot.Y(ENG[i]), rx: 2, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                    els.push(s('text', { x: plot.X(i), y: plot.Y(-1.4), class: 'tick', 'text-anchor': 'middle', text: ABC[i] }));
                  }
                  return els;
                },
                readout: (p) => `\`${shift(CIPHER, -p.k).slice(0, 44)}…\``,
                goal: (p) => p.k === KEY,
                hint: 'Look for the tallest coral bar (probably E) and slide it over the tallest outline.',
                solution: { k: KEY },
              },
              explain: r`The key was a shift of **7**: the ciphertext's most common letter was L, which is E shifted by 7. With frequencies, you don't need to try every key. Even a general substitution cipher, with $26! \approx 4 \times 10^{26}$ possible keys, falls to this kind of counting plus some guesswork.`,
            },
            {
              type: 'mcq',
              title: 'Hard cases',
              prompt: r`When does frequency analysis work **worst**?`,
              choices: [
                { t: 'On very short messages, where the letter counts are too few to show the usual pattern', ok: true },
                { t: 'On very long messages', why: 'Long messages are the easiest: frequencies settle close to the typical values.' },
                { t: 'When the message is in English', why: 'Every language has its own characteristic letter frequencies, and English’s are well known.' },
              ],
              explain: r`Statistics need data. A 10-letter message may contain no E at all. Writers have even produced whole novels without the letter E (Georges Perec's *La Disparition*, 1969), though real secret messages rarely go to such lengths.`,
            },
            {
              type: 'numeric',
              title: 'Brute force',
              prompt: r`A Caesar cipher shifts every letter by the same amount. How many different shifts are worth trying (excluding a shift of 0)?`,
              answer: 25,
              wrong: [{ v: 26, why: 'A shift of 26 brings every letter back to itself, the same as no shift.' }],
              explain: r`Only 25: an attacker can simply try them all in seconds. A general substitution cipher (any letter to any letter) has $26! \approx 4 \times 10^{26}$ keys, far too many to try, but frequency analysis cracks it anyway.`,
            },
            {
              type: 'numeric',
              title: 'Expected E’s',
              prompt: r`About 12.7% of letters in English text are E. In a passage of 1,000 letters, how many E’s would you expect?`,
              answer: 127,
              explain: r`$1000 \times 0.127 \approx 127$. In a Caesar cipher, the most common ciphertext letter is very likely E in disguise.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The first codebreaker',
              prompt: r`Frequency analysis was first described in the 9th century. By whom?`,
              choices: [
                { t: 'Al-Kindi, a scholar in Baghdad’s House of Wisdom', ok: true },
                { t: 'Julius Caesar', why: 'Caesar used a shift cipher; he didn’t break ciphers by counting letters.' },
                { t: 'Alan Turing', why: 'Turing worked on Enigma in the 1940s, over a thousand years later.' },
              ],
              explain: r`Abu Yusuf al-Kindi's *Manuscript on Deciphering Cryptographic Messages* explains counting letter frequencies in a ciphertext and matching them against the language. It made simple substitution ciphers obsolete for anyone who knew the trick.`,
            },
          ],
          recap: [
            'Each language has a characteristic letter frequency pattern.',
            'Substitution ciphers preserve this pattern, so counting letters breaks them.',
            'Frequency analysis needs enough text to work.',
          ],
        },
        {
          id: 'vigenere',
          title: 'The Vigenère Cipher',
          summary: 'The "indecipherable" cipher',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Many shifts at once',
              body: r`To defeat frequency analysis, use **different shifts** for different letters. Choose a keyword, say **KEY**, and repeat it along the message. Each key letter gives a shift (A = 0, B = 1, …, K = 10, E = 4, Y = 24):

| Plaintext | A | T | T | A | C | K |
|---|---|---|---|---|---|---|
| Key | K | E | Y | K | E | Y |
| Ciphertext | K | X | R | K | G | I |

The two T's encrypt to different letters, and so do the two A's. Described by Giovan Battista Bellaso in 1553 (but later credited to Blaise de Vigenère), it was called *le chiffre indéchiffrable*: the indecipherable cipher.`,
            },
            {
              type: 'mcq',
              title: 'Encrypt a letter',
              prompt: r`With key letter **C** (shift 2), what does the plaintext letter **H** become?`,
              cols: 4,
              choices: [
                { t: 'J', ok: true },
                { t: 'F', why: 'That shifts backwards. Encrypting shifts forward: H + 2.' },
                { t: 'K', why: 'C is shift 2 (A = 0), not 3.' },
                { t: 'I', why: 'Shift by 2: H → I → J.' },
              ],
              explain: r`H is letter 7; $7 + 2 = 9$, which is **J**.`,
            },
            {
              type: 'numeric',
              title: 'How many keys?',
              prompt: r`How many different 5-letter keywords are there (any letters, repeats allowed)?`,
              answer: 26 ** 5,
              tol: 0,
              relTol: 0.001,
              wrong: [{ v: 130, why: r`That's $26 \times 5$. Each of the 5 letters has 26 options independently: $26^5$.` }],
              explain: r`$26^5 = 11{,}881{,}376$: nearly 12 million keys. That sounds like a lot by hand, but the real weakness isn't the number of keys.`,
            },
            {
              type: 'numeric',
              title: 'Repeating patterns',
              prompt: r`In a Vigenère ciphertext, the same three-letter block appears at positions separated by 12 and by 18 letters. Repeats usually come from the same plaintext lined up with the same part of the key. What is the most likely key length?`,
              unit: 'letters',
              answer: 6,
              wrong: [{ v: 30, why: r`The key length divides the gaps; it isn’t their sum.` }, { v: 36, why: r`Look for a common **factor** of 12 and 18, not a multiple.` }],
              explain: r`The key length should divide both gaps, so try $\gcd(12, 18) = 6$ (or a factor of it). This is **Kasiski’s method** (1863). Once the key length is known, each sixth letter is a simple Caesar shift, cracked by frequency analysis.`,
            },
            {
              type: 'interactive',
              title: 'Find the key length',
              body: r`This Vigenère ciphertext repeats the block **FHX** three times. When the same plaintext meets the same part of the key, it gives the same ciphertext, so the key length should divide the gaps between repeats. Colour the letters by their position in the key and find the **longest** key length (up to 10) that puts all three repeats in the same column.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 43, ymin: 0, ymax: 3, grid: false, axes: false, maxWidth: 640, height: 150,
                params: { L: { min: 1, max: 10, step: 1, value: 3, label: 'key length', color: 'violet' } },
                extra: ({ plot, p, s }) => { const C = 'FHXZGNKVEEHUFHXOULEZMNWIURWZEAGNFHXKMYULSAG', cols = ['blue', 'coral', 'teal', 'violet', 'amber', 'pink', 'success', 'ink', 'muted', 'blue']; const out = []; for (let i = 0; i < C.length; i++) out.push(s('text', { x: plot.X(i + 0.5), y: plot.Y(1.5) + 6, 'text-anchor': 'middle', style: 'font-family:var(--font-mono);font-weight:700;font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px))', fill: `var(--${cols[i % p.L]})`, text: C[i] }), s('text', { x: plot.X(i + 0.5), y: plot.Y(0.6) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(9px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: String((i % p.L) + 1) })); for (const j of [0, 12, 32]) out.push(s('line', { x1: plot.X(j + 0.1), x2: plot.X(j + 2.9), y1: plot.Y(2.3), y2: plot.Y(2.3), stroke: 'var(--ink)', 'stroke-width': 3 })); return out; },
                readout: (p) => `repeats start at letters 1, 13 and 33 · key positions **${[0, 12, 32].map((j) => (j % p.L) + 1).join(', ')}**`,
                goal: (p) => p.L === 4,
                hint: 'The gaps are 12 and 20. Which numbers divide both?',
                solution: { L: 4 },
              },
              explain: r`The gaps 12 and 20 are both multiples of 1, 2 and 4, and 4 is the largest. The key really is 4 letters long (it is MATH; the plaintext is THE SUN ROSE ON THE HILLS AND BIRDS SANG THE DAY BEGAN). Once the length is known, each column is just a Caesar cipher, broken by frequency analysis. This is Kasiski’s method from 1863.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The crack',
              prompt: r`Once you know the keyword has 5 letters, how can you break a long Vigenère message?`,
              choices: [
                { t: 'Split it into 5 groups (every 5th letter); each group is a simple shift cipher, so do frequency analysis on each', ok: true },
                { t: 'Try all 12 million keys by hand', why: 'There’s a much faster way: the repeating key splits the problem into simple pieces.' },
                { t: 'It can’t be broken without the key', why: 'It can. The repeating key is its weak spot.' },
              ],
              explain: r`Letters 1, 6, 11, … all used the same shift, so they form a Caesar cipher, and so on for each position. To find the key length in the first place, look for repeated chunks of ciphertext and measure the distances between them. Charles Babbage broke Vigenère this way around 1854, and Friedrich Kasiski published the method in 1863.`,
            },
          ],
          recap: [
            'Vigenère uses a repeating keyword to vary the shift.',
            'It flattens letter frequencies, defeating simple frequency analysis.',
            'Knowing the key length splits it into simple shift ciphers.',
          ],
        },
      ],
    },
    {
      title: 'Modern Cryptography',
      summary: 'Perfect secrecy and public keys.',
      lessons: [
        {
          id: 'otp',
          title: 'The One-Time Pad',
          summary: 'A provably unbreakable code',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'A key as long as the message',
              body: r`What if the Vigenère key never repeats, is completely random, and is as long as the message? That's the **one-time pad**. In modern form, messages are bits, and we combine each message bit with a key bit using **XOR** (exclusive or): $0 \oplus 0 = 0$, $0 \oplus 1 = 1$, $1 \oplus 0 = 1$, $1 \oplus 1 = 0$.

Doing XOR with the same key twice undoes it: $(m \oplus k) \oplus k = m$. So the same key both encrypts and decrypts.`,
            },
            {
              type: 'numeric',
              title: 'XOR by hand',
              prompt: r`Message bits $1011$, key bits $0110$. What is the ciphertext, written as an ordinary (decimal) number?`,
              answer: 13,
              wrong: [{ v: 17, why: 'XOR isn’t addition. Compare bit by bit: 1⊕0, 0⊕1, 1⊕1, 1⊕0.' }, { v: 2, why: r`That's AND (both 1). XOR is 1 when the bits **differ**.` }],
              explain: r`$1011 \oplus 0110 = 1101$, which is $8 + 4 + 1 = 13$. XOR the ciphertext with the key again and you get $1011$ back.`,
            },
            {
              type: 'mcq',
              title: 'Why it’s unbreakable',
              prompt: r`An attacker intercepts the 5-letter one-time-pad ciphertext "QXZRM". Why can't they decrypt it, even with unlimited computing power?`,
              choices: [
                { t: 'Every 5-letter message is equally possible: for each one, there’s a key that produces this ciphertext', ok: true },
                { t: 'Because the encryption is very complicated', why: 'It’s actually very simple. The security comes from the random key, not complexity.' },
                { t: 'They can, by trying every key', why: 'Trying every key produces every possible message (HELLO, ATTACK, …) with no way to tell which is right.' },
              ],
              explain: r`Claude Shannon proved in the 1940s that the one-time pad has **perfect secrecy**: the ciphertext reveals nothing about the message except its length. But the key must be truly random, as long as the message, kept secret, and **never reused**. When Soviet agents reused pads in the 1940s, US codebreakers (the Venona project) decrypted thousands of messages.`,
            },
            {
              type: 'mcq',
              title: 'Two-time pad',
              prompt: r`A careless spy encrypts two messages $m_1$ and $m_2$ with the **same** key $k$. An eavesdropper XORs the two ciphertexts together. What do they get?`,
              choices: [
                { t: r`$m_1 \oplus m_2$: the key cancels out, leaving a mix of the two messages that can be untangled`, ok: true },
                { t: 'Random noise', why: r`$(m_1 \oplus k) \oplus (m_2 \oplus k) = m_1 \oplus m_2$: the key disappears.` },
                { t: 'The key', why: 'The key cancels; what remains depends only on the messages.' },
              ],
              explain: r`Natural-language messages have so much structure that $m_1 \oplus m_2$ can usually be pulled apart, for example by guessing common words. That's exactly how the Venona decryptions worked.`,
            },
            {
              type: 'interactive',
              title: 'Any message fits',
              body: r`Eve intercepts the one-time-pad ciphertext $01011010$. She guesses the message was the letter H ($01001000$). Click the key bits to find the key that would turn this ciphertext into H.`,
              widget: {
                kind: 'bits', n: 8, value: 0,
                readout: (v) => { const m = v ^ 0b01011010; return `key ${v.toString(2).padStart(8, '0')} · ciphertext XOR key = ${m.toString(2).padStart(8, '0')} = **${m >= 32 && m < 127 ? String.fromCharCode(m) : '?'}**`; },
                goal: (v) => v === 0b00010010,
                hint: 'Put a 1 wherever the ciphertext and the H disagree.',
                solution: 0b00010010,
              },
              explain: r`The key $00010010$ turns the ciphertext into H. But a different key would turn it into any other letter just as easily, and every key is equally likely. So the ciphertext tells Eve nothing at all about the message: that is perfect secrecy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Key material',
              prompt: r`A one-time pad must be as long as everything you'll ever send. How many gigabytes of key does it take to send one 4-gigabyte film securely?`,
              unit: 'GB',
              answer: 4,
              wrong: [{ v: 8, why: 'The key is the same length as the message, not double.' }],
              explain: r`4 GB of truly random key, delivered secretly in advance, used once and destroyed. That's why one-time pads are reserved for special cases (like the Moscow–Washington hotline), while everyday encryption uses short keys and clever mathematics.`,
            },
          ],
          recap: [
            'A one-time pad combines the message with a random key of equal length (e.g. by XOR).',
            'It has perfect secrecy, proved by Shannon.',
            'Reusing the key destroys its security.',
          ],
        },
        {
          id: 'diffiehellman',
          title: 'Sharing a Secret in Public',
          summary: 'Diffie–Hellman key exchange',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Mixing paint',
              body: r`Alice and Bob want a shared secret key, but every message they send is overheard by Eve. In 1976, Whitfield Diffie and Martin Hellman found a way. Picture it with paint, where mixing is easy but **unmixing is impossible**:`,
              widget: {
                kind: 'figure', w: 600, h: 300, maxWidth: 560, label: 'Paint-mixing analogy for Diffie–Hellman key exchange',
                draw: ({ s, arrow }) => {
                  const T = (x, y, t, extra = {}) => s('text', { x, y, class: 'lbl', 'text-anchor': 'middle', text: t, ...extra });
                  return [
                    T(110, 22, 'Alice'), T(490, 22, 'Bob'), T(300, 22, 'public', { style: 'fill: var(--ink-3)' }),
                    ...pie(s, 300, 62, 20, ['amber']), T(300, 100, 'common colour', { class: 'tick' }),
                    ...pie(s, 50, 150, 18, ['coral']), T(50, 186, 'secret', { class: 'tick' }),
                    ...pie(s, 160, 150, 22, ['amber', 'coral']),
                    ...pie(s, 550, 150, 18, ['blue']), T(550, 186, 'secret', { class: 'tick' }),
                    ...pie(s, 440, 150, 22, ['amber', 'blue']),
                    arrow(188, 150, 410, 150, { color: 'var(--ink-3)', width: 2 }),
                    arrow(412, 166, 190, 166, { color: 'var(--ink-3)', width: 2 }),
                    T(300, 140, 'mixtures sent in the open', { class: 'tick' }),
                    ...pie(s, 110, 245, 26, ['amber', 'blue', 'coral']), T(110, 290, 'Bob’s mix + Alice’s secret', { class: 'tick' }),
                    ...pie(s, 490, 245, 26, ['amber', 'blue', 'coral']), T(490, 290, 'Alice’s mix + Bob’s secret', { class: 'tick' }),
                    T(300, 250, 'same colour!', { style: 'fill: var(--success)' }),
                  ];
                },
              },
              after: r`Eve sees the common colour and both mixtures, but can't separate a mixture to recover either secret colour. Alice and Bob each end up with the same blend of all three.`,
            },
            {
              type: 'explain',
              title: 'With numbers',
              body: r`The real version uses modular arithmetic. Everyone knows a prime $p$ and a base $g$. Alice picks a secret $a$ and sends $A = g^a \bmod p$. Bob picks a secret $b$ and sends $B = g^b \bmod p$. Then:
$$\text{Alice computes } B^a \bmod p, \qquad \text{Bob computes } A^b \bmod p.$$
Both equal $g^{ab} \bmod p$. Computing $g^a \bmod p$ is fast. Going backwards, from $A$ to $a$ (the **discrete logarithm**), is believed to be infeasible when $p$ has hundreds of digits.`,
            },
            {
              type: 'numeric',
              title: 'Alice’s message',
              prompt: r`With $p = 23$ and $g = 5$, Alice's secret is $a = 4$. What number $A = 5^4 \bmod 23$ does she send?`,
              answer: 4,
              wrong: [{ v: 625, why: r`That's $5^4$. Now take the remainder after dividing by 23.` }, { v: 20, why: r`That's $5 \times 4$. You need $5^4 = 625$, then the remainder mod 23.` }],
              explain: r`$5^4 = 625 = 27 \times 23 + 4$, so $A = 4$.`,
            },
            {
              type: 'numeric',
              title: 'Eve tries brute force',
              prompt: r`Eve intercepts Alice's $A = 4$ and knows $g = 5$, $p = 23$. She tries $a = 1, 2, 3, \ldots$ in turn, computing $5^a \bmod 23$ each time. What is the first $a$ that gives 4?`,
              answer: 4,
              wrong: [{ v: 2, why: r`$5^2 = 25$, which leaves remainder 2, not 4. Keep going: multiply by 5 and reduce each time.` }],
              explain: r`$5^1 = 5$, $5^2 = 25 \equiv 2$, $5^3 \equiv 2 \times 5 = 10$, $5^4 \equiv 10 \times 5 = 50 \equiv 4$. So $a = 4$, found in four tries. With $p = 23$ there are at most 22 values to try; with a prime of 600 digits there are about $10^{600}$, far beyond any computer. The security rests entirely on the size of $p$.`,
            },
            {
              type: 'numeric',
              title: 'Bob’s public number',
              prompt: r`Now Bob joins in, with the same $g = 5$ and $p = 23$. His secret is $b = 3$. What number $B = 5^3 \bmod 23$ does he announce?`,
              answer: 10,
              wrong: [{ v: 125, why: r`That's $5^3$ itself. Reduce it mod 23: subtract multiples of 23.` }],
              explain: r`$5^3 = 125 = 5 \times 23 + 10$, so $B = 10$. Eve now knows 5, 23, Alice's $A$ and Bob's $B = 10$, but not $a$ or $b$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The shared secret',
              prompt: r`Bob's secret is $b = 3$, so he sends $B = 5^3 \bmod 23 = 10$. What shared secret does Alice compute, $B^a \bmod 23 = 10^4 \bmod 23$?`,
              answer: 18,
              wrong: [{ v: 10000, why: r`That's $10^4$. Take the remainder mod 23.` }, { v: 4, why: 'That’s Alice’s public number A. The shared secret is B to the power a, mod 23.' }],
              explain: r`$10^4 = 10{,}000 = 434 \times 23 + 18$, so the secret is **18**. Check Bob's side: $A^b = 4^3 = 64 = 2 \times 23 + 18$. ✓ Eve saw 23, 5, 4 and 10, but to get 18 she'd need to solve a discrete logarithm. (Declassified records later revealed that James Ellis, Clifford Cocks and Malcolm Williamson at Britain's GCHQ had discovered public-key ideas a few years earlier, in secret.)`,
            },
          ],
          recap: [
            'Diffie–Hellman lets two people agree on a secret over a public channel.',
            r`Each sends $g^{\text{secret}} \bmod p$; both compute $g^{ab} \bmod p$.`,
            'Security rests on the difficulty of the discrete logarithm.',
          ],
        },
        {
          id: 'hashes',
          title: 'Fingerprints for Data',
          summary: 'Hash functions and the birthday attack',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A digital fingerprint',
              body: r`A **cryptographic hash function** turns any input (a password, a file, a whole film) into a short, fixed-length output, its **hash**. SHA-256, used widely across the internet, outputs 256 bits. A good hash function is:

- **Fast** to compute.
- **One-way**: given a hash, you can't find an input that produces it.
- **Collision-resistant**: you can't find two different inputs with the same hash.
- **Chaotic**: change one letter of the input and about half of the output bits flip.

Websites store hashes of passwords rather than the passwords themselves; when you log in, they hash what you type and compare.`,
            },
            {
              type: 'mcq',
              title: 'Collisions must exist',
              prompt: r`A hash function maps every possible file to one of $2^{256}$ outputs. Must there be two different files with the same hash?`,
              choices: [
                { t: 'Yes: there are more possible files than outputs, so by the pigeonhole principle some must share', ok: true },
                { t: 'No: a good hash function never has collisions', why: 'Infinitely many inputs, finitely many outputs: collisions must exist. A good hash makes them practically impossible to find.' },
                { t: 'Only if the files are identical', why: 'Different files can share a hash. The point is that nobody can find such a pair.' },
              ],
              explain: r`Collisions definitely exist; the goal is that nobody can **find** one. A hash is considered broken once collisions can be found deliberately, as happened to MD5 (by 2004) and SHA-1 (publicly demonstrated in 2017).`,
            },
            {
              type: 'mcq',
              title: 'Salt',
              prompt: r`Websites add a random "salt" to each password before hashing it, storing the salt alongside the hash. What does this prevent?`,
              choices: [
                { t: 'Attackers using one precomputed table of hashes to crack everyone’s passwords at once, and identical passwords having identical hashes', ok: true },
                { t: 'Anyone ever guessing a password', why: 'A weak password can still be guessed. Salt stops mass, precomputed attacks.' },
                { t: 'The website seeing your password when you log in', why: 'You still send the password; salt protects the stored hashes if they leak.' },
              ],
              explain: r`Without salt, an attacker hashes millions of common passwords once and looks up every user. With a unique salt per user, they must start again for each account. Good systems also use deliberately slow hash functions, like bcrypt or Argon2, so each guess costs time.`,
            },
            {
              type: 'numeric',
              title: 'The birthday attack',
              prompt: r`The birthday paradox says that among about $\sqrt{N}$ random items drawn from $N$ possibilities, a repeat becomes likely. For a 64-bit hash ($N = 2^{64}$), roughly how many random inputs must an attacker hash to expect a collision? Give the answer in billions.`,
              unit: 'billion',
              answer: 2 ** 32 / 1e9,
              tol: 0.05,
              wrong: [{ v: 2 ** 64 / 1e9, relTol: 0.01, why: r`That's all $2^{64}$ outputs. The birthday effect means you only need about $\sqrt{2^{64}} = 2^{32}$.` }],
              explain: r`$\sqrt{2^{64}} = 2^{32} \approx 4.3$ billion, which a laptop can hash in minutes. That's why modern hashes use 256 bits: a collision would take about $2^{128}$ tries, far beyond all the computers on Earth.`,
            },
            {
              type: 'interactive',
              title: 'Birthdays for hashes',
              body: r`A toy hash has only $N = 2^{16} = 65{,}536$ possible outputs. The chance that $n$ random inputs include a collision is $1 - \left(1 - \frac{1}{N}\right)\left(1 - \frac{2}{N}\right)\cdots\left(1 - \frac{n-1}{N}\right)$. Find roughly how many inputs give a **50%** chance.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1000, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'inputs hashed', ylabel: 'chance of a collision', xticks: 200, yticks: 0.25 },
                params: { n: { min: 0, max: 1000, step: 1, value: 100, label: 'inputs', color: 'coral' } },
                curves: [{ f: (x) => 1 - Math.exp(-(x * (x - 1)) / (2 * 65536)), color: 'violet', width: 3 }, { f: () => 0.5, color: 'teal', dash: true }],
                points: [{ x: (p) => p.n, y: (p) => 1 - Math.exp(-(p.n * (p.n - 1)) / (2 * 65536)), color: 'coral' }],
                readout: (p) => { let q = 1; for (let k = 1; k < p.n; k++) q *= 1 - k / 65536; return `${p.n} inputs: collision chance **${(100 * (1 - q)).toFixed(1)}%** · √N = 256`; },
                goal: (p) => { let q = 1; for (let k = 1; k < p.n; k++) q *= 1 - k / 65536; return Math.abs(1 - q - 0.5) < 0.02; },
                hint: 'It is a little more than √N = 256.',
                solution: { n: 302 },
              },
              explain: r`About **302 inputs**, roughly $1.18\sqrt{N}$, give even odds, out of 65,536 possible outputs. That is why a hash with $b$ bits only offers about $b/2$ bits of collision resistance, and why modern hashes use at least 256 bits.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Brute-forcing a collision',
              prompt: r`SHA-256 produces 256-bit outputs, so $2^{256}$ possible hashes. By the birthday paradox, you expect a collision after about the square root of that many attempts. That’s $2^{\,?}$. Give the exponent.`,
              answer: 128,
              wrong: [{ v: 255, why: r`The birthday attack needs about the **square root** of the number of outputs.` }, { v: 16, why: r`Square-rooting halves the exponent: 256 / 2.` }],
              explain: r`$\sqrt{2^{256}} = 2^{128} \approx 3 \times 10^{38}$ attempts: even all the world’s computers running for the age of the universe would barely scratch it. That square-root speed-up is why hash outputs are made twice as long as the security level wanted.`,
            },
          ],
          recap: [
            'Hashes are short, fixed-length fingerprints of data.',
            'Collisions must exist (pigeonhole), but should be infeasible to find.',
            r`The birthday attack finds collisions in about $\sqrt{N}$ tries, so hashes need long outputs.`,
          ],
        },
      ],
    },
    {
      title: 'Public-Key Cryptography',
      summary: 'RSA and digital signatures.',
      lessons: [
        {
          id: 'rsa',
          title: 'RSA',
          summary: 'A lock anyone can close',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Public and private keys',
              body: r`Diffie–Hellman agrees a shared secret. In 1977, Ron Rivest, Adi Shamir and Leonard Adleman went further: a system where everyone can publish a **public key** for locking messages, while only they hold the **private key** that unlocks them, like handing out open padlocks.

RSA's security rests on a simple fact: multiplying two big primes is easy, but **factoring** their product back into the primes is believed to be extremely hard.`,
            },
            {
              type: 'explain',
              title: 'Building a key',
              body: r`A toy example:
1. Choose primes $p = 5$ and $q = 11$. Publish $n = pq = 55$.
2. Compute $\varphi = (p - 1)(q - 1) = 40$, and keep it secret.
3. Choose a public exponent $e = 3$ (sharing no factor with 40).
4. Find the private exponent $d$ with $e \cdot d \equiv 1 \pmod{40}$.

To encrypt a number $m$: $c = m^e \bmod n$. To decrypt: $m = c^d \bmod n$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the private key',
              prompt: r`Find $d$ between 1 and 39 such that $3d$ leaves remainder **1** when divided by 40.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 40, grid: 5, gridY: 5, height: 260, axes: { xlabel: 'd', ylabel: '3d mod 40' },
                params: { d: { min: 1, max: 39, step: 1, value: 5, slider: false } },
                extra: ({ plot, s }) => Array.from({ length: 39 }, (_, i) => i + 1).map((d) => s('circle', { cx: plot.X(d), cy: plot.Y((3 * d) % 40), r: 3.5, class: 'fl-ink' })),
                points: [{ x: (p) => p.d, y: (p) => (3 * p.d) % 40, drag: { x: 'd' }, color: 'coral' }],
                readout: (p) => r`$3 \times ${p.d} = ${3 * p.d} \equiv ${(3 * p.d) % 40} \pmod{40}$`,
                goal: (p) => (3 * p.d) % 40 === 1,
                hint: r`You need $3d = 41, 81, 121, \dots$: which of these is divisible by 3?`,
                solution: { d: 27 },
              },
              explain: r`$3 \times 27 = 81 = 2 \times 40 + 1$, so $d = 27$. Searching 39 values is easy, but real keys have $\varphi$ hundreds of digits long. The key holder finds $d$ instantly with the extended Euclidean algorithm, but that needs $\varphi$, which in turn needs the secret primes.`,
            },
            {
              type: 'numeric',
              title: 'Encrypt',
              prompt: r`Encrypt the message $m = 7$ with the public key $(n, e) = (55, 3)$: compute $c = 7^3 \bmod 55$.`,
              answer: powmod(7, 3, 55),
              wrong: [{ v: 343, why: r`That's $7^3$. Take the remainder after dividing by 55.` }, { v: 21, why: r`That's $7 \times 3$. RSA uses powers.` }],
              explain: r`$7^3 = 343 = 6 \times 55 + 13$, so $c = 13$. Anyone can do this with the public key. Decrypting needs $d$: $13^{27} \bmod 55 = 7$, as you can check with a computer.`,
            },
            {
              type: 'mcq',
              title: 'Why it works',
              prompt: r`Why does raising to the power $e$, then to the power $d$, give back the original message?`,
              choices: [
                { t: r`Because $ed \equiv 1 \pmod{\varphi}$, and by Euler's theorem $m^{\varphi} \equiv 1 \pmod n$, so $m^{ed} = m^{1 + k\varphi} \equiv m$`, ok: true },
                { t: 'Because 3 × 27 = 81 is a perfect square', why: 'That’s a coincidence. What matters is that ed leaves remainder 1 mod φ.' },
                { t: 'It only works for small numbers', why: 'It works for any message smaller than n; real RSA uses n with over 600 digits.' },
              ],
              explain: r`Euler's theorem generalises Fermat's little theorem: for $m$ sharing no factor with $n$, $m^{\varphi(n)} \equiv 1$. So $m^{ed} = m \cdot (m^{\varphi})^k \equiv m \cdot 1 = m$. (It works for the other $m$ too, by a slightly longer argument.)`,
            },
            {
              type: 'numeric',
              title: 'Breaking the toy',
              prompt: r`An attacker sees the public key $n = 77$, $e = 7$. Factor $n$ to find $\varphi = (p - 1)(q - 1)$.`,
              answer: 60,
              wrong: [{ v: 77, why: 'φ isn’t n itself. Factor 77 = 7 × 11, then compute (7 − 1)(11 − 1).' }, { v: 76, why: 'That’s n − 1, which works only if n is prime.' }],
              explain: r`$77 = 7 \times 11$, so $\varphi = 6 \times 10 = 60$, and from there $d$ follows ($7d \equiv 1 \pmod{60}$ gives $d = 43$). Factoring is the whole game: tiny numbers fall instantly, but nobody knows how to factor a 2,048-bit $n$ in any reasonable time.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Quantum threat',
              prompt: r`In 1994, Peter Shor found a quantum algorithm that factors large numbers efficiently. What does this mean for RSA?`,
              choices: [
                { t: 'A large enough quantum computer could break it, so new "post-quantum" algorithms are being adopted', ok: true },
                { t: 'RSA is already broken today', why: 'Current quantum computers are far too small and noisy to factor real RSA keys.' },
                { t: 'Nothing: quantum computers can’t do arithmetic', why: 'Shor’s algorithm is a genuine threat once machines are big enough.' },
              ],
              explain: r`Shor's algorithm would break both RSA and Diffie–Hellman. In 2024, the US standards body NIST published its first post-quantum cryptography standards, based on lattice problems that no known quantum algorithm solves quickly.`,
            },
          ],
          recap: [
            r`RSA: public key $(n, e)$, private key $d$ with $ed \equiv 1 \pmod{\varphi}$.`,
            r`Encrypt $c = m^e \bmod n$; decrypt $m = c^d \bmod n$.`,
            'Its security relies on factoring being hard; quantum computers threaten it.',
          ],
        },
        {
          id: 'signatures',
          title: 'Digital Signatures',
          summary: 'Proving who sent a message',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Running RSA backwards',
              body: r`RSA can also **sign**. Using the private key, Alice computes a signature $s = h^d \bmod n$, where $h$ is the hash of her message. Anyone can verify it with her public key: check that $s^e \bmod n = h$.

Only someone with $d$ can produce a valid signature, but everyone can check it. Signatures prove **who** sent a message and that it **wasn't altered**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Forge a signature?',
              prompt: r`With Alice's public key $(n, e) = (55, 3)$, a message has hash $h = 9$. Without knowing $d$, search for the signature $s$ that verifies: $s^3 \bmod 55 = 9$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 55, ymin: 0, ymax: 55, grid: 5, gridY: 5, height: 260, axes: { xlabel: 'candidate signature s', ylabel: 's³ mod 55' },
                params: { s: { min: 0, max: 54, step: 1, value: 20, slider: false } },
                extra: ({ plot, s }) => Array.from({ length: 55 }, (_, i) => s('circle', { cx: plot.X(i), cy: plot.Y(powmod(i, 3, 55)), r: 3.5, class: 'fl-ink' })),
                curves: [{ f: () => 9, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.s, y: (p) => powmod(p.s, 3, 55), drag: { x: 's' }, color: 'violet' }],
                readout: (p) => r`$${p.s}^3 \bmod 55 = ${powmod(p.s, 3, 55)}$ ${powmod(p.s, 3, 55) === 9 ? '✓ valid signature' : ''}`,
                goal: (p) => powmod(p.s, 3, 55) === 9,
                hint: 'Find the dot sitting on the dashed line.',
                solution: { s: 4 },
              },
              explain: r`$s = 4$, since $4^3 = 64 \equiv 9 \pmod{55}$. Alice gets it directly as $9^{27} \bmod 55$. With only 55 candidates, a forger can search; with $n$ hundreds of digits long, there are far too many, and the scrambled pattern gives no shortcut.`,
            },
            {
              type: 'mcq',
              title: 'Tampering',
              prompt: r`Eve changes one word of a signed contract but keeps Alice's signature. What happens when Bob verifies it?`,
              choices: [
                { t: 'The altered contract has a different hash, so the signature no longer matches and verification fails', ok: true },
                { t: 'It verifies fine: the signature belongs to Alice', why: 'A signature is tied to the exact hash of the exact message.' },
                { t: 'Bob can’t tell without asking Alice', why: 'Verification needs only Alice’s public key and the message.' },
              ],
              explain: r`Changing any part of the message changes its hash completely, so the old signature fails. That's why every software update your phone installs is checked against the maker's signature.`,
            },
            {
              type: 'mcq',
              title: 'The padlock in your browser',
              prompt: r`When you visit a secure website, how does your browser know it's really talking to your bank and not an impostor?`,
              choices: [
                { t: 'The site presents a certificate: its public key, digitally signed by a trusted certificate authority', ok: true },
                { t: 'It checks the website’s colours and logo', why: 'Impostors can copy those easily. The proof is cryptographic.' },
                { t: 'The bank emails your browser a password', why: 'No email is involved; certificates and signatures do the work.' },
              ],
              explain: r`Your browser trusts a small set of certificate authorities, whose public keys come built in. A chain of signatures links them to the bank's key, then the two sides agree a session key (often by Diffie–Hellman) to encrypt the conversation.`,
            },
            {
              type: 'mcq',
              title: 'Sign the fingerprint',
              prompt: r`Real signature schemes sign a short hash of the message rather than the message itself. Why?`,
              choices: [
                { t: r`Signing is slow for long data; a hash is short, and any change to the message changes it`, ok: true },
                { t: r`Hashes are secret`, why: r`Hash functions are public; their security comes from being hard to reverse or collide.` },
                { t: r`It makes signatures longer`, why: r`It makes signing faster; the signature size is fixed by the key.` },
              ],
              explain: r`A secure hash acts as a fingerprint: signing it binds you to the exact message. That only works if nobody can find two messages with the same hash, which is why broken hashes like MD5 and SHA-1 were retired.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Verify a signature',
              prompt: r`Alice's public key is $(n, e) = (55, 3)$. A message claims to come from her with hash $h = 13$ and signature $s = 7$. Compute $s^3 \bmod 55$. Is the signature valid?`,
              answer: powmod(7, 3, 55),
              wrong: [{ v: 343, why: 'Reduce mod 55.' }],
              explain: r`$7^3 = 343 \equiv 13 \pmod{55}$, which matches the hash: the signature is valid. (It's the same calculation as encrypting 7, just used the other way round.)`,
            },
          ],
          recap: [
            r`Sign with the private key: $s = h^d \bmod n$; verify with the public key: $s^e \bmod n = h$.`,
            'Any change to the message changes its hash and breaks the signature.',
            'Certificates chain signatures to keep web connections authentic.',
          ],
        },
      ],
    },
  ],
};
