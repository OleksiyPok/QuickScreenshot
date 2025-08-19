async function convertDataURL(dataUrl, targetFormat) {
  const mime = targetFormat === "jpeg" ? "image/jpeg" : "image/webp";
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  let outBlob;
  if (canvas.convertToBlob) {
    outBlob = await canvas.convertToBlob({ type: mime, quality: 0.92 });
  } else {
    outBlob = blob;
  }
  const b64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(outBlob);
  });
  return b64;
}

chrome.action.onClicked.addListener((tab) => {
  takeScreenshot(tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "take-screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      takeScreenshot(tabs[0]);
    });
  }
});

function takeScreenshot(tab) {
  chrome.storage.local.get(
    ["prefix", "subfolder", "flashEnabled", "imageFormat", "imageQuality"],
    (data) => {
      const fmt = (data.imageFormat || "png").toLowerCase();
      const qNum =
        typeof data.imageQuality === "number" ? data.imageQuality : 92;
      const qualityFraction = Math.min(1, Math.max(0.1, qNum / 100));

      const captureFormat = fmt === "jpeg" ? "jpeg" : "png";
      const captureOpts =
        captureFormat === "jpeg"
          ? { format: "jpeg", quality: Math.round(qNum) }
          : { format: "png" };

      chrome.tabs.captureVisibleTab(
        tab.windowId,
        captureOpts,
        async (image) => {
          const now = new Date();
          const timestamp =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(now.getDate()).padStart(2, "0") +
            "_" +
            String(now.getHours()).padStart(2, "0") +
            "-" +
            String(now.getMinutes()).padStart(2, "0") +
            "-" +
            String(now.getSeconds()).padStart(2, "0") +
            "-" +
            String(now.getMilliseconds()).padStart(3, "0");

          const prefix = data.prefix || "screenshot";
          const subfolder = data.subfolder || "";
          const ext = fmt === "jpeg" ? "jpg" : fmt;
          let filename = prefix + "_" + timestamp + "." + ext;
          let path = subfolder ? subfolder + "/" + filename : filename;

          let urlToDownload = image;
          try {
            if (fmt === "webp") {
              urlToDownload = await convertDataURL(
                image,
                "webp",
                qualityFraction
              );
            } else if (fmt === "jpeg" && captureFormat !== "jpeg") {
              urlToDownload = await convertDataURL(
                image,
                "jpeg",
                qualityFraction
              );
            }
          } catch (e) {
            const fallbackExt = captureFormat === "jpeg" ? "jpg" : "png";
            filename = prefix + "_" + timestamp + "." + fallbackExt;
            path = subfolder ? subfolder + "/" + filename : filename;
          }

          chrome.downloads.download({
            url: urlToDownload,
            filename: path,
          });

          if (data.flashEnabled !== false) {
            flashIcon();
          }
        }
      );
    }
  );
}

function flashIcon() {
  chrome.action.setIcon({
    path: {
      16: "icons/screenshot_R_x16.png",
      48: "icons/screenshot_R_x48.png",
      128: "icons/screenshot_R_x128.png",
    },
  });
  setTimeout(() => {
    chrome.action.setIcon({
      path: {
        16: "icons/screenshot_B_x16.png",
        48: "icons/screenshot_B_x48.png",
        128: "icons/screenshot_B_x128.png",
      },
    });
  }, 150);
}
