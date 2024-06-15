# Auto-Captcha-Extension
This Chrome extension automatically fills the captcha on the SRM Student Portal login page using Tesseract.js for Optical Character Recognition (OCR).

# Features
Fills captcha on SRM Student Portal login page
Uses Tesseract.js for OCR
Bundles JavaScript code with webpack-cli

# Load the extension in Chrome:
Clone this repository
Open Chrome and go to chrome://extensions/.
Enable "Developer mode" in the top right corner.
Click "Load unpacked" and select this folder.
Usage
Navigate to the SRM Student Portal login page.
The extension will automatically detect the captcha image and attempt to solve it.
The solved captcha text will be filled in the corresponding field.

Disclaimer
This extension is for educational purposes only. Using automated tools to bypass security measures might violate the terms of service of the SRM Student Portal. Use this extension at your own risk.

Dependencies
Tesseract.js (included in the project)
webpack-cli

Contributing
Feel free to submit pull requests for improvements or bug fixes.
