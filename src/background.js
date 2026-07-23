import { v4 as uuidv4 } from "uuid";

import { BackgroundActions, ChromeStorageKeys, getSearchURL } from "./utils";

chrome.omnibox.onInputEntered.addListener((query) => {
  chrome.storage.local.get(ChromeStorageKeys.tiles, (res) => {
    const searchURL = getSearchURL(query, res[ChromeStorageKeys.tiles]);

    if (query.trim()) {
      chrome.tabs.update({ url: searchURL });
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
        const regex = new RegExp(
          `(?<![\\p{L}\\p{N}])${searchWord}(?![\\p{L}\\p{N}])`,
          "iu",
        );

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

    case BackgroundActions.getPresets:
      chrome.storage.local.get(ChromeStorageKeys.presets, (res) => {
        sendResponse({ data: res[ChromeStorageKeys.presets] });
      });
      break;

    case BackgroundActions.addPreset:
      chrome.storage.local.get({ [ChromeStorageKeys.presets]: [] }, (res) => {
        if (
          res[ChromeStorageKeys.presets].find(
            (el) => el.key === message.state.key,
          )
        ) {
          sendResponse({ success: false, message: "presetNameExistsError" });
          return;
        }

        chrome.storage.local.set(
          {
            [ChromeStorageKeys.presets]: [
              ...res[ChromeStorageKeys.presets],
              message.state,
            ],
          },
          () => sendResponse({ success: true }),
        );
      });
      break;

    case BackgroundActions.deletePreset:
      chrome.storage.local.get({ [ChromeStorageKeys.presets]: [] }, (res) => {
        if (
          res[ChromeStorageKeys.presets].find(
            (el) => el.key === message.state.key,
          ) === -1
        ) {
          sendResponse({ success: false, message: "presetNotFoundError" });
          return;
        }

        const updatedPresets = res[ChromeStorageKeys.presets].filter(
          (preset) => preset.key !== message.state.key,
        );

        chrome.storage.local.set(
          {
            [ChromeStorageKeys.presets]: updatedPresets,
          },
          () => sendResponse({ data: updatedPresets, success: true }),
        );
      });
      break;

    default:
      chrome.storage.local.get(ChromeStorageKeys.tiles, (res) => {
        sendResponse({ data: res[ChromeStorageKeys.tiles] });
      });
  }

  return true;
});
