# WorshipFlow Automator 🎵

> A high-performance, real-time worship management platform built with **Next.js**, **TypeScript**, and **Supabase**.

![Status](https://img.shields.io/badge/Status-Production-success) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 🚀 Live Demo
Check out the live application running on Vercel:
https://presentacionesiglesia.vercel.app/

> **Note for Reviewers:** The deployed version runs in **"Demo Mode"**. You can sign up, create playlists, and view data. Critical Admin features (creating/deleting songs) are restricted via **Supabase RLS policies** to preserve data integrity.

---

## ⚡️ Technical Highlights (Senior Engineering)

This project showcases advanced Frontend patterns and "Creative Engineering" principles:

- **Type-Safe Architecture:** extensive use of **TypeScript Discriminated Unions** to handle polymorphic data structures (Songs vs. Cards) without runtime errors.
- **Optimistic UI:** Drag-and-drop operations utilize optimistic updates to ensure instant feedback (0ms latency perception) before the server confirms.
- **Database Security:** Full implementation of **Row Level Security (RLS)** in Supabase to handle multi-tenancy and role-based access control (RBAC).
- **Performance:**
  - **Debouncing:** Custom hooks to handle heavy inputs without re-rendering.
  - **Server Actions:** Leveraging Next.js server capabilities for secure mutations.
  - **Real-time:** Supabase subscriptions for live playlist updates across devices.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode)
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 
- **State Management:** React Query (TanStack Query) + Context API

## 📦 Getting Started

To run this project locally:

1. **Clone the repo**
   ```bash
   git clone [https://github.com/robercarlo-dev/presentaciones-app-2025.git](https://github.com/robercarlo-dev/presentaciones-app-2025.git)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

