# Setup: your accounts (one time, about an hour, free)

Do these in order. Each step says what it unlocks. Steps 1-5 connect Instagram; step 6 is YouTube; step 7 is optional (App Review for DM automation and hashtags).

Meta renames menus often. If a button below has a different name, look for the closest match; the permissions and IDs are what matter.

## 1. Make your Instagram a professional account

Instagram app → Settings → **Account type and tools** → **Switch to professional account** → choose **Creator** (or Business).

Unlocks: insights, publishing, and the API at all. Personal accounts have no API.

## 2. Link it to a Facebook Page

You need a Facebook Page (create one at facebook.com/pages/create if you don't have one; it can be minimal).
Then link it: Instagram app → Edit profile → **Page** → connect your Page. (Or Meta Business Suite → Settings → Instagram accounts.)

Unlocks: the Facebook Login route of the API, which is the only one with competitor research (Business Discovery) and hashtag search.

Also: Instagram app → Settings → **Messages and story replies** → **Message controls** / **Connected tools** → allow access to messages. Needed for DMs from the API.

## 3. Create a Meta developer app

1. Go to https://developers.facebook.com → log in with the Facebook account that manages the Page → **My Apps** → **Create App**.
2. Use case: choose the Instagram / "Manage messaging & content on Instagram" option if offered, otherwise **Other** → app type **Business**.
3. Name it e.g. "Reel Factory". Leave it in **Development** mode: that is enough for your own account.
4. App settings → **Basic**: copy the **App ID** and **App Secret**.

## 4. Get a token with the right permissions

1. Open https://developers.facebook.com/tools/explorer → choose your app.
2. **User or Page** → **Get User Access Token** and tick:
   - `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`, `instagram_manage_messages`
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`, `business_management`
3. **Generate Access Token**, approve the dialog (pick your Page and Instagram account), copy the token. It lasts about an hour; the next step makes it permanent.

## 5. Connect the studio

```bash
cd ~/Projects/reel-studio
export META_APP_ID=...  META_APP_SECRET=...
python3 scripts/ig.py setup --token <the token from step 4>
python3 scripts/ig.py check
```

`setup` swaps the short token for a long-lived one, finds your Page and Instagram account, and saves a Page token that does not expire into `.env.local` (git-ignored, readable only by you). `check` should print your handle and follower count.

Then add the accounts you want to learn from (peers and competitors, professional accounts only):

```bash
python3 scripts/ig.py watch add account1 account2 account3
npm run weekly        # your insights + their posts + outliers + your report
```

Unlocks: publishing, insights, comments and public replies, competitor research.

## 6. YouTube Data API key (trend signals from Shorts)

1. https://console.cloud.google.com → create a project.
2. **APIs & Services** → **Library** → enable **YouTube Data API v3**.
3. **Credentials** → **Create credentials** → **API key**. Restrict it to the YouTube Data API.
4. Add `YT_API_KEY=...` to `~/Projects/reel-studio/.env.local`.

Free quota: 10,000 units a day; one search costs about 101, so roughly 90 searches a day.

## 7. Optional: App Review (DM automation to anyone, hashtag search)

In Development mode the app can only send private replies (comment → DM) to people who have a role on the app. That is enough to test the flow on yourself. To DM real commenters, and to use hashtag search, Meta requires:

1. **Business verification** (App settings → Basic → verify your business; Treint's registration documents).
2. **App Review** for Advanced Access to `instagram_manage_messages`, `pages_messaging`, `instagram_manage_comments`, the **Human Agent** feature, and **Instagram Public Content Access** (hashtags). Each needs a short screencast of the flow and a one-paragraph use description.

It is free but takes days to weeks. Until then:
- Use a Meta-approved partner (e.g. ManyChat, which has a free tier) for keyword DMs, with the trigger set and DM text from `07-caption.md`.
- `ig.py keyword` still posts the public replies and logs who asked.

## What stays manual

- **Trending audio**: Instagram's music library can't be added through the API. If you want it, post from the app or add the sound in the Instagram editor before publishing, at low volume under your voice.
- **Scheduling**: the API publishes immediately. Plan with `/reel-plan`, publish on the day.
