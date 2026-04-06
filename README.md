# Daily culture stories

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/yvonnecworks-5477s-projects/v0-daily-culture-stories)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/pxd0NLfaXks)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/yvonnecworks-5477s-projects/v0-daily-culture-stories](https://vercel.com/yvonnecworks-5477s-projects/v0-daily-culture-stories)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/pxd0NLfaXks](https://v0.app/chat/pxd0NLfaXks)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Daily Story Automation

This repo now includes a GitHub Actions workflow at [`.github/workflows/generate-daily-story.yml`](/Users/yvonnechan/AIProjects/daily-culture-stories-v0/.github/workflows/generate-daily-story.yml) that can call the deployed Supabase Edge Function once per day.

To activate it in GitHub:

1. Open your repository settings in GitHub.
2. Add a repository variable named `SUPABASE_FUNCTION_URL`.
3. Set that variable to your deployed function endpoint, for example `https://<project-ref>.supabase.co/functions/v1/generate-daily-story`.
4. Add a repository secret named `SUPABASE_CRON_SECRET`.
5. Set that secret to the same `CRON_SECRET` value configured in your Supabase project.

The workflow is scheduled for `14:05 UTC` every day, which stays safely after midnight in `America/New_York` year-round, and it can also be run manually with optional `date` and `force` inputs.
