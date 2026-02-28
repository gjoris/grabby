# macOS Code Signing Setup

This document explains how to set up self-signed code signing for macOS builds in GitHub Actions.

## Overview

Grabby uses **self-signed code signing** for macOS builds. This means:
- ✅ The app is cryptographically signed
- ✅ macOS recognizes the developer (Geroen Joris)
- ⚠️ On first launch, users see a Gatekeeper warning
- ✅ After clicking "Open", users don't see warnings again

This approach doesn't require an Apple Developer Account and works well for open-source projects.

## Prerequisites

You need:
- A Mac with Xcode command line tools installed
- Access to GitHub repository settings (to add secrets)
- The macOS keychain is properly set up

## Step 1: Create a Self-Signed Certificate

Run these commands on your Mac:

```bash
# Create a self-signed certificate valid for 10 years
security create-self-signed-cert \
  "Developer ID Application: Geroen Joris" \
  -k ~/Library/Keychains/login.keychain \
  -s 3650 \
  -t csrReqExt \
  -p "csrExtensionNames=CodeSigningExt"
```

Or use Keychain Access GUI:
1. Open Keychain Access
2. Keychain Access → Certificate Assistant → Create a Certificate
3. Name: `Developer ID Application: Geroen Joris`
4. Identity Type: Self Signed Root
5. Certificate Type: Code Signing
6. Validity: 3650 days (10 years)

## Step 2: Export the Certificate

Export the certificate in PKCS12 format (.p12):

```bash
# List your certificates to find the right one
security find-certificate -c "Developer ID Application: Geroen Joris" ~/Library/Keychains/login.keychain

# Export to PKCS12 format
security export-cert \
  -k ~/Library/Keychains/login.keychain \
  -t agg \
  -f pkcs12 \
  -o ~/Desktop/macos.p12 \
  -p "YourCertificatePassword" \
  -P "YourExportPassword" \
  "Developer ID Application: Geroen Joris"
```

**Troubleshooting**: If the above doesn't work, use macOS Keychain Access:
1. Open Keychain Access
2. Find "Developer ID Application: Geroen Joris"
3. Right-click → Export
4. Save as `macos.p12` with a strong password

## Step 3: Encode and Add to GitHub Secrets

Encode the certificate to base64:

```bash
base64 -i ~/Desktop/macos.p12 | tr -d '\n' | pbcopy
```

Then add to GitHub:
1. Go to your repository
2. Settings → Secrets and variables → Actions
3. Create new secret: `MACOS_CERTIFICATE`
4. Paste the base64 string
5. Create another secret: `MACOS_CERTIFICATE_PASSWORD`
6. Paste the password you used when creating/exporting the certificate

## Step 4: Test Locally (Optional)

To test code signing locally:

```bash
# Make sure keychain is unlocked (macOS will prompt)
# Then build and package:
npm run package

# The app in release/ should now be code-signed
codesign -dv release/Grabby.app
```

## Troubleshooting

### "No identity found" error
- Verify the certificate exists: `security find-certificate -c "Developer ID Application: Geroen Joris"`
- Unlock your keychain or re-login

### Gatekeeper warning persists
- This is normal for self-signed certificates
- Users see it only on first launch
- It's not a security issue for an open-source project

### GitHub Actions fails with "Certificate not found"
- Verify `MACOS_CERTIFICATE` and `MACOS_CERTIFICATE_PASSWORD` are correctly set
- Ensure the base64 encoding is complete (no line breaks)

### "certificateFile" not found in workflow
- Ensure the certificate is base64-encoded correctly
- The path `certs/macos.p12` must be created before packaging

## For End Users

Users on macOS will see this on first launch:

> "Grabby" cannot be opened because the developer cannot be verified.

**Solution:**
1. Click "Cancel"
2. Go to System Settings → Privacy & Security
3. Scroll down to "Grabby"
4. Click "Open Anyway"

Or: Right-click Grabby.app → Open → Open

After the first launch, the warning disappears and the app launches normally.

## References

- [macOS Code Signing](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [electron-builder macOS documentation](https://www.electron.build/configuration/mac)
- [Gatekeeper and code signing](https://support.apple.com/guide/mac-help/protect-your-mac-from-malware-mh40596/mac)
