import fetch from "node-fetch";

export async function fetchAPI(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw new Error("Failed to fetch data from Albion Online API.");
  }
}