document.addEventListener("DOMContentLoaded", () => {
  const prefixInput = document.getElementById("prefix");
  const subfolderInput = document.getElementById("subfolder");
  const flashEnabledInput = document.getElementById("flashEnabled");
  const imageFormatInput = document.getElementById("imageFormat");
  const rangeQualityInput = document.getElementById("rangeQualityInput");
  const qualityInput = document.getElementById("qualityInput");
  const qualityBlock = document.getElementById("qualityBlock");
  const saveButton = document.getElementById("saveButton");
  const hotkeyLink = document.getElementById("hotkeyLink");
  const copyHotkey = document.getElementById("copyHotkey");

  function setQualityEnabled(enabled) {
    if (!rangeQualityInput || !qualityInput || !qualityBlock) return;
    rangeQualityInput.disabled = !enabled;
    qualityInput.disabled = !enabled;
    qualityBlock.style.opacity = enabled ? "1" : "0.5";
  }

  function updateQualityEnabledByFormat() {
    if (!imageFormatInput) return;
    const fmt = (imageFormatInput.value || "png").toLowerCase();
    const enabled = fmt === "jpeg" || fmt === "webp";
    setQualityEnabled(enabled);
  }

  function updateQualityFromSlider() {
    if (!rangeQualityInput || !qualityInput) return;
    qualityInput.value = rangeQualityInput.value;
  }

  function updateQualityFromInput() {
    if (!rangeQualityInput || !qualityInput) return;
    let v = parseInt(qualityInput.value, 10);
    if (isNaN(v)) v = 92;
    v = Math.min(100, Math.max(10, v));
    qualityInput.value = v;
    rangeQualityInput.value = v;
  }

  if (rangeQualityInput)
    rangeQualityInput.addEventListener("input", updateQualityFromSlider);
  if (qualityInput)
    qualityInput.addEventListener("input", updateQualityFromInput);
  if (imageFormatInput)
    imageFormatInput.addEventListener("change", updateQualityEnabledByFormat);

  chrome.storage.local.get(
    ["prefix", "subfolder", "flashEnabled", "imageFormat", "rangeQualityInput"],
    (data) => {
      if (data.prefix) prefixInput.value = data.prefix;
      if (data.subfolder) subfolderInput.value = data.subfolder;
      if (typeof data.flashEnabled !== "undefined") {
        flashEnabledInput.checked = data.flashEnabled;
      }
      if (imageFormatInput && data.imageFormat) {
        imageFormatInput.value = data.imageFormat;
      }
      const q =
        typeof data.rangeQualityInput === "number"
          ? data.rangeQualityInput
          : 92;
      if (rangeQualityInput) rangeQualityInput.value = q;
      if (qualityInput) qualityInput.value = q;
      updateQualityEnabledByFormat();
    }
  );

  function showSuccess(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.visibility = "visible";
      setTimeout(() => {
        el.style.visibility = "hidden";
      }, 3000);
    }
  }

  saveButton.addEventListener("click", () => {
    chrome.storage.local.set(
      {
        prefix: prefixInput.value,
        subfolder: subfolderInput.value,
        flashEnabled: flashEnabledInput.checked,
        imageFormat: imageFormatInput ? imageFormatInput.value : "png",
        rangeQualityInput: rangeQualityInput
          ? parseInt(rangeQualityInput.value, 10)
          : 92,
      },
      () => {
        showSuccess("saveSuccess");
      }
    );
  });

  hotkeyLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  copyHotkey.addEventListener("click", () => {
    navigator.clipboard.writeText("Ctrl+Shift+Y").then(() => {
      showSuccess("copySuccess");
    });
  });
});
