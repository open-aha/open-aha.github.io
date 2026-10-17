# Contributing to OpenAha

OpenAha is free, interactive math and science for everyone. Most of it was built quickly with
AI coding agents, which gave it breadth. What it still needs is human taste: the eye of someone
who remembers being confused, or who has watched a student get stuck. That is where you come in.

You don't need to write code to help. The most valuable contributions are notes from learners
and teachers.

## What helps most

1. **"I got confused here."** Tell us the exact moment a step stopped making sense, and what you
   expected instead. Beginners' notes are gold, because experts no longer see the gaps.
2. **Mistakes.** A wrong answer, an explanation that is off, a typo, a widget that misbehaves.
3. **Ideas that make it click.** A better example, a picture that would help, a question that
   should come before another one, a step that could be cut.
4. **Teachers:** tell us how a lesson would work (or not) in your classroom, and what's missing.

## How to send a note

- **From a lesson:** tap the flag in the top bar, **Suggest an improvement**. It opens a GitHub
  issue that already says which course, lesson and step you were on.
- **On GitHub:** [open an issue](https://github.com/open-aha/open-aha.github.io/issues/new/choose)
  and pick *Something's wrong* or *Suggest an improvement*.

Posting on GitHub needs a free account, and issues are public. For anything you'd rather not
post publicly, or to talk about using OpenAha in a school, write to
[contact@openaha.org](mailto:contact@openaha.org).

## Fixing a lesson yourself

The site is plain HTML, CSS and JavaScript, with no build step. You need Node.js and Python 3.
To run it locally:

```bash
npm install
```

```bash
npm start
```

`npm start` always serves the site on port 5173, so open <http://localhost:5173>. If that port
is already in use, it stops with an error; pick another port instead, for example
`python3 scripts/serve.py 8000`, and open <http://localhost:8000>.

To jump straight to a step, add `#/lesson/<course>/<lesson>/<step>` to the address (steps count
from 1). The link in an issue has this form.

Every course is one file in [`js/courses/`](js/courses). A lesson is a list of steps, and each
step is a plain object:

```js
{
  type: 'mcq',   // explain, mcq, multi, numeric, interactive or order
  title: 'Two answers?',
  prompt: 'What is $2 + 3 \\times 4$?',   // Markdown, with math in KaTeX
  choices: [
    { t: '14', ok: true },
    { t: '20', why: 'That adds first: (2 + 3) × 4. Multiplication comes before addition.' },
  ],
  explain: 'Shown behind the "Why?" button.',
}
```

Small wording fixes are the easiest place to start: find the text with a search, edit it, and
open a pull request. Before you open one, run:

```bash
npm run validate
```

It checks every course for broken steps and regenerates `js/courses/catalog.js`.

## How lessons should feel

Every lesson follows the same teaching principles:

- **Ask before telling.** Most steps ask the learner to predict, drag or decide something first.
- **Concrete before abstract.** A picture or a simulation first, the notation after.
- **One idea per step,** simplest case first.
- **Mistakes are information.** A wrong answer gets specific feedback, not just "wrong".
- **Short and plain.** Friendly, clear sentences. No jargon before it has been earned.

## Translations

Translating OpenAha into many languages is planned. If you would like to help with a language,
open an issue or write to [contact@openaha.org](mailto:contact@openaha.org) and say which one.

## License

By contributing, you agree that your contributions are licensed under the project's
[MIT License](LICENSE).
