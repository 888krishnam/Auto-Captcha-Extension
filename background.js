chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") { // If the extension is installed for the first time
        chrome.tabs.create({ url: chrome.runtime.getURL("./dist/index.html") });
    }
});
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("./dist/index.html") });
});