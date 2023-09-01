import { App, TFile, requestUrl } from "obsidian";

const NOUGAT_ENDPOINT = "http://127.0.0.1:8503/predict/";

export async function makeRequest(file: TFile, start: number, stop: number) {
  const formData = new FormData();
  formData.append("file", await tFileToFile(file));
  formData.append("start", start.toString());
  formData.append("stop", stop.toString());

  try {
    const response = await fetch(NOUGAT_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.text();
      console.log("API Response:", result);
    } else {
      console.error("API request failed with status:", response.status);
    }
  } catch (error) {
    console.error("API request error:", error);
  }
}

async function tFileToFile(tFile: TFile): Promise<File> {
  const content = await this.app.vault.read(tFile);
  const blob = new Blob([content], { type: "application/pdf" });
  const file = new File([blob], tFile.basename, { type: "application/pdf" });
  return file;
}
