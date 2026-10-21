# Email Collection Setup Guide - FREE Options ($0)

Your TDK website needs to collect waitlist emails. Here are **100% free** solutions with no backend required.

---

## Option 1: Google Forms ⭐ (RECOMMENDED - Easiest)

**Cost:** $0 | **Setup:** 5 minutes | **Reliability:** 100%

### Steps:

1. Go to [Google Forms](https://forms.new)
2. Create a new form titled "TDK CLI Waitlist"
3. Add one question:
   - Type: Short answer
   - Question: "Email address"
   - Required: Yes
4. Click "Send" (top right)
5. Click the link icon (🔗) to get the form URL
6. Extract the form ID from the URL:
   ```
   https://docs.google.com/forms/d/e/1FAIpQLSfXXXXXXXXXXXXXXXXXXXXXXXXXX/viewform
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    This is your FORM_ID
   ```
7. Find the email field entry ID:
   - Click "Send" → "Link" tab
   - Add a test email and submit
   - In the URL after submitting, look for `entry.1234567890=`
   - That's your entry ID

8. Update your HTML:
   ```html
   <form action="https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse" method="POST" target="_blank">
     <input type="email" name="entry.1234567890" placeholder="Enter your email" required />
     <button type="submit">Join Waitlist</button>
   </form>
   ```

**Pros:**
- Completely free forever
- Unlimited responses
- Data goes to Google Sheets automatically
- 99.9% uptime

**Cons:**
- Basic styling (you can iframe it though)

---

## Option 2: Tally.so (Modern & Beautiful)

**Cost:** $0 (free tier) | **Setup:** 10 minutes | **Limit:** Unlimited responses

### Steps:

1. Sign up at [Tally.so](https://tally.so)
2. Create a form with an email field
3. Enable "Embed" option
4. Copy the embed code
5. Paste into your website

**Pros:**
- Beautiful, modern UI
- Native embed (looks integrated)
- Analytics dashboard
- File uploads allowed

**Cons:**
- Free plan has Tally branding (small)
- You need an account

---

## Option 3: Airtable Form (Database + Form)

**Cost:** $0 (1,200 records) | **Setup:** 10 minutes

### Steps:

1. Create free Airtable account
2. Create a base called "TDK Waitlist"
3. Add a table with "Email" field
4. Click "Form" view
5. Share the form link or embed

**Pros:**
- Full database (spreadsheet view)
- API access for automation
- 1,200 records on free plan
- Can add more fields later

**Cons:**
- Learning curve
- Limited records on free plan

---

## Option 4: Netlify Forms (If you move to Netlify)

**Cost:** $0 (100 submissions/month) | **Setup:** 2 minutes

### Steps:

1. Move hosting to Netlify (free)
2. Add `data-netlify="true"` to your form:
   ```html
   <form name="waitlist" data-netlify="true">
     <input type="email" name="email" />
     <button type="submit">Join</button>
   </form>
   ```
3. Deploy → Forms appear in Netlify dashboard

**Pros:**
- No external service
- Built-in spam filtering
- Notifications to email/Slack

**Cons:**
- Must host on Netlify (not GitHub Pages)
- 100 submissions/month limit

---

## Option 5: Emailto Link (No Setup Required)

**Cost:** $0 | **Setup:** 0 minutes | **Reliability:** Depends on user's email client

Already implemented in your site as a fallback!

```html
<a href="mailto:vntu0412179+tdk-waitlist@gmail.com?subject=Waitlist: TDK CLI Early Access">
  vntu0412179+tdk-waitlist@gmail.com
</a>
```

**Pros:**
- Zero setup
- Works immediately
- Personal touch

**Cons:**
- User must have email client
- No automation
- Manual data entry

---

## Option 6: Simple GitHub Hack (Creative)

**Cost:** $0 | **Setup:** 10 minutes

Create a GitHub Issue template for waitlist signups:

1. Create `.github/ISSUE_TEMPLATE/waitlist.yml`:
   ```yaml
   name: Join Waitlist
   description: Get early access to TDK CLI
   title: "[Waitlist] Your email here"
   labels: ["waitlist"]
   body:
     - type: input
       id: email
       attributes:
         label: Email
         placeholder: your@email.com
       validations:
         required: true
   ```

2. Link to it from your site:
   ```html
   <a href="https://github.com/flisk-sh/website/issues/new?template=waitlist.yml">
     Join via GitHub
   </a>
   ```

**Pros:**
- Free forever
- Public transparency
- Built-in notifications

**Cons:**
- Users need GitHub account
- Public email (privacy concern)

---

## Our Recommendation

**Phase 1 (Now):** Use the emailto link that's already there + Google Forms

**Phase 2 (Later):** Switch to Tally.so when you want better UX

**Phase 3 (Scale):** Move to Netlify Forms or a proper backend when you have users

---

## Quick Setup: Google Forms (Do This Now)

1. Go to https://forms.new
2. Create form "TDK CLI Waitlist"
3. Add email field (required)
4. Click Send → Link
5. Copy the form ID from the URL
6. Find entry ID by submitting a test response
7. Update `_config.yml` with the form ID:
   ```yaml
   google_form_id: "1FAIpQLSfXXXXXXXXX"
   google_form_entry: "entry.1234567890"
   ```

Done! 🎉

---

## Testing Your Form

After setup, test by:
1. Opening your site
2. Entering a test email
3. Checking Google Forms responses
4. Verifying you received the data

---

## Need Help?

- **Google Forms stuck?** → https://support.google.com/docs/answer/6281888
- **Want custom backend later?** → Can set up AWS Lambda + DynamoDB ($0-1/month)
- **Need integrations?** → Zapier free tier connects Google Forms to everything
