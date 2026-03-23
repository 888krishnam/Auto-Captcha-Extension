# Auto-Captcha-Extension

This extension automatically fills the captcha on the SRM Student Portal login page using Chrome's built-in Prompt API (Gemini Nano) for image text extraction (previously powered by Tesseract.js). If you saved your email and password, the extension will fetch your email and password from chrome's local storage and automate the entire login process by filling in your email, password, and solved captcha, and submitting the form.

# Features
<ul>
  <li>Fills captcha on SRM Student Portal login page.</li>
  <li>Uses Chrome's Prompt API for multimodal AI image extraction.</li>
  <li>Uses Chrome's storage API for storing email and password.</li>
  <li>Bundles JavaScript code with webpack-cli.</li>
</ul>

# Load the extension in Chrome:
<ol>
  <li>Open Chrome and navigate to <b>chrome://flags/#optimization-guide-on-device-model</b> and <b>chrome://flags/#prompt-api-for-gemini-nano-multimodal-input</b>, set them both to <b>Enabled</b>, and restart Chrome.</li>
  <li>Clone this repository or download zip and extract it.</li>
  <li>Open Chrome and go to chrome://extensions/.</li>
  <li>Enable "Developer mode" in the top right corner.</li>
  <li>Click "Load unpacked" and select this folder.</li>
</ol>

# Usage
Navigate to the SRM Student Portal login page.
If stored, your email and password will be filled in the corresponding field.
The extension will automatically detect the captcha image and attempt to solve it.
The solved captcha text will be filled in the corresponding field and submit button will be pressed.

# Disclaimer
This extension is for educational purposes only. Using automated tools to bypass security measures might violate the terms of service of the SRM Student Portal. Use this extension at your own risk.

# Dependencies
webpack-cli (For development)

# Contributing
Feel free to submit pull requests for improvements or bug fixes.
