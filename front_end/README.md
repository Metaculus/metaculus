This is a [Next.js](https://nextjs.org/) project bootstrapped with [
`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Install packages:

Ensure to add environment variables in `.env` file according to `.env.example`.

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

### Automatically generate missing translation messages

1. Add `OPENAI_API_KEY` to `front_end/.env` folder

```bash
npm run translations:generate
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
