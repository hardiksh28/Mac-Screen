# Installing Desk Diorama

1. Download **Desk-Diorama-…-universal.dmg** and open it.
2. Drag **Desk Diorama** into **Applications**.
3. Open it from Applications.

### "Apple could not verify Desk Diorama…"

Desk Diorama is an indie app that isn't registered with Apple yet, so macOS asks you to confirm the first time. This only happens once:

1. On the warning, click **Done** (or **OK**). Don't move it to the Bin.
2. Open **System Settings → Privacy & Security**.
3. Scroll down to the message *"Desk Diorama was blocked…"* and click **Open Anyway**.
4. Enter your Mac password and click **Open**.

On macOS 14 (Sonoma) or older you can instead **right-click the app → Open → Open**.

If macOS says the app **"is damaged and can't be opened"**, open **Terminal** and run this once, then open the app again:

```bash
xattr -cr "/Applications/Desk Diorama.app"
```

### After it opens

- Look for the **snowman icon in the menu bar** at the top of the screen. That's where all the controls are.
- To unlock everything: **snowman icon → Unlock Everything**, buy, then copy the **license key from your email**, paste it and press **Activate**.
- Optional: in Settings, turn on **Open at login**.

## Windows 10 & 11

1. Download **Desk-Diorama-Setup.exe** and run it. It installs and opens by itself.
2. If **"Windows protected your PC"** appears (the installer isn't code-signed yet), click **More info → Run anyway**.
3. Desk Diorama lives in the **system tray** (bottom-right, near the clock; it may be under the **^** arrow). Click it to open the app. Toys stand on top of your taskbar and the live wallpaper sits behind your desktop icons.
4. Unlocking works the same: paste your license key under **Unlock Pro → Activate**. Press **Ctrl+Alt+D** to hide or show the toys.

Questions: hardikhs2806@gmail.com
