# Setting up Dodo Payments

The app sells a **lifetime unlock** with a **license key**:

1. The buyer clicks **Unlock** in the app.
2. Dodo's checkout page opens in their browser.
3. After paying, Dodo emails them a license key.
4. They paste the key into the app, which activates it with Dodo.

No server is needed, and no secret keys are stored in the app.

> Dodo renames dashboard buttons now and then. If a label below doesn't match exactly, look for the closest one.

## 1. Create your account

1. Sign up at **dodopayments.com**.
2. You start in **Test Mode** (toggle at the top of the dashboard). Everything below can be done in test mode right away, with no money involved.
3. To take real payments you'll need to finish **business verification** (identity + bank/payout details). Start this now, since approval can take a few days.

## 2. Create the product (in Test Mode)

1. Go to **Products → Create product**.
2. Fill in:
   - **Type:** One-time payment (not a subscription)
   - **Name:** `Desk Diorama Pro – Lifetime`
   - **Description:** `Unlock every theme, outfit, weather effect and decoration in Desk Diorama. One payment, yours forever.`
   - **Price:** `1.00` USD (see the pricing note below)
   - **Tax category:** digital products / software
   - **Image:** optional (you can use `build/icon.png` from this project)
3. Turn on **License keys** for the product:
   - **Activation limit:** `3` (lets someone use it on a couple of Macs)
   - **Expiry:** never / no expiry
   - **Activation message** (shown in the email): `Open Desk Diorama → Unlock Pro, paste this key and press Activate.`
4. Optional: if there's a **redirect / return URL** setting, enter `deskdiorama://purchased`. After paying, the buyer is sent back into the app on the "paste your key" screen. If Dodo only accepts `https://` links, leave it empty; it's not required.
5. Save, then copy the **Product ID**. It looks like `pdt_XXXXXXXXXXXX`.

## 3. Send me

- The **test Product ID** (`pdt_…`)
- A **support email** to show in the app (where buyers write if something goes wrong)

I'll put them in `src/main/config.js`. You can also do it yourself: change `PRODUCT_ID` and `SUPPORT_EMAIL`. Product IDs aren't secret.

## 4. Test a purchase

1. Run the app, go to **Unlock Pro → Unlock for $1**. Dodo's test checkout opens.
2. Pay with the test card **4242 4242 4242 4242**, any future expiry date, any CVC, any name and address.
3. Check the email you entered. The license key should arrive (in test mode it's also visible in the dashboard under the payment / **License keys**).
4. Paste it into the app and press **Activate**. Everything should unlock.

## 5. Go live

1. Once your business is verified, switch the dashboard to **Live Mode**.
2. Live and test are separate, so **create the same product again in Live Mode** (with license keys turned on) and copy the new **live Product ID**.
3. Send me the live ID (or set `MODE = 'live'` and the new `PRODUCT_ID` in `src/main/config.js`) and we build the release version.

## Pricing note

Payment processors charge a fixed fee on every sale. Dodo's is roughly **4% + $0.40** per transaction (check their current pricing page). At **$1** you'd keep only about **$0.55** per sale. At **$1.99** you'd keep about **$1.50**, and at **$2.99** about **$2.45**. "$1 lifetime" is a great hook, so it's your call. Changing the price later is one field in Dodo plus one label in the app (`PRICE_LABEL` in `src/main/config.js`).
