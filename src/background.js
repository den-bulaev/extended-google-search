import { v4 as uuidv4 } from 'uuid';

import { BackgroundActions, ChromeStorageKeys } from "./utils";

chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.storage.local.get(ChromeStorageKeys.tiles, (res) => {
    const params = res[ChromeStorageKeys.tiles].map((el) => el.value).join("");

    const updatedUrl = `https://www.google.com/search?q=${encodeURIComponent(
      text,
    )}${params}`;

    if (text.trim()) {
      chrome.tabs.update({ url: updatedUrl });
    }
  });
});

async function searchInExtensionGzip(searchList) {
  const fileUrl = chrome.runtime.getURL("geo.csv.gz");
  const response = await fetch(fileUrl);
  const gzipBlob = await response.blob();

  const decompressionStream = new DecompressionStream("gzip");
  const decompressedStream = gzipBlob.stream().pipeThrough(decompressionStream);

  const textResponse = new Response(decompressedStream);
  const reader = textResponse.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let { value, done } = await reader.read();
  let textBuffer = "";
  const results = [];

  while (!done) {
    textBuffer += decoder.decode(value, { stream: true });
    const lines = textBuffer.split("\n");

    textBuffer = lines.pop();

    lines.forEach((line) => {
      const cleanLine = line.trim().replace(/^"|"$/g, "");
      let isStringMatched = true;

      for (let searchWord of searchList) {
        const regex = new RegExp(`(?<![\\p{L}\\p{N}])${searchWord}(?![\\p{L}\\p{N}])`, "iu");

        if (!regex.test(cleanLine)) {
          isStringMatched = false;
          break;
        }
      }

      if (isStringMatched) {
        results.push({ id: uuidv4(), value: cleanLine });
      }
    });

    ({ value, done } = await reader.read());
  }

  return results;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.action) {
    case BackgroundActions.setStorage:
      chrome.storage.local.set(
        { [ChromeStorageKeys.tiles]: message.state },
        sendResponse("success"),
      );
      break;

    case BackgroundActions.searchGeo:
      searchInExtensionGzip(message.queryList)
        .then((results) => sendResponse({ success: true, data: results }))
        .catch((err) => sendResponse({ success: false, error: err.message }));

      return true;

    default:
      chrome.storage.local.get(ChromeStorageKeys.tiles, (res) => {
        sendResponse({ data: res[ChromeStorageKeys.tiles] });
      });
  }

  return true;
});
