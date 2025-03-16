import { BackgroundActions, ChromeStorageKeys } from "./utils";

chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.storage.local.get(ChromeStorageKeys.tiles, (res) => {
    const params = res[ChromeStorageKeys.tiles].map((el) => el.value).join("");

    const updatedUrl = `https://www.google.com/search?q=${encodeURIComponent(
      text
    )}${params}`;

    if (text.trim()) {
      chrome.tabs.update({ url: updatedUrl });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.action) {
    case BackgroundActions.setStorage:
      chrome.storage.local.set(
        { [ChromeStorageKeys.tiles]: message.state },
        sendResponse("success")
      );
      break;

    default:
      chrome.storage.local.get(ChromeStorageKeys.tiles, (res) => {
        sendResponse({ data: res[ChromeStorageKeys.tiles] });
      });
  }

  return true;
});
